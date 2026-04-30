const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'customer'), getReviews)
  .post(protect, authorize('admin', 'customer'), createReview);
router
  .route('/:id')
  .get(protect, authorize('admin', 'customer'), getReview)
  .put(protect, authorize('admin', 'customer'), updateReview)
  .delete(protect, authorize('admin', 'customer'), deleteReview);

module.exports = router;
