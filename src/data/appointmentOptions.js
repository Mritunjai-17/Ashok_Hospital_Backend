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

const FLEXIBLE_TIME_LABEL = 'Flexible timing';

const BOOKING_FOR_ALIASES = {
  myself: 'Myself',
  'a family member': 'A family member',
  'family member': 'A family member',
  family: 'A family member',
  'someone else': 'Someone else',
  other: 'Someone else',
};

const CONSULTATION_TYPE_ALIASES = {
  'first consultation': 'First consultation',
  'yes, this is my first consultation.': 'First consultation',
  'yes, this is my first consultation': 'First consultation',
  first: 'First consultation',
  yes: 'First consultation',
  'follow-up': 'Follow-up',
  'follow up': 'Follow-up',
  followup: 'Follow-up',
  'no, i am booking a follow-up.': 'Follow-up',
  'no, i am booking a follow-up': 'Follow-up',
  no: 'Follow-up',
  'not sure': 'Not sure',
  "i'm not sure.": 'Not sure',
  "i'm not sure": 'Not sure',
  unsure: 'Not sure',
};

const CONSULTATION_PREFERENCE_ALIASES = {
  'visit ashok hospital': 'Visit Ashok Hospital',
  'in-person consultation': 'Visit Ashok Hospital',
  'in-person': 'Visit Ashok Hospital',
  'in person': 'Visit Ashok Hospital',
  'online consultation': 'Online Consultation',
  'video consultation': 'Online Consultation',
  'phone consultation': 'Online Consultation',
  online: 'Online Consultation',
  'speak with the appointment team': 'Speak With the Appointment Team',
  'appointment team': 'Speak With the Appointment Team',
};

const PREFERRED_TIME_ALIASES = {
  morning: 'Morning',
  'morning (09:00 am - 12:00 pm)': 'Morning',
  afternoon: 'Afternoon',
  'afternoon (12:00 pm - 04:00 pm)': 'Afternoon',
  evening: 'Evening',
  'evening (04:00 pm - 08:00 pm)': 'Evening',
  'flexible timing': 'Flexible timing',
  flexible: 'Flexible timing',
  'any time': 'Flexible timing',
  anytime: 'Flexible timing',
};

function createCanonicalLookup(options, extraAliases = {}) {
  const map = new Map();
  for (const option of options || []) {
    map.set(option.toLowerCase(), option);
  }
  for (const [alias, canonical] of Object.entries(extraAliases)) {
    map.set(alias.toLowerCase(), canonical);
  }
  return map;
}

const bookingForLookup = createCanonicalLookup(
  consultationOptions.bookingForOptions,
  BOOKING_FOR_ALIASES
);
const consultationTypeLookup = createCanonicalLookup(
  consultationOptions.consultationTypes,
  CONSULTATION_TYPE_ALIASES
);
const areaOfSupportLookup = createCanonicalLookup(consultationOptions.areasOfSupport);
const consultationPreferenceLookup = createCanonicalLookup(
  consultationOptions.consultationPreferences,
  CONSULTATION_PREFERENCE_ALIASES
);
const preferredTimeLookup = createCanonicalLookup(
  consultationOptions.preferredTimeSlots,
  PREFERRED_TIME_ALIASES
);

function normalizeWithLookup(value, lookup) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return lookup.get(trimmed.toLowerCase()) || trimmed;
}

function normalizeBookingFor(value) {
  return normalizeWithLookup(value, bookingForLookup);
}

function normalizeConsultationType(value) {
  return normalizeWithLookup(value, consultationTypeLookup);
}

function normalizeAreaOfSupport(value) {
  return normalizeWithLookup(value, areaOfSupportLookup);
}

function normalizeConsultationPreference(value) {
  return normalizeWithLookup(value, consultationPreferenceLookup);
}

function normalizePreferredTime(value) {
  return normalizeWithLookup(value, preferredTimeLookup);
}

function normalizeSupportTopics(topics) {
  if (topics === undefined || topics === null || topics === '') return [];
  const items = Array.isArray(topics) ? topics : [topics];
  const seen = new Set();
  const normalized = [];

  for (const item of items) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(trimmed);
    }
  }

  return normalized;
}

module.exports = {
  ...consultationOptions,
  ENQUIRY_STATUS,
  ENQUIRY_STATUS_LIST,
  NOTIFICATION_CHANNELS,
  FLEXIBLE_TIME_LABEL,
  normalizeBookingFor,
  normalizeConsultationType,
  normalizeAreaOfSupport,
  normalizeConsultationPreference,
  normalizePreferredTime,
  normalizeSupportTopics,
};
