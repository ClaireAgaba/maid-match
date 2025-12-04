import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import MaidProfileSettings from './pages/MaidProfileSettings';
import HomeownerProfileSettings from './pages/HomeownerProfileSettings';
import ManageMaids from './pages/ManageMaids';
import ManageHomeowners from './pages/ManageHomeowners';
import ManageCleaningCompanies from './pages/ManageCleaningCompanies';
import ManageHomeNurses from './pages/ManageHomeNurses';
import FindCleaningCompanies from './pages/FindCleaningCompanies';
import FindHomeNurses from './pages/FindHomeNurses';
import ViewCompanyProfile from './pages/company/ViewCompanyProfile';
import EditCompanyProfile from './pages/company/EditCompanyProfile';
import FindMaids from './pages/FindMaids';
import MyMaidProfile from './pages/MyMaidProfile';
import MyReviews from './pages/MyReviews';
import MyNurseProfile from './pages/MyNurseProfile';
import EditNurseProfile from './pages/EditNurseProfile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
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
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute>
                <ViewCompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile/edit"
            element={
              <ProtectedRoute>
                <EditCompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-cleaning-companies"
            element={
              <ProtectedRoute>
                <ManageCleaningCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-home-nurses"
            element={
              <ProtectedRoute>
                <ManageHomeNurses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-maids"
            element={
              <ProtectedRoute>
                <FindMaids />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-cleaning-companies"
            element={
              <ProtectedRoute>
                <FindCleaningCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-home-nurses"
            element={
              <ProtectedRoute>
                <FindHomeNurses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                <MyMaidProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse/profile"
            element={
              <ProtectedRoute>
                <MyNurseProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse/profile/edit"
            element={
              <ProtectedRoute>
                <EditNurseProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute>
                <MyReviews />
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
