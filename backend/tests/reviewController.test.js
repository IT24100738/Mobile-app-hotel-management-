const reviewController = require('../controllers/reviewController');
const Review = require('../models/Review');

jest.mock('../models/Review');

describe('Review RBAC', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: { id: 'r1' }, body: {}, user: { id: 'u2', _id: 'u2', role: 'customer' } };
    res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json() { }
    };
    next = jest.fn();
  });

  test('updateReview should block non-owner non-admin', async () => {
    Review.findById.mockResolvedValue({ _id: 'r1', user: 'u1' });

    await reviewController.updateReview(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Not authorized to update this review/);
  });

  test('deleteReview should block non-owner non-admin', async () => {
    Review.findById.mockResolvedValue({ _id: 'r1', user: 'u1', deleteOne: jest.fn() });

    await reviewController.deleteReview(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/Not authorized to delete this review/);
  });
});
