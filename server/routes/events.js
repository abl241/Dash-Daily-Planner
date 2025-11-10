const express = require('express');
const pool = require('../db');

const router = express.Router();

function mapEventData(formData, userId) {
    const {
        title,
        notes,
        category,
        link,
        repeat,
        repeatRules,
        startTime,
        endTime,
    } = formData;
    const start_time = formatDateTime(startTime);
    const end_time = formatDateTime(endTime);
    return {
        user_id: userId,
        name: title,
        notes,
        category,
        link,
        is_recurring: repeat,
        repeat_rule: repeat ? JSON.stringify(repeatRules) : null,
        start_time,
        end_time,
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

// ********************************************************** Create a new event **********************************************************

router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const data = mapEventData(req.body, userId);

        const newEvent = await pool.query("INSERT INTO events (user_id, name, start_time, end_time, category, notes, is_recurring, repeat_rule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [ userId, data.name, data.start_time, data.end_time, data.category, data.notes, data.is_recurring, data.repeat_rule ]
        );

        res.status(201).json(newEvent.rows[0]); 
    } catch (err) {
        console.error("Error creating event: ", err.message);
        res.status(500).json({ message: "Server error creating event" });
    }
});


// ************************************************* Get an event by ID **********************************************************

router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const event = await pool.query("SELECT * FROM events WHERE id = $1 AND user_id = $2",
            [ id, userId ]
        );

        if(event.rows.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event.rows[0]);
    } catch (err) {
        console.error("Error fetching event: ", err.message);
        res.status(500).json({ message: "Server error fetching event" });
    }
});

// ************************************************* Get all events for a user **********************************************************

router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const events = await pool.query("SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC",
            [ userId ]
        );

        res.json(events.rows);
    } catch (err) {
        console.error("Error fetching events: ", err.message);
        res.status(500).json({ message: "Server error fetching events" });
    }
});

// ************************************************* Delete an event by ID **********************************************************

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleteEvent = await pool.query("DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING *",
            [ id, userId ]
        );

        if(deleteEvent.rows.length === 0) {
            return res.status(404).json({ message: "Event not found or not authorized" });
        }

        res.json({ message: "Event deleted successfully" });
    } catch (err) {
        console.error("Error deleting event: ", err.message);
        res.status(500).json({ message: "Server error deleting event" });
    }
});

// ************************************************* Update an event by ID **********************************************************

router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const {
            name,
            start_time,
            end_time,
            category,
            notes,
            is_recurring,
            repeat_rule,
        } = req.body;

        const updateEvent = await pool.query(`UPDATE events SET
            name = COALESCE($1, name),
            start_time = COALESCE($2, start_time),
            end_time = COALESCE($3, end_time),
            category = COALESCE($4, category),
            notes = COALESCE($5, notes),
            is_recurring = COALESCE($6, is_recurring),
            repeat_rule = COALESCE($7, repeat_rule),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND user_id = $9 RETURNING *`,
            [ name, start_time, end_time, category, notes, is_recurring, repeat_rule, id, userId ]
        );

        res.json(updateEvent.rows[0]);
    } catch (err) {
        console.error("Error updating event: ", err.message);
        res.status(500).json({ message: "Server error updating event" });
    }
});

module.exports = router;