import s from './CategoryAdder.module.css';
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function CategoryAdder({ onCategoryAdded }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if(query.trim() != "") {
                api.get(`/categories/search?q=${query}`).then(res => setResults(res.data));
            } else {
                setResults([]);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div>
            <input
                className={s.input}
                type="text"
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Search or create category"
            />
            {showDropdown && results.length > 0 && (
                <div className={s.dropdown}>
                    {results.map(category => (
                        <div
                            key={category.id}
                            className={s.dropdownItem}
                            onClick={() => {
                                setSelectedCategory(category);
                                setQuery(category.name);
                                setShowDropdown(false);
                            }}
                        >
                            {category.name}
                        </div>
                    ))}
                </div>
            )}
            <button
                className={s.addButton}
                onClick={() => {
                    const categoryToAdd = selectedCategory || { name: query };
                    onCategoryAdded(categoryToAdd);
                    setQuery("");
                    setSelectedCategory(null);
                }}
                disabled={query.trim() === ""}
            >
                Add Category
            </button>
        </div>
    );
}