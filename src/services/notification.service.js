const notificationLogRepository = require('../repository/notificationLog.repository');
const appointmentEnquiryRepository = require('../repository/appointmentEnquiry.repository');
const { NOTIFICATION_CHANNELS } = require('../data/appointmentOptions');
const {
  buildEnquiryCreatedMessage,
  buildStatusUpdatedMessage,
} = require('../templates/appointmentTemplates');
const eventBus = require('../utils/eventBus');
const ApiError = require('../utils/ApiError');

class NotificationService {
  constructor() {
    this.listenersInitialized = false;
  }

  /**
   * Registers domain event listeners once for in-process microservice communication.
   */
  initListeners() {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    eventBus.on('enquiry.created', async (event) => {
      try {
        await this.dispatchEnquiryCreated(event.payload);
      } catch (err) {
        console.error('[NotificationService] Failed on enquiry.created:', err.message);
      }
    });

    eventBus.on('enquiry.status_changed', async (event) => {
      try {
        await this.dispatchStatusUpdated(event.payload);
      } catch (err) {
        console.error('[NotificationService] Failed on enquiry.status_changed:', err.message);
      }
    });
  }

  async dispatchEnquiryCreated(enquiry, channel = NOTIFICATION_CHANNELS.WHATSAPP) {
    const messageBody = buildEnquiryCreatedMessage(enquiry);
    return notificationLogRepository.create({
      enquiryId: enquiry._id,
      referenceId: enquiry.referenceId,
      recipientName: enquiry.fullName,
      recipientMobile: `${enquiry.countryCode || '+91'}${enquiry.mobileNumber}`,
      channel,
      eventType: 'enquiry.created',
      messageBody,
      deliveryStatus: 'sent',
      metadata: {
        doctorName: enquiry.doctorName,
        status: enquiry.status,
      },
    });
  }

  async dispatchStatusUpdated(enquiry, channel = NOTIFICATION_CHANNELS.WHATSAPP) {
    const messageBody = buildStatusUpdatedMessage(enquiry);
    return notificationLogRepository.create({
      enquiryId: enquiry._id,
      referenceId: enquiry.referenceId,
      recipientName: enquiry.fullName,
      recipientMobile: `${enquiry.countryCode || '+91'}${enquiry.mobileNumber}`,
      channel,
      eventType: 'enquiry.status_changed',
      messageBody,
      deliveryStatus: 'sent',
      metadata: {
        doctorName: enquiry.doctorName,
        status: enquiry.status,
      },
    });
  }

  async listNotifications({ page = 1, limit = 20, channel, eventType } = {}) {
    const filter = {};
    if (channel) filter.channel = channel;
    if (eventType) filter.eventType = eventType;

    return notificationLogRepository.findAll({
      filter,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  async getNotificationsByEnquiryId(enquiryId) {
    const enquiry = await appointmentEnquiryRepository.findById(enquiryId);
    if (!enquiry) {
      throw new ApiError(404, 'Appointment enquiry not found');
    }
    return notificationLogRepository.findByEnquiryId(enquiryId);
  }

  async resendNotification(enquiryId, channel = NOTIFICATION_CHANNELS.WHATSAPP) {
    const enquiry = await appointmentEnquiryRepository.findById(enquiryId);
    if (!enquiry) {
      throw new ApiError(404, 'Appointment enquiry not found');
    }

    if (enquiry.status === 'pending') {
      return this.dispatchEnquiryCreated(enquiry, channel);
    }
    return this.dispatchStatusUpdated(enquiry, channel);
  }
}

module.exports = new NotificationService();
