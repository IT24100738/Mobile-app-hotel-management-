const express = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin', 'customer'), getPayments)
  .post(protect, authorize('admin', 'customer'), createPayment);
router
  .route('/:id')
  .get(protect, authorize('admin', 'customer'), getPayment)
  .put(protect, authorize('admin'), updatePayment)
  .delete(protect, authorize('admin'), deletePayment);

module.exports = router;
