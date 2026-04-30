const Booking = require('../models/Booking');

const isAdmin = (req) => req.user && req.user.role === 'admin';
const isOwner = (req, ownerId) => {
  if (!req.user || !ownerId) return false;
  const owner = ownerId && ownerId._id ? ownerId._id : ownerId;
  return String(owner) === String(req.user._id || req.user.id);
};
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

exports.getBookings = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const query = isAdmin(req) ? {} : { user: req.user.id };
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type status')
      .populate('user', 'name email role');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email role phone');
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, booking.user?._id || booking.user)) {
      res.status(403);
      throw new Error('Not authorized to access this booking');
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['room', 'checkIn', 'checkOut', 'notes']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      payload.status = 'pending';
      if (payload.totalAmount != null) {
        delete payload.totalAmount;
      }
    }

    const booking = await Booking.create(payload);
    const populated = await Booking.findById(booking._id)
      .populate('room', 'roomNumber type')
      .populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, booking.user)) {
      res.status(403);
      throw new Error('Not authorized to update this booking');
    }

    if (!isAdmin(req) && booking.status === 'completed') {
      res.status(403);
      throw new Error('Completed bookings cannot be edited');
    }

    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['room', 'checkIn', 'checkOut', 'notes']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      delete payload.status;
      delete payload.totalAmount;
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('room', 'roomNumber type')
      .populate('user', 'name email role');
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, booking.user)) {
      res.status(403);
      throw new Error('Not authorized to delete this booking');
    }

    if (!isAdmin(req) && booking.status === 'completed') {
      res.status(403);
      throw new Error('Completed bookings cannot be deleted');
    }

    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
