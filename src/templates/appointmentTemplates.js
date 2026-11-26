const { formatDisplayDate } = require('../utils/dateParser');

/**
 * Generates patient-facing notification messages for WhatsApp/SMS confirmation flows.
 */
function buildEnquiryCreatedMessage(enquiry) {
  const dateLabel = formatDisplayDate(enquiry.preferredDate);
  const timeLabel = enquiry.preferredTime || 'Any time';
  const preference = enquiry.consultationPreference
    ? ` (${enquiry.consultationPreference})`
    : '';

  return (
    `Hello ${enquiry.fullName}, we have received your appointment enquiry (${enquiry.referenceId}) ` +
    `with ${enquiry.doctorName} for ${dateLabel} (${timeLabel})${preference}. ` +
    `Our team will confirm your appointment availability shortly.`
  );
}

function buildStatusUpdatedMessage(enquiry) {
  const dateToUse = enquiry.confirmedDate || enquiry.preferredDate;
  const dateLabel = formatDisplayDate(dateToUse);
  const timeLabel = enquiry.confirmedTime || enquiry.preferredTime || 'Any time';

  switch (enquiry.status) {
    case 'confirmed':
      return (
        `Hello ${enquiry.fullName}, your consultation (${enquiry.referenceId}) with ` +
        `${enquiry.doctorName} is CONFIRMED for ${dateLabel} at ${timeLabel}.`
      );
    case 'rescheduled':
      return (
        `Hello ${enquiry.fullName}, your appointment request (${enquiry.referenceId}) with ` +
        `${enquiry.doctorName} has been rescheduled to ${dateLabel} (${timeLabel}).`
      );
    case 'cancelled':
      return (
        `Hello ${enquiry.fullName}, your appointment enquiry (${enquiry.referenceId}) with ` +
        `${enquiry.doctorName} has been cancelled. Please submit a new request if needed.`
      );
    case 'completed':
      return (
        `Hello ${enquiry.fullName}, thank you for consulting with ${enquiry.doctorName} ` +
        `(${enquiry.referenceId}). Wishing you good health.`
      );
    default:
      return (
        `Hello ${enquiry.fullName}, your appointment enquiry (${enquiry.referenceId}) ` +
        `status is now: ${enquiry.status}.`
      );
  }
}

module.exports = {
  buildEnquiryCreatedMessage,
  buildStatusUpdatedMessage,
};
