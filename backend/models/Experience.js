const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Hiking', 'Cooking Class', 'Wellness', 'City Tour', 'Other'],
      default: 'Other',
    },
    price: { type: Number, required: true, min: 0 },
    durationHours: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
    scheduleDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Available', 'Sold Out', 'Cancelled'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Experience', experienceSchema);
