const appointmentEnquiryRepository = require('../repository/appointmentEnquiry.repository');
const {
  doctorName: DEFAULT_DOCTOR,
  preferredTimeSlots,
  maxBookingsPerSlot,
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
      throw new ApiError(400, 'Invalid date format. Expected DD / MM / YYYY or YYYY-MM-DD');
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

    const concreteSlots = preferredTimeSlots.filter((slot) => slot !== 'Any time');
    const slots = concreteSlots.map((slot) => {
      const bookedCount = activeBookings.filter((b) => b.preferredTime === slot).length;
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
  async checkSlotAvailability(dateInput, preferredTime = 'Any time', doctorName = DEFAULT_DOCTOR) {
    const report = await this.getAvailableSlots(dateInput, doctorName);
    if (!report.isBookable) {
      return {
        available: false,
        reason: report.reason,
        ...report,
      };
    }

    if (!preferredTime || preferredTime === 'Any time') {
      const hasAnyOpenSlot = report.slots.some((s) => s.available);
      return {
        available: hasAnyOpenSlot,
        requestedTime: 'Any time',
        reason: hasAnyOpenSlot ? 'Slots available' : 'All slots are full for the selected date',
        ...report,
      };
    }

    const matchedSlot = report.slots.find((s) => s.slot === preferredTime);
    if (!matchedSlot) {
      // Allow custom time strings as long as the date itself is bookable
      return {
        available: true,
        requestedTime: preferredTime,
        reason: 'Custom time request accepted for team confirmation',
        ...report,
      };
    }

    return {
      available: matchedSlot.available,
      requestedTime: preferredTime,
      reason: matchedSlot.available
        ? 'Requested slot is available'
        : `Selected slot (${preferredTime}) is currently full`,
      ...report,
    };
  }
}

module.exports = new AvailabilityService();
