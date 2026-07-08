const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const ctrl = require('../controllers/userController');

router.use(auth);
router.get('/', ctrl.listTeam);
router.patch('/:id/role', allowRoles('admin'), ctrl.updateRole);

module.exports = router;
