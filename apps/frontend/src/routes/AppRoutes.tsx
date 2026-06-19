import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { useAuth } from '../features/auth/context/AuthContext';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { UsersPage } from '../features/users/pages/UsersPage';
import { CommunitiesPage } from '../features/communities/pages/CommunitiesPage';
import { CommunityDetailPage } from '../features/communities/pages/CommunityDetailPage';
import { CommunityChatPage } from '../features/community/pages/CommunityChatPage';
import { AnnouncementsPage } from '../features/announcements/pages/AnnouncementsPage';
import { CommunityMembersTab } from '../features/communities/components/CommunityMembersTab';
import { ProtectedRoute } from './ProtectedRoute';

function CommunityAdminChat() {
  const { activeCommunityId } = useAuth();
  if (!activeCommunityId) return <Navigate to="/dashboard" replace />;
  return <CommunityChatPage communityId={activeCommunityId} />;
}

function CommunityAdminAnnouncements() {
  const { activeCommunityId } = useAuth();
  if (!activeCommunityId) return <Navigate to="/dashboard" replace />;
  return <AnnouncementsPage communityId={activeCommunityId} />;
}

function CommunityAdminMembers() {
  const { activeCommunityId } = useAuth();
  if (!activeCommunityId) return <Navigate to="/dashboard" replace />;
  return <CommunityMembersTab communityId={activeCommunityId} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* SUPER_ADMIN routes */}
        <Route path="users" element={<UsersPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="communities/:id" element={<CommunityDetailPage />} />
        {/* COMMUNITY_ADMIN routes */}
        <Route path="members" element={<CommunityAdminMembers />} />
        <Route path="chat" element={<CommunityAdminChat />} />
        <Route path="announcements" element={<CommunityAdminAnnouncements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
