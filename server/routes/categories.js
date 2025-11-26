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


// ************************************************* Get all categories for a user **********************************************************


// ************************************************* Delete a category by ID **********************************************************


// ************************************************* Update a category by ID **********************************************************



modules.exports = router;