import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import ScanPage from './pages/ScanPage';
import CheckPage from './pages/CheckPage';
import ReportsPage from './pages/ReportsPage';
import LocationsPage from './pages/LocationsPage';
import BorrowsPage from './pages/BorrowsPage';
import UsersPage from './pages/UsersPage';
import AssetHistoryPage from './pages/AssetHistoryPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import Layout from './components/Layout/Layout';
import Loading from './components/Common/Loading';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark:bg-[#141932] dark:text-white',
            }}
          />
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
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;