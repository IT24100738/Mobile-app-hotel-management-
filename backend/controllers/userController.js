const User = require('../models/User');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
    });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Create user
        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            // Public registration always creates customer accounts.
            role: 'customer',
            phone: phone || '',
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400);
        next(err);
    }
};

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!name || !normalizedEmail || !password) {
            res.status(400);
            throw new Error('Name, email, and password are required');
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            role: role || 'customer',
            phone: phone || '',
        });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400);
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validate email & password
        if (!normalizedEmail || !password) {
            res.status(400);
            return next(new Error('Please provide an email and password'));
        }

        // Check for user
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        // user is already available in req due to the protect middleware
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error(`User not found with id of ${req.params.id}`);
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        delete payload.password;

        let user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error(`User not found with id of ${req.params.id}`);
        }

        user = await User.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400);
        next(err);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error(`User not found with id of ${req.params.id}`);
        }
        await user.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
