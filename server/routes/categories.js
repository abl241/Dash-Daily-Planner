const express = require('express');
const pool = require('../db');

const router = express.Router();

// ************************************************* Create a category **********************************************************
router.post('/', async (req, res) => {
    try {
        const userID = req.user.id;
        const { name, color } = req.body;

        if(!name || name.trim() === "") {
            return res.status(400).json({ message: "Category requires a name"});
        }
        
        const newCategory = await pool.query("INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
            [ userID, name, color ]
        );
        res.status(201).json(newCategory.rows[0]);
    } catch (err) {
        console.error("Error creating category: ", err.message);
        res.status(500).json({ message: "Server error creating category" });
    }
});

// ************************************************* Get a category by ID **********************************************************

router.get('/:id', async (req, res) => {
    try {
        const userID = req.user.id;
        const { id } = req.params;

        const category = await pool.query("SELECT * FROM categories WHERE id = $1 AND user_id = $2",
            [ id, userID ]
        );

        if(category.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category.rows[0]);
    } catch (err) {
        console.error("Error fetching category: ", err.message);
        res.status(500).json({ message: "Server error fetching category" });
    }
});


// ************************************************* Get all categories for a user **********************************************************

router.get('/', async (req, res) => {
    try {
        const userID = req.user.id;

        const categories = await pool.query("SELECT * FROM categories WHERE user_id = $1",
            [ userID ]
        );

        res.json(categories.rows);
    } catch (err) {
        console.error("Error fetching categories: ", err.message);
        res.status(500).json({ message: "Server error fetching categories" });
    }
});


// ************************************************* Delete a category by ID **********************************************************

router.delete('/:id', async (req, res) => {
    try {
        const userID = req.user.id;
        const { id } = req.params;

        const deleteCategory = await pool.query("DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *",
            [ id, userID ]
        );

        if(deleteCategory.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        console.error("Error deleting category: ", err.message);
        res.status(500).json({ message: "Server error deleting category" });
    }
});

// ************************************************* Update a category by ID **********************************************************

router.put('/:id', async (req, res) => {
    try {
        const userID = req.user.id;
        const { id } = req.params;
        const { name, color } = req.body;

        if(!name || name.trim() === "") {
            return res.status(400).json({ message: "Category requires a name"});
        }

        const updateCategory = await pool.query("UPDATE categories SET name = $1, color = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
            [ name, color, id, userID ]
        );

        if(updateCategory.rows.length === 0) {
            return res.status(404).json({ message: "Category not found or not authorized" });
        }

        res.json(updateCategory.rows[0]);
    } catch (err) {
        console.error("Error updating category: ", err.message);
        res.status(500).json({ message: "Server error updating category" });
    }
});

// ************************************************* Search for category **********************************************************

router.get('/search', async (req, res) => {
    try {
        const userID = req.user.id;
        const { q } = req.query || "";

        const results = await pool.query("SELECT FROM categories WHERE user_id = $1 AND name ILIKE $2 ORDER BY name",
            [ userID, `%${q}%` ]
        );

        res.json(results.rows);
    } catch (err) {
        console.error("Error searching categories: ", err.message);
        res.status(500).json({ message: "Server error searching categories" });
    }
});


modules.exports = router;