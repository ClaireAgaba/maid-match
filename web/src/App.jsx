import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import MaidProfileSettings from './pages/MaidProfileSettings';
import HomeownerProfileSettings from './pages/HomeownerProfileSettings';
import ManageMaids from './pages/ManageMaids';
import ManageHomeowners from './pages/ManageHomeowners';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maid-profile-settings"
            element={
              <ProtectedRoute>
                <MaidProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homeowner-profile-settings"
            element={
              <ProtectedRoute>
                <HomeownerProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-maids"
            element={
              <ProtectedRoute>
                <ManageMaids />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-homeowners"
            element={
              <ProtectedRoute>
                <ManageHomeowners />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
