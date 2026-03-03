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

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
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
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="check" element={<CheckPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="borrows" element={<BorrowsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="asset-history" element={<AssetHistoryPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="audit-trail" element={<AuditTrailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;