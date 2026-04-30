# WMT Hotel Management Use Cases

This document separates the **customer** and **admin** use cases for the six core components in the app:

1. Users
2. Rooms
3. Bookings
4. Payments
5. Experiences
6. Reviews

## Role Rules

- **Customer**: can only work with their own records.
- **Admin**: can manage all records across the system.
- **Read-only public browsing**: rooms and experiences can be viewed publicly.

## 1. Users

### Customer use cases
- Register a new customer account.
- Log in and log out.
- View and update their own profile information.

### Admin use cases
- Create new users with assigned roles.
- View the full user list.
- View any user profile.
- Update any user account.
- Delete user accounts.

## 2. Rooms

### Customer use cases
- Browse the room list.
- Open room details.
- View room photos, price, capacity, features, and availability.

### Admin use cases
- Create new rooms.
- Update room details.
- Upload or replace room photos.
- Delete rooms.
- Manage room status and availability.

## 3. Bookings

### Customer use cases
- Create a booking for themselves.
- View only their own bookings.
- Update their own booking request when allowed.
- Cancel their own booking.

### Admin use cases
- View all bookings.
- Create bookings for any user.
- Update any booking.
- Change booking status.
- Delete any booking.

## 4. Payments

### Customer use cases
- Create a payment for their own booking.
- View their own payment history.
- View payment status for their bookings.

### Admin use cases
- Create payment records.
- Update payment details.
- Link payments to bookings.
- Delete payment records.

## 5. Experiences

### Customer use cases
- Browse available experiences.
- View experience details, dates, prices, and capacity.

### Admin use cases
- Create new experiences.
- Update experience details.
- Change availability.
- Delete experiences.

## 6. Reviews

### Customer use cases
- Create a review for their own stay or activity.
- View their own reviews.
- Edit their own review.
- Delete their own review.

### Admin use cases
- View all reviews.
- Edit any review.
- Delete any review.
- Moderate review visibility.

## Summary Table

| Component | Customer | Admin |
|---|---|---|
| Users | Own profile only | Full user management |
| Rooms | Browse and view | Full room CRUD |
| Bookings | Own bookings only | Full booking CRUD |
| Payments | Own payment history | Full payment CRUD |
| Experiences | Browse and view | Full experience CRUD |
| Reviews | Own reviews only | Full review CRUD |

## Important Notes

- The UI must hide admin-only actions from customers.
- The backend must also block admin-only actions, even if a customer changes request data manually.
- Customers should never be able to edit another user’s bookings, payments, or reviews.
