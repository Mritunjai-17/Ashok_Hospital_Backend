const appointmentEnquiryRepository = require('../repository/appointmentEnquiry.repository');
const {
  doctorName: DEFAULT_DOCTOR,
  preferredTimeSlots,
  maxBookingsPerSlot,
  FLEXIBLE_TIME_LABEL,
  normalizePreferredTime,
} = require('../data/appointmentOptions');
const { parsePreferredDate, formatDisplayDate, isPastDate } = require('../utils/dateParser');
const ApiError = require('../utils/ApiError');

class AvailabilityService {
  /**
   * Returns availability breakdown for all slots on a given date.
   */
  async getAvailableSlots(dateInput, doctorName = DEFAULT_DOCTOR) {
    const parsedDate = parsePreferredDate(dateInput);
    if (!parsedDate) {
      throw new ApiError(
        400,
        'Invalid date format. Expected YYYY-MM-DD, DD / MM / YYYY, or Sat, 28 Nov 2026'
      );
    }

    if (isPastDate(parsedDate)) {
      return {
        doctorName,
        date: parsedDate.toISOString(),
        displayDate: formatDisplayDate(parsedDate),
        isBookable: false,
        reason: 'Cannot schedule appointments in the past',
        slots: [],
      };
    }

    const activeBookings = await appointmentEnquiryRepository.countActiveBookingsForDate(
      parsedDate,
      doctorName
    );

    const concreteSlots = preferredTimeSlots.filter((slot) => slot !== FLEXIBLE_TIME_LABEL);
    const slots = concreteSlots.map((slot) => {
      const bookedCount = activeBookings.filter(
        (b) => normalizePreferredTime(b.preferredTime) === slot
      ).length;
      const remaining = Math.max(0, maxBookingsPerSlot - bookedCount);
      return {
        slot,
        bookedCount,
        maxBookings: maxBookingsPerSlot,
        remaining,
        available: remaining > 0,
      };
    });

    return {
      doctorName,
      date: parsedDate.toISOString(),
      displayDate: formatDisplayDate(parsedDate),
      isBookable: true,
      totalActiveBookings: activeBookings.length,
      slots,
    };
  }

  /**
   * Checks whether a specific date and optional time slot can accept a new enquiry.
   */
  async checkSlotAvailability(
    dateInput,
    preferredTime = FLEXIBLE_TIME_LABEL,
    doctorName = DEFAULT_DOCTOR
  ) {
    const report = await this.getAvailableSlots(dateInput, doctorName);
    if (!report.isBookable) {
      return {
        available: false,
        reason: report.reason,
        ...report,
      };
    }

    const normalizedTime = normalizePreferredTime(preferredTime) || FLEXIBLE_TIME_LABEL;

    if (normalizedTime === FLEXIBLE_TIME_LABEL) {
      const hasAnyOpenSlot = report.slots.some((s) => s.available);
      return {
        available: hasAnyOpenSlot,
        requestedTime: FLEXIBLE_TIME_LABEL,
        reason: hasAnyOpenSlot ? 'Slots available' : 'All slots are full for the selected date',
        ...report,
      };
    }

    const matchedSlot = report.slots.find((s) => s.slot === normalizedTime);
    if (!matchedSlot) {
      return {
        available: true,
        requestedTime: normalizedTime,
        reason: 'Custom time request accepted for team confirmation',
        ...report,
      };
    }

    return {
      available: matchedSlot.available,
      requestedTime: normalizedTime,
      reason: matchedSlot.available
        ? 'Requested slot is available'
        : `Selected slot (${normalizedTime}) is currently full`,
      ...report,
    };
  }
}

module.exports = new AvailabilityService();
