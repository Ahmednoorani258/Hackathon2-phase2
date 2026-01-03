"use client";

import { useState, useEffect } from "react";

/**
 * TagInput Component
 * Input field for adding tags with autocomplete functionality
 * Allows users to select from existing tags or create new ones
 */

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
  disabled?: boolean;
}

export function TagInput({ value, onChange, availableTags = [], disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (inputValue && availableTags.length > 0) {
      const filtered = availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(tag)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, availableTags, value]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setInputValue("");
      setSuggestions([]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="tags" className="text-sm font-medium text-gray-700">
        Tags
      </label>
      <div className="relative">
        <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[42px] bg-white">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="hover:text-blue-900 disabled:opacity-50"
                aria-label={`Remove ${tag} tag`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <input
            type="text"
            id="tags"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Add tags..."
            className="flex-1 min-w-[120px] outline-none disabled:bg-gray-100"
          />
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
