const express = require('express');
const pool = require('../db');

const router = express.Router();


function mapTaskData(formData, userId) {
    const {
        title,
        notes,
        category,
        link,
        repeat,
        repeatRules,
        dueDate,
    } = formData;
    formattedDueDate = formatDateTime(dueDate);
    return {
        user_id: userId,
        name: title,
        due_date: formattedDueDate,
        category,
        notes,
        link,
        is_completed: false,
        is_recurring: repeat,
        repeat_rule: repeat ? JSON.stringify(repeatRules) : null,
        created_at: new Date(),
        updated_at: new Date(),
    };
};
function formatDateTime({ year, month, day, hour, minute, period }) {
    let h = parseInt(hour, 10);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    const monthPadded = month.toString().padStart(2, "0");
    const dayPadded = day.toString().padStart(2, "0");
    const hourPadded = h.toString().padStart(2, "0");
    const minutePadded = minute.toString().padStart(2, "0");

    return `${year}-${monthPadded}-${dayPadded} ${hourPadded}:${minutePadded}:00`;
};

// ********************************************************** Create a new task **********************************************************
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const data = mapTaskData(req.body, userId);

        const newTask = await pool.query("INSERT INTO tasks (user_id, name, due_date, category, notes, link, is_completed, is_recurring, repeat_rule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [ userId, data.name, data.due_date, data.category, data.notes, data.link, data.is_completed, data.is_recurring, data.repeat_rule ]
        );

        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error("Error creating task: ", err.message);
        res.status(500).json({ message: "Server error creating task" });
    }
});

// ************************************************* Get a task by ID **********************************************************

router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const task = await pool.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
            [ id, userId ]
        );

        if(task.rows.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(task.rows[0]);
    } catch (err) {
        console.error("Error fetching task: ", err.message);
        res.status(500).json({ message: "Server error fetching task" });
    }
});

// ************************************************* Get all tasks for a user **********************************************************

router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const tasks = await pool.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC",
            [ userId ]
        );

        res.json(tasks.rows);
    } catch (err) {
        console.error("Error fetching tasks: ", err.message);
        res.status(500).json({ message: "Server error fetching tasks" });
    }
});

// ************************************************* Delete a task **********************************************************

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleteTask = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
            [ id, userId]
        );

        if(deleteTask.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or not authorized" });
        }

        res.json("Task deleted successfully");
    } catch (err) {
        console.error("Error deleting task: ", err.message);
        res.status(500).json({ message: "Server error deleting task" });
    }
});


// ************************************************* Update a task **********************************************************

router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const {
            name,
            due_date,
            category,
            notes,
            link,
            is_completed,
            is_recurring,
            repeat_rule,
        } = req.body;

        const updateTask = await pool.query(`UPDATE tasks SET
            name = COALESCE($1, name),
            due_date = COALESCE($2, due_date),
            category = COALESCE($3, category),
            notes = COALESCE($4, notes),
            link = COALESCE($5, link),
            is_completed = COALESCE($6, is_completed),
            is_recurring = COALESCE($7, is_recurring),
            repeat_rule = COALESCE($8, repeat_rule),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $9 AND user_id = $10 RETURNING *`,
            [ name, due_date, category, notes, link, is_completed, is_recurring, repeat_rule, id, userId ]
        );
        
        if(updateTask.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or not authorized" });
        }

        res.json(updateTask.rows[0]);
    } catch (err) {
        console.error("Error updating task: ", err.message);
        res.status(500).json({ message: "Server error updating task" });
    }
});

module.exports = router;