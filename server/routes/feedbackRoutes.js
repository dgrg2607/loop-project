const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/feedbackController');

router.use(auth);

router.post(
  '/',
  [
    body('text').trim().notEmpty().withMessage('Feedback text is required').isLength({ max: 5000 }),
    body('channel').optional().isIn(['email', 'chat', 'survey', 'social', 'review', 'support_ticket']),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('customerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Customer email is invalid'),
  ],
  validate,
  ctrl.createFeedback
);

router.get('/export.csv', ctrl.exportCsv);
router.get('/', ctrl.listFeedback);
router.get('/:id', ctrl.getFeedback);
router.post('/bulk-delete', allowRoles('admin', 'manager'), ctrl.bulkDelete);
router.delete('/:id', allowRoles('admin', 'manager'), ctrl.deleteFeedback);

module.exports = router;
