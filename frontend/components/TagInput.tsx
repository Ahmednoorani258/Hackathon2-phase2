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
    <div className="relative">
      <div className={`input-luxury flex flex-wrap gap-2 min-h-[48px] items-center ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800 border border-primary-200 shadow-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="hover:text-error-600 disabled:opacity-50 transition-colors ml-1"
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
          placeholder={value.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder-gray-400"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-2 bg-white/90 backdrop-blur-md border border-gray-100 rounded-xl shadow-xl max-h-40 overflow-y-auto overflow-hidden">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="px-4 py-2.5 hover:bg-primary-50 cursor-pointer text-sm text-gray-700 hover:text-primary-700 transition-colors"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
