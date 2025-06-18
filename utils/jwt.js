// utils/jwt.js - Shared JWT utilities
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eternum-secret-key-2025';

const signToken = (payload, options = {}) => {
    const defaultOptions = { expiresIn: '30d' };
    return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const signWebSocketToken = (userId) => {
    return signToken({ userId, type: 'websocket' }, { expiresIn: '1h' });
};

const signLoginToken = (userId) => {
    return signToken({ userId, timestamp: Date.now() });
};

module.exports = {
    signToken,
    verifyToken,
    signWebSocketToken,
    signLoginToken,
    JWT_SECRET
};