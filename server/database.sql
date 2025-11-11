CREATE DATABASE planner;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    -- Core info
    name VARCHAR(200) NOT NULL,
    due_date TIMESTAMP,
    category VARCHAR(100),
    notes TEXT,
    link TEXT,

    -- Status
    is_completed BOOLEAN DEFAULT false,

    -- Repeat
    is_recurring BOOLEAN DEFAULT false,
    repeat_rule TEXT,  -- e.g. "DAILY", "WEEKLY", or JSON like {"freq":"weekly","interval":2}

    -- Reminders (multiple possible, so we'll use a separate table)
    -- see reminders table below

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    -- Core info
    name VARCHAR(200) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    category VARCHAR(100),
    notes TEXT,
    link TEXT,

    -- Repeat
    is_recurring BOOLEAN DEFAULT false,
    repeat_rule TEXT,  -- same idea as tasks

    -- Reminders (multiple possible, separate table)

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    -- Can link to either a task or an event
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,

    reminder_time TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Widgets table
CREATE TABLE widgets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_width INT DEFAULT 1,
    default_height INT DEFAULT 1
);

-- User widgets table
CREATE TABLE user_widgets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    widget_id INT REFERENCES widgets(id) ON DELETE CASCADE,

    -- layout data from React Grid Layout
    x INT NOT NULL,
    y INT NOT NULL,
    w INT NOT NULL,
    h INT NOT NULL,
    i VARCHAR(50),

    static BOOLEAN DEFAULT FALSE,
    settings JSONB,

    -- new fields for your homepage vs widgets tab logic
    section VARCHAR(50) DEFAULT 'homepage',  -- 'homepage', 'widgets_tab', or 'both'
    is_visible BOOLEAN DEFAULT TRUE,         -- allow hiding widgets without deleting
    expanded_view JSONB,                     -- optional layout/data for expanded view

    updated_at TIMESTAMP DEFAULT NOW()
);


--Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    replaced_by_token VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
