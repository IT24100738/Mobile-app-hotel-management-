const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Experience = require('../models/Experience');
const Review = require('../models/Review');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const usersSeed = [
  {
    name: 'System Admin',
    email: 'admin@wmt.com',
    password: 'AdminPass123!',
    role: 'admin',
    phone: '555100001',
  },
  {
    name: 'Guest Customer',
    email: 'customer@wmt.com',
    password: 'CustomerPass123!',
    role: 'customer',
    phone: '555100002',
  },
  {
    name: 'Lena Guest',
    email: 'lena@wmt.com',
    password: 'GuestPass123!',
    role: 'customer',
    phone: '555100003',
  },
];

const roomsSeed = [
  {
    roomNumber: '101',
    type: 'Single',
    capacity: 1,
    pricePerNight: 45,
    status: 'Available',
    features: ['WiFi', 'Desk'],
    photos: [
      'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Cozy single room with workspace.',
  },
  {
    roomNumber: '202',
    type: 'Double',
    capacity: 2,
    pricePerNight: 75,
    status: 'Occupied',
    features: ['WiFi', 'Balcony', 'Mini Fridge'],
    photos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Comfort double room with balcony view.',
  },
  {
    roomNumber: '305',
    type: 'Suite',
    capacity: 4,
    pricePerNight: 140,
    status: 'Available',
    features: ['WiFi', 'Living Area', 'Coffee Maker'],
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Family suite with separate lounge area.',
  },
];

const experiencesSeed = [
  {
    title: 'Sunrise Hill Hike',
    description: 'Guided morning hike with light breakfast.',
    category: 'Hiking',
    price: 25,
    durationHours: 3,
    capacity: 12,
    scheduleDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'Available',
  },
  {
    title: 'City Night Tour',
    description: 'Explore local landmarks and street food spots.',
    category: 'City Tour',
    price: 30,
    durationHours: 4,
    capacity: 15,
    scheduleDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'Available',
  },
  {
    title: 'Wellness Yoga Session',
    description: 'Relaxing yoga class suitable for all levels.',
    category: 'Wellness',
    price: 18,
    durationHours: 2,
    capacity: 20,
    scheduleDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'Available',
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await Experience.deleteMany({});
    await Room.deleteMany({});
    await User.deleteMany({});

    const users = await User.create(usersSeed);
    const rooms = await Room.create(roomsSeed);
    const experiences = await Experience.create(experiencesSeed);

    const [adminUser, customerA, customerB] = users;

    const bookings = await Booking.create([
      {
        user: customerA._id,
        room: rooms[0]._id,
        checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'confirmed',
        notes: 'Prefers quiet floor',
        totalAmount: 90,
      },
      {
        user: customerB._id,
        room: rooms[2]._id,
        checkIn: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        notes: 'Early check-in request',
        totalAmount: 420,
      },
      {
        user: customerA._id,
        room: rooms[1]._id,
        checkIn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed',
        notes: 'Past stay sample record',
        totalAmount: 225,
      },
    ]);

    const payments = await Payment.create([
      {
        amount: 90,
        currency: 'USD',
        method: 'Card',
        status: 'Completed',
        user: customerA._id,
        booking: bookings[0]._id,
        reference: 'PAY-1001',
        paidAt: new Date(),
        notes: 'Advance payment',
      },
      {
        amount: 100,
        currency: 'USD',
        method: 'Cash',
        status: 'Pending',
        user: customerB._id,
        booking: bookings[1]._id,
        reference: 'PAY-1002',
        paidAt: new Date(),
        notes: 'Deposit pending confirmation',
      },
      {
        amount: 225,
        currency: 'USD',
        method: 'Online',
        status: 'Completed',
        user: customerA._id,
        booking: bookings[2]._id,
        reference: 'PAY-1003',
        paidAt: new Date(),
        notes: 'Historical completed payment',
      },
    ]);

    const reviews = await Review.create([
      {
        user: customerA._id,
        room: rooms[1]._id,
        rating: 5,
        comment: 'Great room service and clean facilities.',
        status: 'Visible',
      },
      {
        user: customerB._id,
        experience: experiences[0]._id,
        rating: 4,
        comment: 'The hike was fun and the guide was helpful.',
        status: 'Visible',
      },
      {
        user: customerA._id,
        experience: experiences[2]._id,
        rating: 5,
        comment: 'Excellent yoga class for beginners.',
        status: 'Visible',
      },
    ]);

    console.log('Sample data seeded successfully.');
    console.log(`Users: ${users.length}`);
    console.log(`Rooms: ${rooms.length}`);
    console.log(`Bookings: ${bookings.length}`);
    console.log(`Payments: ${payments.length}`);
    console.log(`Experiences: ${experiences.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log(`Admin login: ${adminUser.email} / AdminPass123!`);
    console.log(`Customer login: ${customerA.email} / CustomerPass123!`);
  } finally {
    await mongoose.disconnect();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed.');
    console.error(error.message);
    process.exit(1);
  });
