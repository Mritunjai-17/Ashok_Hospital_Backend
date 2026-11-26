import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminCrmDashboard from './components/AdminCrmDashboard';
import { connectDB } from '../src/config/db';
import authService from '../src/services/auth.service';
import adminUserRepository from '../src/repository/adminUser.repository';
import appointmentEnquiryRepository from '../src/repository/appointmentEnquiry.repository';
import { AUTH_COOKIE_NAME } from '../src/middlewares/authMiddleware';
import { ADMIN_ROLES, APPROVAL_STATUS } from '../src/models/adminUser.model';

export const dynamic = 'force-dynamic';

const VALID_TABS = new Set(['enquiries', 'availability', 'notifications', 'approvals']);

export default async function HomePage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  let currentUser = null;
  try {
    await connectDB();
    const decoded = authService.verifyToken(token);
    const user = await adminUserRepository.findById(decoded.sub);
    if (user && user.isActive && user.approvalStatus === APPROVAL_STATUS.APPROVED) {
      currentUser = JSON.parse(JSON.stringify(user));
    }
  } catch {
    currentUser = null;
  }

  if (!currentUser) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const requestedTab = typeof resolvedParams?.tab === 'string' ? resolvedParams.tab : 'enquiries';
  const initialTab =
    VALID_TABS.has(requestedTab) &&
    (requestedTab !== 'approvals' || currentUser.role === ADMIN_ROLES.SUPER_ADMIN)
      ? requestedTab
      : 'enquiries';

  const [enquiryResult, usersResult] = await Promise.all([
    appointmentEnquiryRepository.findAll({ page: 1, limit: 10 }),
    currentUser.role === ADMIN_ROLES.SUPER_ADMIN
      ? adminUserRepository.findAll({ page: 1, limit: 50 })
      : Promise.resolve(null),
  ]);

  const initialEnquiries = JSON.parse(JSON.stringify(enquiryResult.items || []));
  const initialMeta = {
    total: enquiryResult.total || 0,
    page: enquiryResult.page || 1,
    limit: enquiryResult.limit || 10,
    totalPages: enquiryResult.totalPages || 1,
  };
  const initialUsers = usersResult ? JSON.parse(JSON.stringify(usersResult.items || [])) : [];
  const initialUserCounts = usersResult?.counts || { pending: 0, approved: 0, rejected: 0 };

  return (
    <AdminCrmDashboard
      initialUser={currentUser}
      initialTab={initialTab}
      initialEnquiries={initialEnquiries}
      initialMeta={initialMeta}
      initialUsers={initialUsers}
      initialUserCounts={initialUserCounts}
    />
  );
}
