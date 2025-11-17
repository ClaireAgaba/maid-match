import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileSettings = () => {
  const { isMaid, isHomeowner } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMaid) {
      navigate('/maid-profile-settings', { replace: true });
    } else if (isHomeowner) {
      navigate('/homeowner-profile-settings', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [isMaid, isHomeowner, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default ProfileSettings;
