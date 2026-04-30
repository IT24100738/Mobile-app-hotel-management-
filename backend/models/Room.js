const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: [true, 'Please add a room number'],
        unique: true,
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Please specify room type (e.g., Single, Double, Dormitory)'],
        enum: ['Single', 'Double', 'Dormitory', 'Suite'],
    },
    capacity: {
        type: Number,
        required: [true, 'Please add room capacity'],
        min: [1, 'Capacity cannot be less than 1'],
    },
    pricePerNight: {
        type: Number,
        required: [true, 'Please add price per night'],
    },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Occupied', 'Maintenance'],
        default: 'Available',
    },
    features: {
        type: [String],
        default: [],
    },
    photos: {
        type: [String], // Array of image paths/URLs (supports Multer file uploads)
        default: [],
    },
    description: {
        type: String,
        required: [true, 'Please add a room description'],
    }
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Room', roomSchema);
