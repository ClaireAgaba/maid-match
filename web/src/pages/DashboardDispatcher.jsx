import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import HomeownerDashboard from './dashboards/HomeownerDashboard';
import MaidDashboard from './dashboards/MaidDashboard';
import CleaningCompanyDashboard from './dashboards/CleaningCompanyDashboard';
import HomeNurseDashboard from './dashboards/HomeNurseDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const DashboardDispatcher = () => {
  const { user, isHomeowner, isMaid, isAdmin, isHomeNurse } = useAuth();

  if (isHomeowner) return <HomeownerDashboard />;
  if (isMaid) return <MaidDashboard />;
  if (isHomeNurse) return <HomeNurseDashboard />;
  if (user?.user_type === 'cleaning_company') return <CleaningCompanyDashboard />;
  if (isAdmin) return <AdminDashboard />;

  return <Dashboard />;
};

export default DashboardDispatcher;
