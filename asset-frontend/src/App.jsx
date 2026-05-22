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

function RestrictUserRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'User') {
    return <Navigate to="/assets" />;
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
              <Route path="dashboard" element={<RestrictUserRoute><DashboardPage /></RestrictUserRoute>} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="check" element={<RestrictUserRoute><CheckPage /></RestrictUserRoute>} />
              <Route path="reports" element={<RestrictUserRoute><ReportsPage /></RestrictUserRoute>} />
              <Route path="locations" element={<RestrictUserRoute><LocationsPage /></RestrictUserRoute>} />
              <Route path="borrows" element={<RestrictUserRoute><BorrowsPage /></RestrictUserRoute>} />
              <Route path="users" element={<RestrictUserRoute><UsersPage /></RestrictUserRoute>} />
              <Route path="asset-history" element={<RestrictUserRoute><AssetHistoryPage /></RestrictUserRoute>} />
              <Route path="import" element={<RestrictUserRoute><ImportPage /></RestrictUserRoute>} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="audit-trail" element={<RestrictUserRoute><AuditTrailPage /></RestrictUserRoute>} />
              <Route path="annual-check" element={<RestrictUserRoute><AnnualCheckPage /></RestrictUserRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;