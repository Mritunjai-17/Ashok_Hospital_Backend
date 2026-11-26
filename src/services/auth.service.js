const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminUserRepository = require('../repository/adminUser.repository');
const { ADMIN_ROLES, APPROVAL_STATUS } = require('../models/adminUser.model');
const ApiError = require('../utils/ApiError');

class AuthService {
  getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not configured.');
    }
    return secret;
  }

  signToken(user) {
    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      this.getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, this.getJwtSecret());
  }

  async getSetupStatus() {
    const hasSuperAdmin = await adminUserRepository.hasSuperAdmin();
    return { hasSuperAdmin };
  }

  /**
   * Registers a CRM account through the site:
   * - If no Super Admin exists yet, the very first user becomes Super Admin (approved immediately).
   * - Every subsequent user is created as Staff in PENDING status until approved by Super Admin.
   */
  async register({ fullName, email, password }) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await adminUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const superAdminExists = await adminUserRepository.hasSuperAdmin();

    if (!superAdminExists) {
      try {
        const superAdmin = await adminUserRepository.create({
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: ADMIN_ROLES.SUPER_ADMIN,
          approvalStatus: APPROVAL_STATUS.APPROVED,
          approvedAt: new Date(),
          isActive: true,
          lastLoginAt: new Date(),
        });

        return {
          user: superAdmin,
          token: this.signToken(superAdmin),
          isFirstSuperAdmin: true,
        };
      } catch (err) {
        // If another concurrent request won the race to become Super Admin, fall through to pending staff
        if (err.code !== 11000 || err.keyPattern?.email) {
          throw err;
        }
      }
    }

    const staffUser = await adminUserRepository.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ADMIN_ROLES.STAFF,
      approvalStatus: APPROVAL_STATUS.PENDING,
      isActive: true,
    });

    return {
      user: staffUser,
      token: null,
      isFirstSuperAdmin: false,
    };
  }

  /**
   * Authenticates a CRM user only if approved by Super Admin and active.
   */
  async login({ email, password }) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await adminUserRepository.findByEmail(normalizedEmail, { includePassword: true });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.approvalStatus === APPROVAL_STATUS.PENDING) {
      throw new ApiError(
        403,
        'Your account is awaiting Super Admin approval. Access is locked until approved.'
      );
    }

    if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
      const reason = user.rejectionReason ? ` Reason: ${user.rejectionReason}` : '';
      throw new ApiError(403, `Your registration was rejected by the Super Admin.${reason}`);
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated by the Super Admin.');
    }

    const updatedUser = await adminUserRepository.updateById(user._id, {
      lastLoginAt: new Date(),
    });
    const token = this.signToken(updatedUser);

    return { user: updatedUser, token };
  }

  async listUsers({ approvalStatus, search, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (approvalStatus && Object.values(APPROVAL_STATUS).includes(approvalStatus)) {
      filter.approvalStatus = approvalStatus;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    return adminUserRepository.findAll({
      filter,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 50)),
    });
  }

  async approveUser(targetUserId, superAdminUser) {
    const target = await adminUserRepository.findById(targetUserId);
    if (!target) {
      throw new ApiError(404, 'User not found');
    }

    return adminUserRepository.updateById(targetUserId, {
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isActive: true,
      approvedBy: superAdminUser._id,
      approvedAt: new Date(),
      rejectionReason: '',
    });
  }

  async rejectUser(targetUserId, superAdminUser, rejectionReason = '') {
    const target = await adminUserRepository.findById(targetUserId);
    if (!target) {
      throw new ApiError(404, 'User not found');
    }
    if (target._id.toString() === superAdminUser._id.toString()) {
      throw new ApiError(400, 'Super Admin cannot reject their own account');
    }
    if (target.role === ADMIN_ROLES.SUPER_ADMIN) {
      throw new ApiError(403, 'Cannot reject a Super Admin account');
    }

    return adminUserRepository.updateById(targetUserId, {
      approvalStatus: APPROVAL_STATUS.REJECTED,
      isActive: false,
      approvedBy: superAdminUser._id,
      approvedAt: new Date(),
      rejectionReason: String(rejectionReason || '').trim(),
    });
  }

  async deleteUser(targetUserId, superAdminUser) {
    const target = await adminUserRepository.findById(targetUserId);
    if (!target) {
      throw new ApiError(404, 'User not found');
    }
    if (target._id.toString() === superAdminUser._id.toString()) {
      throw new ApiError(400, 'Super Admin cannot delete their own account');
    }
    if (target.role === ADMIN_ROLES.SUPER_ADMIN) {
      throw new ApiError(403, 'Cannot delete a Super Admin account');
    }

    return adminUserRepository.deleteById(targetUserId);
  }
}

module.exports = new AuthService();
