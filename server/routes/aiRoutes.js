const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/aiController');

router.use(auth);
router.post('/ask', [body('question').trim().notEmpty().withMessage('A question is required')], validate, ctrl.ask);
router.get('/voc-report', ctrl.generateVoCReport);

module.exports = router;
