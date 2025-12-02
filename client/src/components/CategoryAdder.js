import s from './CategoryAdder.module.css';
import React, { useState } from 'react';
import api from '../../api/axios';

export default function CategoryAdder({ onCategoryAdded }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    
}