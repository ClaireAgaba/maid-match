import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleaningCompanyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ViewCompanyProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await cleaningCompanyAPI.me();
        setProfile(me.data);
      } catch {}

      // Start with any gallery items stored locally from the dashboard
      let localItems = [];
      try {
        const key = user?.username ? `company_gallery_${user.username}` : null;
        if (key) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) localItems = arr;
          }
        }
      } catch {
        // ignore localStorage errors
      }

      try {
        const gal = await cleaningCompanyAPI.galleryList();
        const backendItems = Array.isArray(gal.data) ? gal.data : [];
        // Prefer backend items first, but also include any local-only ones
        setGallery([...backendItems, ...localItems]);
      } catch {
        setGallery(localItems);
      }
    };
    load();
  }, [user?.username]);

  if (!profile) return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Company Profile</h1>
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200">
            {profile.display_photo_url ? (
              <img src={profile.display_photo_url} alt={profile.company_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gray-200" />
            )}
          </div>
          <h1 className="text-2xl font-semibold">{profile.company_name}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button className="btn-secondary" onClick={() => navigate('/company/profile/edit')}>Edit Profile</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">Account status</p>
            <p>
              {profile.is_paused
                ? 'You are currently taking a break. You will not see or receive new jobs until you resume.'
                : 'Your account is active. You can browse and show interest in jobs (if your plan is active).'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading}
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                if (!profile) return;
                setActionLoading(true);
                try {
                  await cleaningCompanyAPI.pauseMe({ is_paused: !profile.is_paused });
                  const refreshed = await cleaningCompanyAPI.me();
                  setProfile(refreshed.data);
                } catch (err) {
                  console.error('Failed to toggle pause', err);
                  alert('Could not update your break status. Please try again.');
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              {profile.is_paused ? 'Resume from break' : 'Take a break'}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              className="btn-secondary text-sm border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                if (!window.confirm('Deactivate will delete your company profile and disable your login until support re-enables you. This cannot be undone. Continue?')) {
                  return;
                }
                setActionLoading(true);
                try {
                  await cleaningCompanyAPI.deactivateMe();
                  await logout();
                  navigate('/login');
                } catch (err) {
                  console.error('Failed to deactivate account', err);
                  alert('Could not deactivate your account. Please try again or contact support.');
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              Deactivate account
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700">Location</p>
            <p className="font-medium">{profile.location || 'Not set'}</p>
            {profile.id_document && (
              <p className="mt-2 text-sm text-gray-700">
                Company ID / registration:{' '}
                <a
                  href={profile.id_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  View document
                </a>
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {profile.verified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Services Offered</h2>
        {Array.isArray(profile.services) && profile.services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.services.map((svc) => (
              <span key={svc.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{svc.name}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No services added.</p>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Our Works</h2>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id}>
                <img src={item.image_url || item.image} alt={item.caption || 'work'} className="w-full h-40 object-cover rounded" />
                {item.caption && <div className="mt-1 text-xs text-gray-600 truncate">{item.caption}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No gallery items yet.</p>
        )}
      </div>
    </div>
  );
};

export default ViewCompanyProfile;
