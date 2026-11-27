const {
  defaultCountryCode: DEFAULT_COUNTRY_CODE,
  normalizeBookingFor,
  normalizeConsultationType,
  normalizeAreaOfSupport,
  normalizeConsultationPreference,
  normalizePreferredTime,
  normalizeSupportTopics,
} = require('../data/appointmentOptions');

/**
 * Splits an optionally country-prefixed phone value (e.g. "+91 63879 78286")
 * into separate countryCode and 10-digit mobileNumber strings.
 */
function parsePhoneInput(rawPhone, rawCountryCode) {
  let countryCode = rawCountryCode !== undefined ? String(rawCountryCode).trim() : undefined;
  let mobileRaw = rawPhone !== undefined ? String(rawPhone).trim() : undefined;

  if (mobileRaw && mobileRaw.startsWith('+')) {
    const match = mobileRaw.match(/^(\+\d{1,4})[\s-]*(.+)$/);
    if (match) {
      if (!countryCode) {
        countryCode = match[1];
      }
      mobileRaw = match[2];
    }
  }

  return {
    countryCode: countryCode || (rawCountryCode !== undefined ? '' : undefined),
    mobileNumber: mobileRaw !== undefined ? mobileRaw.replace(/\D/g, '') : undefined,
  };
}

/**
 * Normalizes incoming appointment enquiry payloads (supporting both canonical
 * backend field names and frontend aliases/labels).
 *
 * @param {object} rawBody
 * @param {{ applyDefaults?: boolean }} [options]
 * @returns {object}
 */
function normalizeEnquiryPayload(rawBody = {}, { applyDefaults = false } = {}) {
  const normalized = {};

  if (rawBody.doctorName !== undefined) {
    normalized.doctorName = typeof rawBody.doctorName === 'string' ? rawBody.doctorName.trim() : rawBody.doctorName;
  }

  const rawFullName = rawBody.fullName !== undefined ? rawBody.fullName : rawBody.name;
  if (rawFullName !== undefined) {
    normalized.fullName = typeof rawFullName === 'string' ? rawFullName.trim() : rawFullName;
  }

  const rawPhone =
    rawBody.mobileNumber !== undefined
      ? rawBody.mobileNumber
      : rawBody.contactNumber !== undefined
        ? rawBody.contactNumber
        : rawBody.phone;

  if (rawPhone !== undefined || rawBody.countryCode !== undefined) {
    const { countryCode, mobileNumber } = parsePhoneInput(rawPhone, rawBody.countryCode);
    if (countryCode !== undefined) {
      normalized.countryCode = countryCode;
    } else if (applyDefaults) {
      normalized.countryCode = DEFAULT_COUNTRY_CODE;
    }
    if (mobileNumber !== undefined) {
      normalized.mobileNumber = mobileNumber;
    }
  } else if (applyDefaults) {
    normalized.countryCode = DEFAULT_COUNTRY_CODE;
  }

  const rawEmail = rawBody.email !== undefined ? rawBody.email : rawBody.emailAddress;
  if (rawEmail !== undefined) {
    normalized.email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;
  } else if (applyDefaults) {
    normalized.email = '';
  }

  if (rawBody.bookingFor !== undefined) {
    normalized.bookingFor = normalizeBookingFor(rawBody.bookingFor);
  }

  const rawConsultationType =
    rawBody.consultationType !== undefined ? rawBody.consultationType : rawBody.visitType;
  if (rawConsultationType !== undefined) {
    normalized.consultationType = normalizeConsultationType(rawConsultationType);
  }

  if (rawBody.areaOfSupport !== undefined) {
    normalized.areaOfSupport = normalizeAreaOfSupport(rawBody.areaOfSupport);
  } else if (applyDefaults) {
    normalized.areaOfSupport = '';
  }

  const rawTopics =
    rawBody.supportTopics !== undefined ? rawBody.supportTopics : rawBody.specificTopics;
  if (rawTopics !== undefined) {
    normalized.supportTopics = normalizeSupportTopics(rawTopics);
  } else if (applyDefaults) {
    normalized.supportTopics = [];
  }

  const rawConsultationPref =
    rawBody.consultationPreference !== undefined
      ? rawBody.consultationPreference
      : rawBody.howToConsult;
  if (rawConsultationPref !== undefined) {
    normalized.consultationPreference = normalizeConsultationPreference(rawConsultationPref);
  }

  if (rawBody.preferredDate !== undefined) {
    normalized.preferredDate = rawBody.preferredDate;
  }

  if (rawBody.preferredTime !== undefined) {
    normalized.preferredTime = normalizePreferredTime(rawBody.preferredTime);
  }

  if (rawBody.message !== undefined) {
    normalized.message = typeof rawBody.message === 'string' ? rawBody.message.trim() : rawBody.message;
  } else if (applyDefaults) {
    normalized.message = '';
  }

  const rawConsent =
    rawBody.consentAgreed !== undefined ? rawBody.consentAgreed : rawBody.consent;
  if (rawConsent !== undefined) {
    normalized.consentAgreed = rawConsent;
  }

  for (const adminField of ['status', 'confirmedDate', 'confirmedTime', 'staffNotes']) {
    if (rawBody[adminField] !== undefined) {
      normalized[adminField] =
        typeof rawBody[adminField] === 'string'
          ? rawBody[adminField].trim()
          : rawBody[adminField];
    }
  }

  return normalized;
}

module.exports = {
  parsePhoneInput,
  normalizeEnquiryPayload,
};
