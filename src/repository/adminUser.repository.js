const { AdminUser, APPROVAL_STATUS } = require('../models/adminUser.model');

class AdminUserRepository {
  async create(payload) {
    return AdminUser.create(payload);
  }

  async findByEmail(email, { includePassword = false } = {}) {
    const query = AdminUser.findOne({ email: String(email).trim().toLowerCase() });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query;
  }

  async hasSuperAdmin() {
    const count = await AdminUser.countDocuments({ role: 'super_admin' });
    return count > 0;
  }

  async findById(id) {
    return AdminUser.findById(id);
  }

  async findAll({ filter = {}, page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      AdminUser.find(filter)
        .populate('approvedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdminUser.countDocuments(filter),
      AdminUser.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING }),
      AdminUser.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED }),
      AdminUser.countDocuments({ approvalStatus: APPROVAL_STATUS.REJECTED }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  }

  async updateById(id, updateData) {
    return AdminUser.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('approvedBy', 'fullName email');
  }

  async deleteById(id) {
    return AdminUser.findByIdAndDelete(id);
  }
}

module.exports = new AdminUserRepository();
