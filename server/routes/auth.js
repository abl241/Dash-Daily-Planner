const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { generateAccessToken } = require('../utils/authTokens');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// ********************************************************** User registration **********************************************************
router.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        if(!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: "Please provide first name, last name, email, and password" });
        }

        // Check if user already exists
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1",
            [ email ]
        );
        if(existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query("INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, created_at",
            [ first_name, last_name, email, hashedPassword ]
        );

        const token = generateAccessToken(newUser.rows[0]);
        
        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
            token
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error registering user" });
    }
});

// ********************************************************** User login **********************************************************
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await pool.query("SELECT * FROM users WHERE email = $1",
            [ email ]
        );

        if(user.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if(!validPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateAccessToken(user.rows[0]);
        const refreshToken = jwt.sign(
            { id: user.rows[0].id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // Refresh token valid for 7 days
        );

        const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

        await pool.query("INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, created_at, expires_at, revoked) VALUES ($1, $2, $3, $4, NOW(), $5, false)",
            [ user.rows[0].id, hashedToken, req.headers["user-agent"] || null, req.ip || null, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );

        res.json({
            message: "Login successful",
            user: {
                id: user.rows[0].id,
                first_name: user.rows[0].first_name,
                last_name: user.rows[0].last_name,
                email: user.rows[0].email,
            },
            token,
            });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error logging in" });
    }
});

// ********************************************************** Fetch user profile **********************************************************
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1",
            [ req.user.id ]
        );
        if(user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error fetching profile" });
    }
});

// ********************************************************** Refresh user session **********************************************************
router.post("/refresh", async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const tokenResult = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()",
            [ hashedToken ]
        );
        if(tokenResult.rows.length === 0) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if(err) {
                console.log("Refresh token verification error: ", err.message);
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }

            const newAccessToken = generateAccessToken({ id: decoded.id });
            res.json({ accessToken: newAccessToken });
        })
    } catch (err) {
        console.error("Error refreshing token: ", err.message);
        res.status(500).json({ message: "Server error refreshing token" });
    }
});

// ********************************************************** User logout **********************************************************
router.post("/logout", async (req, res) => {
    try {

        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }

        await pool.query("DELETE FROM refresh_tokens WHERE token = $1",
            [ refreshToken ]
        );

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.json({ message: "Logout successful" });
    } catch (err) {
        console.error("Error during logout: ", err.message);
        res.status(500).json({ message: "Server error during logout" });
    }
});

module.exports = router;