import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RoomsPage from './pages/RoomsPage';
import BookingsPage from './pages/BookingsPage';
import ReviewsPage from './pages/ReviewsPage';
import UsersPage from './pages/UsersPage';

const Home = () => (
  <div>
    <h1>WMT Admin Dashboard</h1>
    <p>Placeholder admin dashboard. Implement CRUD pages under `src/pages`.</p>
    <ul>
      <li><Link to="/rooms">Rooms</Link></li>
      <li><Link to="/bookings">Bookings</Link></li>
      <li><Link to="/reviews">Reviews</Link></li>
      <li><Link to="/users">Users</Link></li>
    </ul>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </BrowserRouter>
  );
}
