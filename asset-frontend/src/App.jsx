import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';

// Layout
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';

// Pages - Use lazy loading to prevent ERR_INSUFFICIENT_RESOURCES
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AssetsPage = lazy(() => import('./pages/AssetsPage'));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const CheckPage = lazy(() => import('./pages/CheckPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const BorrowsPage = lazy(() => import('./pages/BorrowsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AssetHistoryPage = lazy(() => import('./pages/AssetHistoryPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AuditTrailPage = lazy(() => import('./pages/AuditTrailPage'));
const AnnualCheckPage = lazy(() => import('./pages/AnnualCheckPage'));

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'User' ? "/assets" : "/dashboard"} />;
}

function RequireRole({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />; // RootRedirect will handle where they should go
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<RootRedirect />} />
              <Route path="dashboard" element={<RequireRole allowedRoles={['Admin', 'Inspector', 'Authority']}><DashboardPage /></RequireRole>} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="check" element={<RequireRole allowedRoles={['Admin', 'Inspector']}><CheckPage /></RequireRole>} />
              <Route path="reports" element={<RequireRole allowedRoles={['Admin', 'Inspector', 'Authority']}><ReportsPage /></RequireRole>} />
              <Route path="locations" element={<RequireRole allowedRoles={['Admin']}><LocationsPage /></RequireRole>} />
              <Route path="borrows" element={<RequireRole allowedRoles={['Admin', 'Authority']}><BorrowsPage /></RequireRole>} />
              <Route path="users" element={<RequireRole allowedRoles={['Admin']}><UsersPage /></RequireRole>} />
              <Route path="asset-history" element={<RequireRole allowedRoles={['Admin', 'Inspector', 'Authority']}><AssetHistoryPage /></RequireRole>} />
              <Route path="import" element={<RequireRole allowedRoles={['Admin']}><ImportPage /></RequireRole>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="audit-trail" element={<RequireRole allowedRoles={['Admin']}><AuditTrailPage /></RequireRole>} />
              <Route path="annual-check" element={<RequireRole allowedRoles={['Admin']}><AnnualCheckPage /></RequireRole>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;