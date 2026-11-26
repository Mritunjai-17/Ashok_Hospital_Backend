const mongoose = require('mongoose');
const { NOTIFICATION_CHANNELS } = require('../data/appointmentOptions');

const notificationLogSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentEnquiry',
      required: true,
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientMobile: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.WHATSAPP,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    messageBody: {
      type: String,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      default: 'queued',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports =
  mongoose.models.NotificationLog ||
  mongoose.model('NotificationLog', notificationLogSchema);
