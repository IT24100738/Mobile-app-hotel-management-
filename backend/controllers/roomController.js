const Room = require('../models/Room');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find();
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        
        if (!room) {
            res.status(404);
            throw new Error(`Room not found with id of ${req.params.id}`);
        }
        
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (Admin)
exports.createRoom = async (req, res, next) => {
    try {
        // Handle file paths if Multer was used in the request
        if (req.files && req.files.length > 0) {
             req.body.photos = req.files.map(file => file.path);
        }
        
        const room = await Room.create(req.body);
        res.status(201).json({ success: true, data: room });
    } catch (error) {
        res.status(400); // Bad Request (e.g. Validation Error)
        next(error);
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
exports.updateRoom = async (req, res, next) => {
    try {
        let room = await Room.findById(req.params.id);
        
        if (!room) {
            res.status(404);
            throw new Error(`Room not found with id of ${req.params.id}`);
        }
        
        // Handle file paths if Multer was used in the request
        if (req.files && req.files.length > 0) {
             req.body.photos = req.files.map(file => file.path);
        }

        room = await Room.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        res.status(400); // Bad Request (e.g. Validation Error)
        next(error);
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
exports.deleteRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        
        if (!room) {
            res.status(404);
            throw new Error(`Room not found with id of ${req.params.id}`);
        }
        
        await room.deleteOne();
        
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
