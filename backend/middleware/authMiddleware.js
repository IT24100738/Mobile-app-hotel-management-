const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized to access this route'));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);
        if (!req.user) {
            res.status(401);
            return next(new Error('User not found for this token'));
        }
        next();
    } catch (err) {
        res.status(401);
        return next(new Error('Not authorized to access this route'));
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized to access this route'));
        }

        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
        }
        next();
    };
};
