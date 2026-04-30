const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    experience: { type: mongoose.Schema.Types.ObjectId, ref: 'Experience', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Visible', 'Hidden'],
      default: 'Visible',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
