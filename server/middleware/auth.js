const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if(!authHeader) {
        return res.status(401).json("No authorization header");
    }
    
    const parts = authHeader.split(' ');
    if(parts.length !== 2) {
        return res.status(401).json("Invalid authorization header format");
    }
    const scheme = parts[0];
    const token = parts[1];
    
    if(!/^Bearer$/i.test(scheme)) {
        return res.status(401).json("Format must be: Bearer <token>");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user || decoded;
        next();
    } catch (err) {
        console.error("JWT authentification failed: ", err.message);
        if(err.name === 'TokenExpiredError') {
            return res.status(401).json("Token expired");
        }
        return res.status(401).json("Invalid token");
    }
}

module.exports = authenticateToken;