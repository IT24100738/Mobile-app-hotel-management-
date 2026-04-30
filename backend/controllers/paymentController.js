const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const isAdmin = (req) => req.user && req.user.role === 'admin';
const isOwner = (req, ownerId) => String(ownerId) === String(req.user.id);
const pick = (source, keys) => {
  const result = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  });
  return result;
};
const requireAuthenticatedUser = (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const query = isAdmin(req) ? {} : { user: req.user.id };
    const payments = await Payment.find(query)
      .populate({
        path: 'booking',
        select: 'checkIn checkOut status totalAmount',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'room', select: 'roomNumber type' },
        ],
      })
      .populate('user', 'name email role');
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'booking',
        select: 'checkIn checkOut status totalAmount',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'room', select: 'roomNumber type' },
        ],
      })
      .populate('user', 'name email role');

    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, payment.user?._id || payment.user)) {
      res.status(403);
      throw new Error('Not authorized to access this payment');
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['booking', 'notes', 'amount', 'currency', 'method', 'reference']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      payload.status = 'Completed';
      payload.paidAt = new Date();
    }

    if (!payload.booking) {
      res.status(400);
      throw new Error('Booking is required');
    }

    if (payload.booking) {
      const booking = await Booking.findById(payload.booking).select('user totalAmount status');
      if (!booking) {
        res.status(400);
        throw new Error('Invalid booking reference');
      }

      if (!isAdmin(req) && !isOwner(req, booking.user)) {
        res.status(403);
        throw new Error('Not authorized to create payment for this booking');
      }

      if (!isAdmin(req)) {
        const numericAmount = Number(payload.amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          payload.amount = Number(booking.totalAmount || 0);
        }

        if (!payload.amount || payload.amount <= 0) {
          res.status(400);
          throw new Error('A valid payment amount is required');
        }

        payload.currency = payload.currency || 'USD';
        payload.method = payload.method || 'Online';
      }
    }

    const payment = await Payment.create(payload);
    const populated = await Payment.findById(payment._id)
      .populate({
        path: 'booking',
        select: 'checkIn checkOut status totalAmount',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'room', select: 'roomNumber type' },
        ],
      })
      .populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    let payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, payment.user)) {
      res.status(403);
      throw new Error('Not authorized to update this payment');
    }

    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['booking', 'notes']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      delete payload.amount;
      delete payload.currency;
      delete payload.method;
      delete payload.status;
      delete payload.reference;
      delete payload.paidAt;
    }

    if (payload.booking) {
      const booking = await Booking.findById(payload.booking).select('user');
      if (!booking) {
        res.status(400);
        throw new Error('Invalid booking reference');
      }

      if (!isAdmin(req) && !isOwner(req, booking.user)) {
        res.status(403);
        throw new Error('Not authorized to link this booking');
      }
    }

    payment = await Payment.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'booking',
        select: 'checkIn checkOut status totalAmount',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'room', select: 'roomNumber type' },
        ],
      })
      .populate('user', 'name email role');

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, payment.user)) {
      res.status(403);
      throw new Error('Not authorized to delete this payment');
    }

    await payment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
