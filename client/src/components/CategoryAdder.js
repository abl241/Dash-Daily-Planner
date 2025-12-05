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

    const exists = results.some(
        c => c.name.toLowerCase() === query.toLowerCase()
    );

    const handleCreateNew = async () => {
        try {
            const res = await api.post("/categories", { name: query });
            const newCat = res.data;

            setSelectedCategory(newCat);
            setQuery(newCat.name);
            setShowDropdown(false);

            // Pass created category upward
            onCategoryAdded(newCat);
        } catch (err) {
            console.error(err);
        }
    };

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
            {showDropdown && (
                <div className={s.dropdown}>
                    {/* Existing results */}
                    {results.map(category => (
                        <div
                            key={category.id}
                            className={s.dropdownItem}
                            onClick={() => {
                                setSelectedCategory(category);
                                setQuery(category.name);
                                setShowDropdown(false);
                                onCategoryAdded(category);
                            }}
                        >
                            {category.name}
                        </div>
                    ))}

                    {/* Add new option — visible only when not an exact match */}
                    {query.trim() !== "" && !exists && (
                        <div
                            className={s.createNew}
                            onClick={handleCreateNew}
                        >
                            + Add "{query}" as a new category
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}