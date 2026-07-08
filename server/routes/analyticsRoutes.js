const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.use(auth);
router.get('/overview', ctrl.overview);
router.get('/sentiment-trend', ctrl.sentimentTrend);
router.get('/themes', ctrl.themes);
router.get('/channels', ctrl.channels);
router.get('/trends', ctrl.trends);

module.exports = router;
