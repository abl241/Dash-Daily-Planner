const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const pool = require('./db');
const authenticateToken = require('./middleware/auth');


// Middleware
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Protected routes
const tasksRoutes = require('./routes/tasks');
app.use('/tasks', authenticateToken, tasksRoutes);

const eventRoutes = require('./routes/events');
app.use('/events', authenticateToken, eventRoutes);

const remindersRoutes = require('./routes/reminders');
app.use('/reminders', authenticateToken, remindersRoutes);

const widgetsRoutes = require('./routes/widgets');
app.use('/widgets', authenticateToken, widgetsRoutes);

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});