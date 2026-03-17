/*
 * Inkrypt — TagInput component
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    maxTags?: number;
}

export default function TagInput({
    tags,
    onChange,
    suggestions = [],
    placeholder = 'Add tag...',
    maxTags = 10,
}: TagInputProps) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
    );

    const addTag = (tag: string) => {
        const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
        if (!clean || tags.includes(clean) || tags.length >= maxTags) return;
        onChange([...tags, clean]);
        setInput('');
        setShowSuggestions(false);
    };

    const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="relative">
            <div
                className="flex flex-wrap gap-1.5 min-h-[44px] w-full bg-white/50 border border-slate-200 rounded-xl px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all"
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {tags.length < maxTags && (
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={handleKey}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[80px] bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                    />
                )}
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                    {filteredSuggestions.slice(0, 8).map(s => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={() => addTag(s)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            #{s}
                        </button>
                    ))}
                </div>
            )}

            <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add · {tags.length}/{maxTags}</p>
        </div>
    );
}
