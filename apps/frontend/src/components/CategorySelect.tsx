/*
 * Inkrypt — CategorySelect component
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState } from 'react';
import { ChevronDown, Plus, Folder } from 'lucide-react';

interface CategorySelectProps {
    value: string;
    onChange: (category: string) => void;
    categories: string[];
}

export default function CategorySelect({ value, onChange, categories }: CategorySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const allCategories = ['General', ...categories.filter(c => c !== 'General')];

    const handleSelect = (cat: string) => { onChange(cat); setIsOpen(false); };

    const handleCreate = () => {
        const cat = newCategory.trim();
        if (!cat) return;
        onChange(cat);
        setNewCategory('');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 input-premium text-left"
            >
                <span className="flex items-center gap-2 text-slate-700">
                    <Folder className="w-4 h-4 text-slate-400" />
                    {value || 'General'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="max-h-44 overflow-y-auto">
                        {allCategories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleSelect(cat)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                    value === cat
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Folder className="w-3.5 h-3.5" />
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 p-2 flex gap-2">
                        <input
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="New category..."
                            className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={!newCategory.trim()}
                            className="p-1.5 bg-slate-900 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
