const authService = require('../services/auth.service');
const { AUTH_COOKIE_NAME } = require('../middlewares/authMiddleware');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

const getSetupStatus = asyncHandler(async (_req, res) => {
  const status = await authService.getSetupStatus();
  res.status(200).json(new ApiResponse(200, status, 'Setup status fetched'));
});

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  if (result.isFirstSuperAdmin && result.token) {
    res.cookie(AUTH_COOKIE_NAME, result.token, getCookieOptions());
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: result.user, token: result.token, isFirstSuperAdmin: true },
          'Super Admin account created and signed in.'
        )
      );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: result.user, isFirstSuperAdmin: false },
        'Registration submitted. Your account is pending Super Admin approval before you can sign in.'
      )
    );
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
  res.status(200).json(new ApiResponse(200, { user, token }, 'Signed in successfully'));
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.status(200).json(new ApiResponse(200, null, 'Signed out successfully'));
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Authenticated user fetched'));
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await authService.listUsers(req.query);
  res.status(200).json(
    new ApiResponse(200, result.items, 'Registered CRM users fetched', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      counts: result.counts,
    })
  );
});

const approveUser = asyncHandler(async (req, res) => {
  const updated = await authService.approveUser(req.params.id, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, updated, `${updated.fullName} has been approved for CRM access`));
});

const rejectUser = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body || {};
  const updated = await authService.rejectUser(req.params.id, req.user, rejectionReason);
  res
    .status(200)
    .json(new ApiResponse(200, updated, `${updated.fullName} has been rejected`));
});

const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await authService.deleteUser(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, deleted, 'User removed'));
});

module.exports = {
  getSetupStatus,
  register,
  login,
  logout,
  getMe,
  listUsers,
  approveUser,
  rejectUser,
  deleteUser,
};
