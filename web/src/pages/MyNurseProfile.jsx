import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeNursingAPI } from '../services/api';
import { User, MapPin } from 'lucide-react';

// Helper to turn a relative /media/... path into a full URL in dev
const toImgUrl = (u) => {
  if (!u) return null;
  if (u.startsWith('http')) return u;
  return `http://localhost:8000${u}`;
};

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between py-2 border-b last:border-b-0">
    <div className="text-gray-600 text-sm">{label}</div>
    <div className="text-gray-900 font-medium text-right max-w-md ml-4">
      {value || <span className="text-gray-400">Not provided</span>}
    </div>
  </div>
);

const MyNurseProfile = () => {
  const { isHomeNurse } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHomeNurse) { navigate('/dashboard'); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await homeNursingAPI.me();
        setProfile(res.data);
      } catch (e) {
        console.error('Failed to load nurse profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isHomeNurse, navigate]);

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your nurse profile...</p>
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">My Nurse Profile</h1>
          <button onClick={() => navigate('/nurse/profile/edit')} className="btn-secondary">Edit Profile</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-200">
              {profile.display_photo ? (
                <img src={toImgUrl(profile.display_photo)} alt={profile.username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
              <p className="text-gray-600 flex items-center"><MapPin className="h-4 w-4 mr-1"/>{profile.location || 'Location not set'}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Level</div>
              <div className="font-semibold">{profile.nursing_level || 'Not set'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h3>
          <Row label="Nursing level" value={profile.nursing_level} />
          <Row label="Council registration number" value={profile.council_registration_number} />
          <Row label="Years of experience" value={profile.years_of_experience?.toString()} />
          <Row label="Preferred working hours" value={profile.preferred_working_hours} />
          <Row label="Emergency availability" value={profile.emergency_availability ? 'Yes' : 'No'} />
          <Row label="Location" value={profile.location} />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Services</h3>
          {Array.isArray(profile.services) && profile.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <span key={s.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{s.name}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No services added.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNurseProfile;
