const appointmentEnquiryRepository = require('../repository/appointmentEnquiry.repository');
const availabilityService = require('./availability.service');
const appointmentOptions = require('../data/appointmentOptions');
const { parsePreferredDate, isPastDate } = require('../utils/dateParser');
const eventBus = require('../utils/eventBus');
const ApiError = require('../utils/ApiError');

class AppointmentEnquiryService {
  getFormOptions() {
    return {
      doctorName: appointmentOptions.doctorName,
      defaultCountryCode: appointmentOptions.defaultCountryCode,
      consultationPreferences: appointmentOptions.consultationPreferences,
      preferredTimeSlots: appointmentOptions.preferredTimeSlots,
      statuses: appointmentOptions.ENQUIRY_STATUS_LIST,
    };
  }

  /**
   * Emits a domain event locally and optionally forwards it to a standalone
   * Notification microservice if NOTIFICATION_SERVICE_URL is configured.
   */
  async publishDomainEvent(eventName, enquiry) {
    eventBus.publish(eventName, enquiry);

    const remoteUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (remoteUrl) {
      try {
        await fetch(`${remoteUrl.replace(/\/$/, '')}/api/v1/notifications/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName, enquiry }),
        });
      } catch (err) {
        console.error(`[AppointmentEnquiryService] Remote event dispatch failed:`, err.message);
      }
    }
  }

  async verifyAvailability(date, preferredTime, doctorName) {
    const remoteUrl = process.env.AVAILABILITY_SERVICE_URL;
    if (remoteUrl) {
      try {
        const params = new URLSearchParams({
          date: date.toISOString().slice(0, 10),
          time: preferredTime || 'Any time',
          doctorName: doctorName || appointmentOptions.doctorName,
        });
        const response = await fetch(`${remoteUrl.replace(/\/$/, '')}/api/v1/availability/check?${params}`);
        if (response.ok) {
          const json = await response.json();
          return json.data;
        }
      } catch (err) {
        console.warn('[AppointmentEnquiryService] Falling back to local availability check:', err.message);
      }
    }

    return availabilityService.checkSlotAvailability(date, preferredTime, doctorName);
  }

  async createEnquiry(payload) {
    const parsedDate = parsePreferredDate(payload.preferredDate);
    if (!parsedDate) {
      throw new ApiError(400, 'Preferred date must be a valid date (DD / MM / YYYY or YYYY-MM-DD)');
    }
    if (isPastDate(parsedDate)) {
      throw new ApiError(400, 'Preferred date cannot be in the past');
    }

    const doctorName = payload.doctorName?.trim() || appointmentOptions.doctorName;
    const preferredTime = payload.preferredTime?.trim() || 'Any time';

    const availability = await this.verifyAvailability(parsedDate, preferredTime, doctorName);
    if (!availability.available) {
      throw new ApiError(409, availability.reason || 'Selected appointment slot is unavailable');
    }

    const enquiry = await appointmentEnquiryRepository.create({
      doctorName,
      fullName: payload.fullName.trim(),
      countryCode: payload.countryCode?.trim() || appointmentOptions.defaultCountryCode,
      mobileNumber: String(payload.mobileNumber).replace(/\D/g, ''),
      preferredDate: parsedDate,
      preferredTime,
      consultationPreference: payload.consultationPreference?.trim() || '',
      message: payload.message?.trim() || '',
      consentAgreed: Boolean(payload.consentAgreed),
      consentTimestamp: new Date(),
    });

    await this.publishDomainEvent('enquiry.created', enquiry);
    return enquiry;
  }

  async getAllEnquiries(query = {}) {
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.doctorName) {
      filter.doctorName = new RegExp(query.doctorName.trim(), 'i');
    }
    if (query.mobileNumber) {
      filter.mobileNumber = String(query.mobileNumber).replace(/\D/g, '');
    }
    if (query.date) {
      const parsed = parsePreferredDate(query.date);
      if (!parsed) {
        throw new ApiError(400, 'Invalid date filter format');
      }
      const nextDay = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
      filter.preferredDate = { $gte: parsed, $lt: nextDay };
    }
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ fullName: regex }, { mobileNumber: regex }, { referenceId: regex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    return appointmentEnquiryRepository.findAll({ filter, page, limit });
  }

  async getEnquiryById(id) {
    const enquiry = await appointmentEnquiryRepository.findById(id);
    if (!enquiry) {
      throw new ApiError(404, 'Appointment enquiry not found');
    }
    return enquiry;
  }

  async getEnquiryByReference(referenceId) {
    const enquiry = await appointmentEnquiryRepository.findByReferenceId(referenceId);
    if (!enquiry) {
      throw new ApiError(404, `Appointment enquiry ${referenceId} not found`);
    }
    return enquiry;
  }

  async updateEnquiry(id, payload) {
    const existing = await this.getEnquiryById(id);
    const updateData = {};

    const stringFields = [
      'doctorName',
      'fullName',
      'countryCode',
      'preferredTime',
      'consultationPreference',
      'message',
      'confirmedTime',
      'staffNotes',
    ];

    for (const field of stringFields) {
      if (payload[field] !== undefined) {
        updateData[field] = typeof payload[field] === 'string' ? payload[field].trim() : payload[field];
      }
    }

    if (payload.mobileNumber !== undefined) {
      updateData.mobileNumber = String(payload.mobileNumber).replace(/\D/g, '');
    }

    if (payload.preferredDate !== undefined) {
      const parsedDate = parsePreferredDate(payload.preferredDate);
      if (!parsedDate) {
        throw new ApiError(400, 'Preferred date must be valid (DD / MM / YYYY or YYYY-MM-DD)');
      }
      if (isPastDate(parsedDate)) {
        throw new ApiError(400, 'Preferred date cannot be in the past');
      }
      updateData.preferredDate = parsedDate;
    }

    if (payload.confirmedDate !== undefined) {
      if (payload.confirmedDate === null || payload.confirmedDate === '') {
        updateData.confirmedDate = null;
      } else {
        const parsedConfirmed = parsePreferredDate(payload.confirmedDate);
        if (!parsedConfirmed) {
          throw new ApiError(400, 'Confirmed date must be valid (DD / MM / YYYY or YYYY-MM-DD)');
        }
        updateData.confirmedDate = parsedConfirmed;
      }
    }

    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }

    const updated = await appointmentEnquiryRepository.updateById(id, updateData);

    await this.publishDomainEvent('enquiry.updated', updated);
    if (payload.status && payload.status !== existing.status) {
      await this.publishDomainEvent('enquiry.status_changed', updated);
    }

    return updated;
  }

  async updateEnquiryStatus(id, { status, confirmedDate, confirmedTime, staffNotes }) {
    return this.updateEnquiry(id, {
      status,
      confirmedDate,
      confirmedTime,
      staffNotes,
    });
  }

  async deleteEnquiry(id) {
    const deleted = await appointmentEnquiryRepository.deleteById(id);
    if (!deleted) {
      throw new ApiError(404, 'Appointment enquiry not found');
    }
    await this.publishDomainEvent('enquiry.deleted', deleted);
    return deleted;
  }
}

module.exports = new AppointmentEnquiryService();
