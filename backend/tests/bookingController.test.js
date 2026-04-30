const bookingController = require('../controllers/bookingController');
const Booking = require('../models/Booking');

jest.mock('../models/Booking');

describe('Booking RBAC', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: { id: 'b1' }, body: {}, user: { id: 'u2', _id: 'u2', role: 'customer' } };
    res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json() { }
    };
    next = jest.fn();
  });

  test('updateBooking should block non-owner non-admin', async () => {
    Booking.findById.mockResolvedValue({ _id: 'b1', user: 'u1', status: 'pending' });

    await bookingController.updateBooking(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Not authorized to update this booking/);
  });

  test('deleteBooking should block non-owner non-admin', async () => {
    Booking.findById.mockResolvedValue({ _id: 'b1', user: 'u1', status: 'pending', deleteOne: jest.fn() });

    await bookingController.deleteBooking(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Not authorized to delete this booking/);
  });
});
