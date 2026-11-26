const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.query);
  res.status(200).json(
    new ApiResponse(200, result.items, 'Notification logs fetched', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    })
  );
});

const getNotificationsByEnquiryId = asyncHandler(async (req, res) => {
  const logs = await notificationService.getNotificationsByEnquiryId(req.params.enquiryId);
  res.status(200).json(new ApiResponse(200, logs, 'Enquiry notification logs fetched'));
});

const resendNotification = asyncHandler(async (req, res) => {
  const { channel } = req.body || {};
  const log = await notificationService.resendNotification(req.params.enquiryId, channel);
  res.status(201).json(new ApiResponse(201, log, 'Notification dispatched'));
});

const receiveEvent = asyncHandler(async (req, res) => {
  const { eventName, enquiry } = req.body || {};
  if (!eventName || !enquiry) {
    throw new ApiError(400, 'eventName and enquiry payload are required');
  }

  let log = null;
  if (eventName === 'enquiry.created') {
    log = await notificationService.dispatchEnquiryCreated(enquiry);
  } else if (eventName === 'enquiry.status_changed') {
    log = await notificationService.dispatchStatusUpdated(enquiry);
  }

  res.status(202).json(new ApiResponse(202, log, `Event ${eventName} processed`));
});

module.exports = {
  listNotifications,
  getNotificationsByEnquiryId,
  resendNotification,
  receiveEvent,
};
