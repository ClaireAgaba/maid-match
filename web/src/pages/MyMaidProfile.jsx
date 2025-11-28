import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maidAPI } from '../services/api';
import { User, MapPin, ShieldCheck, Shield, Phone, Mail, Star, CheckCircle2, XCircle } from 'lucide-react';

const Row = ({ label, value, visibleToHomeowners = false }) => (
  <div className="flex items-start justify-between py-2 border-b last:border-b-0">
    <div className="text-gray-600 text-sm">
      {label}
      {visibleToHomeowners && (
        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">Visible to homeowners</span>
      )}
    </div>
    <div className="text-gray-900 font-medium text-right max-w-md ml-4">
      {value || <span className="text-gray-400">Not provided</span>}
    </div>
  </div>
);

const MyMaidProfile = () => {
  const { isMaid } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMaid) {
      navigate('/dashboard');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await maidAPI.getMyProfile();
        setProfile(res.data);
      } catch (e) {
        console.error('Failed to load maid profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isMaid, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const missing = [];
  if (!profile.full_name) missing.push('Full name');
  if (!profile.location) missing.push('Location');
  if (!profile.skills) missing.push('Skills');
  if (!profile.phone_number) missing.push('Phone number');
  if (!profile.id_document) missing.push('ID document');
  if (!profile.certificate) missing.push('Certificate');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile (Preview)</h1>
          <button onClick={() => navigate('/profile-settings')} className="btn-secondary">Edit Profile</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-200">
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name || 'Your Name'}</h2>
              {/* Gender from nested user object */}
              <p className="text-gray-700 text-sm mt-0.5">Gender: {profile.user?.gender ? profile.user.gender.charAt(0).toUpperCase() + profile.user.gender.slice(1) : 'Not set'}</p>
              {/* Age directly from serializer (computed from date_of_birth) */}
              <p className="text-gray-700 text-sm">Age: {profile.age ?? 'Not set'}</p>
              <p className="text-gray-600 flex items-center"><MapPin className="h-4 w-4 mr-1"/>{profile.location || 'Location not set'}</p>
              {profile.category && (
                <p className="text-gray-700 text-sm mt-0.5">Category: {profile.category === 'live_in' ? 'Live-in' : 'Temporary'}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {profile.is_verified ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Verified</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs inline-flex items-center gap-1"><Shield className="h-3 w-3"/> Not Verified</span>
                )}
                {profile.is_enabled ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">Enabled</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">Disabled</span>
                )}
                {profile.availability_status ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Available</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs inline-flex items-center gap-1"><XCircle className="h-3 w-3"/> Unavailable</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Rating</div>
              <div className="font-semibold flex items-center justify-end gap-1"><Star className="h-4 w-4 text-yellow-500"/>{Number(profile.rating || 0).toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Visibility overview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h3>
          <Row label="Full name" value={profile.full_name} visibleToHomeowners />
          <Row label="Phone number" value={profile.phone_number} visibleToHomeowners />
          <Row label="Email" value={profile.email} />
          <Row label="Location" value={profile.location} visibleToHomeowners />
          <Row label="Experience (years)" value={profile.experience_years} visibleToHomeowners />
          <Row label="Hourly rate" value={profile.hourly_rate ? `UGX ${profile.hourly_rate}` : ''} visibleToHomeowners />
          <Row label="Maid category" value={profile.category ? (profile.category === 'live_in' ? 'Live-in' : 'Temporary') : ''} visibleToHomeowners />
          <Row label="Service starting pay" value={profile.service_pricing} visibleToHomeowners />
          <Row label="Skills" value={profile.skills} visibleToHomeowners />
          <Row label="Bio" value={profile.bio} visibleToHomeowners />
        </div>

        {/* Documents */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
          <Row label="ID Document" value={profile.id_document ? 'Uploaded' : ''} />
          <Row label="Certificate" value={profile.certificate ? 'Uploaded' : ''} />
          {!profile.is_verified && profile.verification_notes && (
            <div className="mt-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 p-3 rounded">
              Admin notes: {profile.verification_notes}
            </div>
          )}
        </div>

        {/* Missing items helper */}
        {missing.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium mb-1">Suggested improvements</p>
            <p className="text-yellow-800 text-sm">Consider adding the following to improve your profile:</p>
            <ul className="list-disc pl-5 mt-2 text-yellow-900 text-sm">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <div className="mt-3">
              <button onClick={() => navigate('/profile-settings')} className="btn-secondary">Go to Profile Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMaidProfile;
