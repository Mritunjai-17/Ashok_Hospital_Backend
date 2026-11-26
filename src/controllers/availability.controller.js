const availabilityService = require('../services/availability.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date, doctorName } = req.query;
  if (!date) {
    throw new ApiError(400, 'Query parameter "date" is required (DD / MM / YYYY or YYYY-MM-DD)');
  }

  const report = await availabilityService.getAvailableSlots(date, doctorName);
  res.status(200).json(new ApiResponse(200, report, 'Availability slots fetched'));
});

const checkSlotAvailability = asyncHandler(async (req, res) => {
  const { date, time, doctorName } = req.query;
  if (!date) {
    throw new ApiError(400, 'Query parameter "date" is required (DD / MM / YYYY or YYYY-MM-DD)');
  }

  const result = await availabilityService.checkSlotAvailability(date, time, doctorName);
  res.status(200).json(new ApiResponse(200, result, 'Slot availability checked'));
});

module.exports = {
  getAvailableSlots,
  checkSlotAvailability,
};
