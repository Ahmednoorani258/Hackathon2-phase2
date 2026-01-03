#!/usr/bin/env python3
"""
Validate REST API implementations against OpenAPI 3.x specifications.
Supports FastAPI and Flask backends.
"""

import argparse
import ast
import importlib
import inspect
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Configure UTF-8 output for Windows compatibility
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import yaml
except ImportError:
    print("Error: PyYAML is required. Install with: pip install pyyaml")
    sys.exit(1)


class APIContractValidator:
    """Validates API implementation against OpenAPI specification."""

    def __init__(self, spec_path: Path, backend_module: str, strict: bool = False):
        self.spec_path = spec_path
        self.backend_module = backend_module
        self.strict = strict
        self.openapi_spec = self._load_openapi_spec()
        self.backend_routes = self._load_backend_routes()
        self.violations: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []

    def _load_openapi_spec(self) -> Dict[str, Any]:
        """Load and parse OpenAPI specification."""
        if not self.spec_path.exists():
            raise FileNotFoundError(f"OpenAPI spec not found: {self.spec_path}")

        content = self.spec_path.read_text(encoding='utf-8')

        if self.spec_path.suffix in ['.yaml', '.yml']:
            return yaml.safe_load(content)
        elif self.spec_path.suffix == '.json':
            return json.loads(content)
        else:
            raise ValueError(f"Unsupported spec format: {self.spec_path.suffix}")

    def _load_backend_routes(self) -> Dict[str, Dict[str, Any]]:
        """Extract route information from backend module."""
        try:
            module = importlib.import_module(self.backend_module)
        except ImportError as e:
            raise ImportError(f"Cannot import backend module '{self.backend_module}': {e}")

        routes = {}

        # Detect framework
        if hasattr(module, 'app'):
            app = module.app

            # FastAPI
            if app.__class__.__module__.startswith('fastapi'):
                return self._extract_fastapi_routes(app)

            # Flask
            elif app.__class__.__module__.startswith('flask'):
                return self._extract_flask_routes(app)

        # Fallback: try to find route decorators in source code
        return self._extract_routes_from_source(module)

    def _extract_fastapi_routes(self, app: Any) -> Dict[str, Dict[str, Any]]:
        """Extract routes from FastAPI application."""
        routes = {}

        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                if route.path not in routes:
                    routes[route.path] = {}

                for method in route.methods:
                    if method != 'HEAD':  # Skip HEAD method
                        routes[route.path][method] = {
                            'endpoint': route.endpoint.__name__ if hasattr(route, 'endpoint') else None,
                            'path_params': self._extract_path_params(route.path),
                            'request_body': self._extract_fastapi_request_body(route),
                            'responses': self._extract_fastapi_responses(route)
                        }

        return routes

    def _extract_flask_routes(self, app: Any) -> Dict[str, Dict[str, Any]]:
        """Extract routes from Flask application."""
        routes = {}

        for rule in app.url_map.iter_rules():
            path = rule.rule
            methods = rule.methods - {'HEAD', 'OPTIONS'}  # Exclude common auto-generated methods

            if path not in routes:
                routes[path] = {}

            for method in methods:
                routes[path][method] = {
                    'endpoint': rule.endpoint,
                    'path_params': self._extract_path_params(path),
                    'request_body': None,  # Flask doesn't have automatic schema extraction
                    'responses': None
                }

        return routes

    def _extract_routes_from_source(self, module: Any) -> Dict[str, Dict[str, Any]]:
        """Extract routes by parsing source code (fallback)."""
        routes = {}
        source_file = inspect.getsourcefile(module)

        if not source_file:
            return routes

        try:
            source = Path(source_file).read_text(encoding='utf-8')
            tree = ast.parse(source)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    for decorator in node.decorator_list:
                        # Match @app.get, @app.post, etc.
                        if isinstance(decorator, ast.Attribute):
                            method = decorator.attr.upper()
                            if method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                                if isinstance(decorator.value, ast.Call):
                                    path = self._extract_string_literal(decorator.value.args[0])
                                    if path:
                                        if path not in routes:
                                            routes[path] = {}
                                        routes[path][method] = {
                                            'endpoint': node.name,
                                            'path_params': self._extract_path_params(path),
                                            'request_body': None,
                                            'responses': None
                                        }
        except Exception as e:
            self.warnings.append({
                'type': 'route_extraction',
                'message': f'Could not extract routes from source: {e}'
            })

        return routes

    def _extract_string_literal(self, node: ast.AST) -> Optional[str]:
        """Extract string literal from AST node."""
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        return None

    def _extract_path_params(self, path: str) -> List[str]:
        """Extract path parameter names from route path."""
        # FastAPI: {id}, Flask: <id>
        fastapi_params = re.findall(r'\{([^}]+)\}', path)
        flask_params = re.findall(r'<([^>]+)>', path)
        return fastapi_params if fastapi_params else flask_params

    def _extract_fastapi_request_body(self, route: Any) -> Optional[Dict[str, Any]]:
        """Extract request body schema from FastAPI route."""
        if not hasattr(route, 'body_field'):
            return None

        body_field = route.body_field
        if body_field:
            return {
                'type': type(body_field.default).__name__ if body_field.default else 'object',
                'required': bool(body_field.required)
            }

        return None

    def _extract_fastapi_responses(self, route: Any) -> Dict[int, Any]:
        """Extract response schemas from FastAPI route."""
        responses = {}

        if hasattr(route, 'responses'):
            for status_code, response in route.responses.items():
                if status_code.isdigit():
                    responses[int(status_code)] = response

        return responses

    def validate(self) -> bool:
        """Run all validation checks."""
        print(f"\n{'='*70}")
        print(f"API Contract Validation")
        print(f"{'='*70}\n")
        print(f"Spec: {self.spec_path}")
        print(f"Backend: {self.backend_module}\n")

        # Get paths from OpenAPI spec
        paths = self.openapi_spec.get('paths', {})

        # Validate each endpoint
        for path, methods in paths.items():
            for method, spec in methods.items():
                method = method.upper()
                self._validate_endpoint(path, method, spec)

        # Check for extra endpoints (in impl but not spec)
        self._validate_extra_endpoints()

        # Report results
        self._report_results()

        return len(self.violations) == 0

    def _validate_endpoint(self, path: str, method: str, spec: Dict[str, Any]):
        """Validate a single endpoint against implementation."""
        impl = self.backend_routes.get(path, {}).get(method)

        # Check if endpoint exists
        if not impl:
            self.violations.append({
                'type': 'missing_endpoint',
                'path': path,
                'method': method,
                'message': f'Endpoint {method} {path} not found in implementation'
            })
            return

        # Validate path parameters
        self._validate_path_params(path, method, spec, impl)

        # Validate request body
        self._validate_request_body(path, method, spec, impl)

        # Validate responses
        self._validate_responses(path, method, spec, impl)

    def _validate_path_params(self, path: str, method: str, spec: Dict[str, Any], impl: Dict[str, Any]):
        """Validate path parameters."""
        spec_params = spec.get('parameters', [])
        spec_path_params = [p['name'] for p in spec_params if p.get('in') == 'path']
        impl_path_params = impl.get('path_params', [])

        # Check for missing parameters
        for param in spec_path_params:
            if param not in impl_path_params:
                self.violations.append({
                    'type': 'missing_path_param',
                    'path': path,
                    'method': method,
                    'message': f'Path parameter {param} not found in implementation'
                })

        # Check for extra parameters
        for param in impl_path_params:
            if param not in spec_path_params:
                self.violations.append({
                    'type': 'extra_path_param',
                    'path': path,
                    'method': method,
                    'message': f'Path parameter {param} in implementation but not in spec'
                })

    def _validate_request_body(self, path: str, method: str, spec: Dict[str, Any], impl: Dict[str, Any]):
        """Validate request body schema."""
        if method in ['GET', 'DELETE']:
            return  # GET and DELETE typically don't have bodies

        spec_body = spec.get('requestBody')
        impl_body = impl.get('request_body')

        if spec_body and not impl_body:
            self.violations.append({
                'type': 'missing_request_body',
                'path': path,
                'method': method,
                'message': 'Request body defined in spec but not in implementation'
            })

    def _validate_responses(self, path: str, method: str, spec: Dict[str, Any], impl: Dict[str, Any]):
        """Validate response schemas."""
        spec_responses = spec.get('responses', {})
        impl_responses = impl.get('responses', {})

        if not impl_responses:
            # Could not extract response info (common in Flask)
            return

        # Check documented responses
        for status_code in spec_responses:
            if status_code != 'default' and status_code.isdigit():
                code = int(status_code)
                if code not in impl_responses:
                    self.violations.append({
                        'type': 'missing_response',
                        'path': path,
                        'method': method,
                        'status_code': code,
                        'message': f'Response {code} documented in spec but not in implementation'
                    })

    def _validate_extra_endpoints(self):
        """Check for endpoints in implementation but not spec."""
        for path, methods in self.backend_routes.items():
            # Skip internal paths
            if path.startswith('/docs') or path.startswith('/openapi.json'):
                continue

            for method in methods:
                if path not in self.openapi_spec.get('paths', {}):
                    self.warnings.append({
                        'type': 'extra_endpoint',
                        'path': path,
                        'method': method,
                        'message': f'Endpoint {method} {path} in implementation but not in spec'
                    })

    def _report_results(self):
        """Print validation results."""
        total_checked = len(self.openapi_spec.get('paths', {}))
        passed = total_checked - len(self.violations)

        # Overall status
        if len(self.violations) > 0:
            status = "FAIL"
        else:
            status = "PASS"

        print(f"{'='*70}")
        print(f"Status: {status} ({passed}/{total_checked} endpoints validated)")
        print(f"{'='*70}\n")

        # Violations
        if self.violations:
            print("CONTRACT VIOLATIONS:")
            for i, violation in enumerate(self.violations, 1):
                print(f"\n{i}. {violation['message']}")
                print(f"   Path: {violation.get('path')}")
                print(f"   Method: {violation.get('method')}")
                if 'status_code' in violation:
                    print(f"   Status Code: {violation['status_code']}")
                print(f"   Type: {violation['type']}")
            print()

        # Warnings
        if self.warnings:
            print("WARNINGS:")
            for i, warning in enumerate(self.warnings, 1):
                print(f"\n{i}. {warning['message']}")
                if 'path' in warning:
                    print(f"   Path: {warning['path']}")
                    print(f"   Method: {warning['method']}")
            print()

        # Recommendations
        if self.violations:
            print("\nRECOMMENDATIONS:")
            print("- Review contract violations above")
            print("- Update implementation to match OpenAPI spec")
            print("- Or update OpenAPI spec if implementation is correct")
            print("- Re-run validation after fixes\n")


def main():
    parser = argparse.ArgumentParser(
        description='Validate API implementation against OpenAPI specification'
    )
    parser.add_argument(
        'spec_file',
        type=Path,
        help='Path to OpenAPI spec (YAML or JSON)'
    )
    parser.add_argument(
        'backend_module',
        type=str,
        help='Python module containing the API app (e.g., myapp.main)'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Fail on warnings in addition to violations'
    )

    args = parser.parse_args()

    try:
        validator = APIContractValidator(
            args.spec_file,
            args.backend_module,
            strict=args.strict
        )
        success = validator.validate()

        if args.strict and validator.warnings:
            success = False

        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
