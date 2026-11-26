const consultationOptions = require('../../data/consultationOptions.json');

const ENQUIRY_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

const ENQUIRY_STATUS_LIST = Object.values(ENQUIRY_STATUS);

const NOTIFICATION_CHANNELS = Object.freeze({
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  EMAIL: 'email',
});

module.exports = {
  ...consultationOptions,
  ENQUIRY_STATUS,
  ENQUIRY_STATUS_LIST,
  NOTIFICATION_CHANNELS,
};
