const Review = require('../models/Review');

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

exports.getReviews = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const query = isAdmin(req) ? {} : { user: req.user.id };
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, review.user?._id || review.user)) {
      res.status(403);
      throw new Error('Not authorized to access this review');
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['room', 'experience', 'rating', 'comment']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      delete payload.status;
    }

    const review = await Review.create(payload);
    const populated = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    let review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, review.user)) {
      res.status(403);
      throw new Error('Not authorized to update this review');
    }

    const payload = isAdmin(req)
      ? { ...req.body }
      : pick(req.body, ['room', 'experience', 'rating', 'comment']);
    if (!isAdmin(req)) {
      payload.user = req.user.id;
      delete payload.status;
    }

    review = await Review.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    requireAuthenticatedUser(req, res);
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }

    if (!isAdmin(req) && !isOwner(req, review.user)) {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    await review.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
