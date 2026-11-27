require('dotenv').config();

const assert = require('assert');
const http = require('http');
const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../config/app');
const NotificationLog = require('../models/notificationLog.model');
const { AdminUser } = require('../models/adminUser.model');
const authService = require('../services/auth.service');

async function request(baseUrl, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

function getFutureDisplayDate(daysAhead = 3) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

async function startTempServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function runVerification() {
  await connectDB();

  const unifiedApp = createApp({ serviceMode: 'all', enableEventListeners: true });
  const { server, baseUrl } = await startTempServer(unifiedApp);

  const existingSuperAdmin = await AdminUser.findOne({ role: 'super_admin' });
  const testSuperEmail = `test.super.${Date.now()}@hospital.com`;
  const testStaffEmail = `test.staff.${Date.now()}@hospital.com`;
  let createdSuperId = null;
  let createdStaffId = null;
  let createdEnquiryId = null;

  try {
    // 1. Setup status & public endpoints
    const setupBefore = await request(baseUrl, 'GET', '/api/v1/auth/setup-status');
    assert.strictEqual(setupBefore.status, 200);

    const options = await request(baseUrl, 'GET', '/api/v1/enquiries/options');
    assert.strictEqual(options.status, 200);
    assert.ok(Array.isArray(options.json.data.bookingForOptions));
    assert.ok(Array.isArray(options.json.data.consultationTypes));
    assert.ok(Array.isArray(options.json.data.areasOfSupport));
    assert.ok(options.json.data.preferredTimeSlots.includes('Morning'));

    // 2. Unauthenticated CRM access must be blocked (401)
    const unauthEnquiries = await request(baseUrl, 'GET', '/api/v1/enquiries');
    assert.strictEqual(unauthEnquiries.status, 401);

    let superToken;
    if (!existingSuperAdmin) {
      // First registration through the site becomes Super Admin automatically
      const firstReg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
        fullName: 'First Super Admin',
        email: testSuperEmail,
        password: 'SuperPassword123!',
      });
      assert.strictEqual(firstReg.status, 201);
      assert.strictEqual(firstReg.json.data.isFirstSuperAdmin, true);
      assert.strictEqual(firstReg.json.data.user.role, 'super_admin');
      assert.strictEqual(firstReg.json.data.user.approvalStatus, 'approved');
      createdSuperId = firstReg.json.data.user._id;
      superToken = firstReg.json.data.token;
    } else {
      assert.strictEqual(setupBefore.json.data.hasSuperAdmin, true);
      if (existingSuperAdmin.approvalStatus !== 'approved' || !existingSuperAdmin.isActive) {
        throw new Error('Existing super_admin in database must be approved and active to run verification');
      }
      superToken = authService.signToken(existingSuperAdmin);
      console.log('Using existing super_admin for CRM, enquiry, availability & notification checks');
    }

    // 3. Subsequent registration becomes pending staff & cannot sign in
    const staffReg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
      fullName: 'Test Staff',
      email: testStaffEmail,
      password: 'StaffPassword123!',
    });
    assert.strictEqual(staffReg.status, 201);
    assert.strictEqual(staffReg.json.data.isFirstSuperAdmin, false);
    assert.strictEqual(staffReg.json.data.user.role, 'staff');
    assert.strictEqual(staffReg.json.data.user.approvalStatus, 'pending');
    createdStaffId = staffReg.json.data.user._id;

    const pendingLogin = await request(baseUrl, 'POST', '/api/v1/auth/login', {
      email: testStaffEmail,
      password: 'StaffPassword123!',
    });
    assert.strictEqual(pendingLogin.status, 403);

    // 4. Super Admin approves pending staff user
    const approveRes = await request(
      baseUrl,
      'PATCH',
      `/api/v1/auth/users/${createdStaffId}/approve`,
      {},
      superToken
    );
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.json.data.approvalStatus, 'approved');

    // 5. Approved staff signs in and accesses CRM, but cannot access Super Admin approvals
    const staffLogin = await request(baseUrl, 'POST', '/api/v1/auth/login', {
      email: testStaffEmail,
      password: 'StaffPassword123!',
    });
    assert.strictEqual(staffLogin.status, 200);
    const staffToken = staffLogin.json.data.token;

    const staffBlockedAdmin = await request(baseUrl, 'GET', '/api/v1/auth/users', null, staffToken);
    assert.strictEqual(staffBlockedAdmin.status, 403);

    // 6. Public patient form submission + strict validation + availability + CRM CRUD
    const futureDate = getFutureDisplayDate(5);
    const missingRequiredRes = await request(baseUrl, 'POST', '/api/v1/enquiries', {
      fullName: 'Aarav Sharma',
      mobileNumber: '9876543210',
      preferredDate: futureDate,
      consentAgreed: true,
    });
    assert.strictEqual(missingRequiredRes.status, 400);

    const patientEmail = `aarav.${Date.now()}@example.com`;
    const createRes = await request(baseUrl, 'POST', '/api/v1/enquiries', {
      bookingFor: 'Myself',
      consultationType: 'Yes, this is my first consultation.',
      areaOfSupport: 'Emotional & Behavioural Health',
      supportTopics: ['Stress', 'Sleep difficulties'],
      consultationPreference: 'Visit Ashok Hospital',
      preferredDate: futureDate,
      preferredTime: 'Morning',
      fullName: 'Aarav Sharma',
      countryCode: '+91',
      mobileNumber: '98765 43210',
      email: patientEmail,
      consentAgreed: true,
    });
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.json.data.consultationType, 'First consultation');
    assert.strictEqual(createRes.json.data.mobileNumber, '9876543210');
    assert.strictEqual(createRes.json.data.email, patientEmail);
    createdEnquiryId = createRes.json.data._id;
    const referenceId = createRes.json.data.referenceId;

    const availabilityRes = await request(
      baseUrl,
      'GET',
      `/api/v1/availability?date=${encodeURIComponent(futureDate)}`,
      null
    );
    assert.strictEqual(availabilityRes.status, 200);
    const morningSlot = availabilityRes.json.data.slots.find((s) => s.slot === 'Morning');
    assert.ok(morningSlot && morningSlot.bookedCount >= 1);

    const listRes = await request(
      baseUrl,
      'GET',
      `/api/v1/enquiries?search=${encodeURIComponent(patientEmail)}`,
      null,
      staffToken
    );
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.json.data.length, 1);
    assert.strictEqual(listRes.json.data[0].referenceId, referenceId);

    const statusRes = await request(
      baseUrl,
      'PATCH',
      `/api/v1/enquiries/${createdEnquiryId}/status`,
      {
        status: 'confirmed',
        confirmedDate: futureDate,
        confirmedTime: '10:30 AM',
      },
      staffToken
    );
    assert.strictEqual(statusRes.status, 200);

    await new Promise((r) => setTimeout(r, 400));

    const notifRes = await request(
      baseUrl,
      'GET',
      `/api/v1/notifications/enquiry/${createdEnquiryId}`,
      null,
      staffToken
    );
    assert.strictEqual(notifRes.status, 200);
    assert.ok(notifRes.json.data.length >= 2);

    // 7. Super Admin revokes staff -> staff token immediately rejected
    const rejectRes = await request(
      baseUrl,
      'PATCH',
      `/api/v1/auth/users/${createdStaffId}/reject`,
      { rejectionReason: 'Test revoked' },
      superToken
    );
    assert.strictEqual(rejectRes.status, 200);

    const revokedAccess = await request(baseUrl, 'GET', '/api/v1/enquiries', null, staffToken);
    assert.strictEqual(revokedAccess.status, 403);

    console.log('ALL FIRST-REGISTRATION SUPER ADMIN, AUTH, CRUD & MICROSERVICE CHECKS PASSED');
  } finally {
    if (createdEnquiryId) {
      await NotificationLog.deleteMany({ enquiryId: createdEnquiryId }).catch(() => {});
      const AppointmentEnquiry = require('../models/appointmentEnquiry.model');
      await AppointmentEnquiry.findByIdAndDelete(createdEnquiryId).catch(() => {});
    }
    if (createdStaffId) {
      await AdminUser.findByIdAndDelete(createdStaffId).catch(() => {});
    }
    if (createdSuperId) {
      await AdminUser.findByIdAndDelete(createdSuperId).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
