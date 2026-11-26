const express = require('express');
const controller = require('../controllers/availability.controller');

const router = express.Router();

router.get('/', controller.getAvailableSlots);
router.get('/check', controller.checkSlotAvailability);

module.exports = router;
