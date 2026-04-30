const express = require('express');
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

// Require middlewares
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Multer setup

router
    .route('/')
    .get(getRooms)
    .post(protect, authorize('admin'), upload.array('photos', 5), createRoom); 

router
    .route('/:id')
    .get(getRoom)
    .put(protect, authorize('admin'), upload.array('photos', 5), updateRoom)
    .delete(protect, authorize('admin'), deleteRoom);

module.exports = router;
