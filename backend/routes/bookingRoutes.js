const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'customer'), getBookings)
  .post(protect, authorize('admin', 'customer'), createBooking);
router
  .route('/:id')
  .get(protect, authorize('admin', 'customer'), getBooking)
  .put(protect, authorize('admin', 'customer'), updateBooking)
  .delete(protect, authorize('admin', 'customer'), deleteBooking);

module.exports = router;
