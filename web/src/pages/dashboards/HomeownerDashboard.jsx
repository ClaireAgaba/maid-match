import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { useLiveLocationUpdater } from '../../hooks/useLiveLocationUpdater';
import { applicationAPI, authAPI, homeownerAPI, jobAPI, supportAPI } from '../../services/api';
import { Briefcase, CreditCard, Home, Settings, Shield, ShieldCheck } from 'lucide-react';
import Dashboard from '../Dashboard';

export const HomeownerDashboardV2 = () => {
  const { user, isHomeowner } = useAuth();
  const navigate = useNavigate();

  const [homeownerProfile, setHomeownerProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);

  const [homeownerJobs, setHomeownerJobs] = useState([]);
  const [homeownerJobsLoading, setHomeownerJobsLoading] = useState(false);

  const [showJobResponsesModal, setShowJobResponsesModal] = useState(false);
  const [jobResponses, setJobResponses] = useState([]);
  const [jobResponsesLoading, setJobResponsesLoading] = useState(false);
  const [jobResponsesFor, setJobResponsesFor] = useState(null);

  const {
    status: liveLocationStatus,
    coords: liveLocationCoords,
    placeName: liveLocationPlace,
    errorMessage: liveLocationError,
    retry: retryLiveLocation,
  } = useLiveLocationUpdater(user);

  const liveLocationLabel = (() => {
    if (liveLocationStatus === 'updating') return 'Detecting your live location...';
    if (liveLocationStatus === 'error') return liveLocationError || 'Live location unavailable';
    if (liveLocationStatus === 'ok') {
      if (liveLocationPlace) {
        return `Live location: ${liveLocationPlace}`;
      }
      if (liveLocationCoords) {
        const { lat, lng } = liveLocationCoords;
        return `Live location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    }
    return null;
  })();

  useEffect(() => {
    if (!isHomeowner) return;

    const fetchData = async () => {
      try {
        const userResponse = await authAPI.getCurrentUser();
        const homeownerResponse = await homeownerAPI.getMyProfile();
        setCurrentUser(userResponse.data);
        setHomeownerProfile(homeownerResponse.data);

        try {
          setHomeownerJobsLoading(true);
          const respJobs = await jobAPI.getAll({ ordering: '-created_at' });
          const data = respJobs.data?.results || respJobs.data || [];
          setHomeownerJobs(Array.isArray(data) ? data : []);
        } catch (e) {
          setHomeownerJobs([]);
        } finally {
          setHomeownerJobsLoading(false);
        }

        try {
          const tRes = await supportAPI.listTickets();
          const data = tRes.data;
          let list = [];
          if (Array.isArray(data)) list = data;
          else if (data && Array.isArray(data.results)) list = data.results;
          else if (data && typeof data === 'object' && data.id) list = [data];
          setSupportTickets(list);
        } catch (e) {
          setSupportTickets([]);
        }
      } catch (error) {
        console.error('Error fetching homeowner profile:', error);
      }
    };

    fetchData();
  }, [isHomeowner]);

  const loadJobResponses = async (job) => {
    if (!isHomeowner || !job) return;
    try {
      setJobResponsesLoading(true);
      setJobResponsesFor(job);
      const resp = await applicationAPI.getAll({ job: job.id });
      const data = resp.data?.results || resp.data || [];
      let appsArray = Array.isArray(data) ? data : [];
      appsArray = appsArray.filter((app) => {
        if (app.job && typeof app.job === 'object' && app.job.id !== undefined) {
          return app.job.id === job.id;
        }
        if (typeof app.job === 'number') {
          return app.job === job.id;
        }
        return false;
      });
      setJobResponses(appsArray);
      setShowJobResponsesModal(true);
    } catch (e) {
      console.error('Failed to load job responses', e);
      alert('Failed to load responses for this job.');
    } finally {
      setJobResponsesLoading(false);
    }
  };

  const headerNotifications = (() => {
    const items = [];
    if (homeownerProfile) {
      if (!homeownerProfile.is_verified) {
        items.push({
          id: 'homeowner-verification',
          kind: 'system',
          title: 'Your homeowner account is not yet verified',
          body:
            homeownerProfile.verification_notes ||
            'Please upload clear ID and LC documents so we can verify your account.',
          onClick: () => navigate('/homeowner-profile-settings'),
        });
      }
    }
    if (Array.isArray(homeownerJobs) && homeownerJobs.length > 0) {
      homeownerJobs.forEach((job) => {
        const count = job.applications_count || job.responses_count || 0;
        if (!count) return;
        items.push({
          id: `job-${job.id}`,
          kind: 'job responses',
          title: `${job.title} has ${count} response${count > 1 ? 's' : ''}`,
          body: 'Tap to review and accept a provider for this request.',
          onClick: () => loadJobResponses(job),
        });
      });
    }
    if (Array.isArray(supportTickets) && supportTickets.length > 0) {
      supportTickets.forEach((t) => {
        if (t.status && t.status !== 'open') return;
        items.push({
          id: `ticket-${t.id}`,
          kind: 'support',
          title: t.subject || 'Support ticket',
          body: 'Tap to open your Help & Feedback conversation.',
          onClick: () => navigate('/help-feedback'),
        });
      });
    }
    return items;
  })();

  const activeProfile = (() => {
    return { ...homeownerProfile, ...currentUser };
  })();

  if (!isHomeowner) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={activeProfile} notifications={headerNotifications} />

      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient-soft opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Hello,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                  {user?.username}
                </span>
                !
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">Manage your jobs and find the perfect maid for your home.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isHomeowner && currentUser && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">My Household</h3>
              {homeownerProfile &&
                (homeownerProfile.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                    <Shield className="h-3.5 w-3.5" /> Not Verified
                  </span>
                ))}
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    {currentUser.profile_picture ? (
                      <img
                        src={currentUser.profile_picture}
                        alt={currentUser.full_name || currentUser.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <Home className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentUser.full_name || currentUser.username}</h2>
                      <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm">
                        <Home className="h-4 w-4" />
                        {currentUser.address || 'Location not set'}
                      </p>
                      {liveLocationLabel && (
                        <p className="mt-1 text-xs text-gray-500">
                          {liveLocationLabel}
                          {liveLocationStatus === 'error' && (
                            <button
                              type="button"
                              className="ml-2 text-primary-600 hover:text-primary-700 underline"
                              onClick={retryLiveLocation}
                            >
                              Retry location
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="w-full sm:w-auto">
                      <button
                        onClick={() => navigate('/profile-settings')}
                        className="btn-secondary w-full sm:w-auto flex items-center justify-center text-sm py-2 px-4"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600 border border-gray-100">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Home Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {homeownerProfile?.home_type
                            ? homeownerProfile.home_type.charAt(0).toUpperCase() + homeownerProfile.home_type.slice(1)
                            : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-secondary-600 border border-gray-100">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Rooms</p>
                        <p className="text-sm font-medium text-gray-900">{homeownerProfile?.number_of_rooms || 'Not set'} rooms</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-secondary-600 border border-gray-100">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Service plan status</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {(() => {
                              const hp = homeownerProfile;
                              if (!hp) return 'No active service plan';
                              const now = new Date();
                              const exp = hp.subscription_expires_at ? new Date(hp.subscription_expires_at) : null;
                              const hasSub = hp.subscription_type && hp.subscription_type !== 'none' && exp && exp > now;
                              if (hasSub) {
                                if (hp.subscription_type === 'monthly') {
                                  return `Monthly service plan active until ${exp.toLocaleDateString()}`;
                                }
                                if (hp.subscription_type === 'day_pass') {
                                  return `24-hour service plan active until ${exp.toLocaleString()}`;
                                }
                              }
                              if (hp.has_live_in_credit) {
                                return 'Live-in placement service credit available for your next hire';
                              }
                              return 'No active service plan';
                            })()}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/homeowner-profile-settings')}
                            className="text-xs text-primary-600 hover:text-primary-700 underline font-medium"
                          >
                            View service plans
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HomeownerDashboard = () => {
  return <Dashboard />;
};

export default HomeownerDashboard;
