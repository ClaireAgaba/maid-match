import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { maidAPI, homeownerAPI, authAPI, reviewAPI } from '../services/api';
import { 
  Briefcase, Users, Star, Settings, LogOut,
  Home, Calendar, DollarSign, TrendingUp, User,
  Shield, ShieldCheck, Ban, CircleOff, Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout, isHomeowner, isMaid, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    jobsPosted: 0,
    applications: 0,
    completedJobs: 0,
    rating: 0.0
  });
  const [maidProfile, setMaidProfile] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [homeownerProfile, setHomeownerProfile] = useState(null);
  const [recentMaids, setRecentMaids] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // homeowner rating state (for maids rating homeowners)
  const [showHomeRating, setShowHomeRating] = useState(false);
  const [rcRespect, setRcRespect] = useState(0);
  const [rcPayment, setRcPayment] = useState(0);
  const [rcSafety, setRcSafety] = useState(0);
  const [rcFairness, setRcFairness] = useState(0);
  const [rcComment, setRcComment] = useState('');
  const [submittingHomeRating, setSubmittingHomeRating] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isMaid) {
        try {
          const response = await maidAPI.getMyProfile();
          setMaidProfile(response.data);
          // Load recent clients once profile is available
          try {
            if (response?.data?.id) {
              const rc = await maidAPI.recentClients(response.data.id);
              setRecentClients(Array.isArray(rc.data) ? rc.data : []);
            }
          } catch (e) {
            // non-blocking
          }
        } catch (error) {
          console.error('Error fetching maid profile:', error);
        }
      } else if (isHomeowner) {
        try {
          // Fetch fresh user data
          const userResponse = await authAPI.getCurrentUser();
          const homeownerResponse = await homeownerAPI.getMyProfile();
          setCurrentUser(userResponse.data);
          setHomeownerProfile(homeownerResponse.data);
          try {
            const rm = await homeownerAPI.recentMaids();
            setRecentMaids(Array.isArray(rm.data) ? rm.data : []);
          } catch (e) {
            // ignore
          }
        } catch (error) {
          console.error('Error fetching homeowner profile:', error);
        }
      } else if (isAdmin) {
        try {
          const resp = await maidAPI.adminStats();
          setAdminStats(resp.data);
        } catch (e) {
          console.error('Failed to load admin stats', e);
        }
      }
    };
    fetchData();
    // On maid dashboard, auto-refresh on interval and on tab focus
    let intervalId;
    const onFocus = () => { if (isMaid) fetchData(); };
    if (isMaid) {
      intervalId = setInterval(fetchData, 10000); // 10s
      window.addEventListener('visibilitychange', onFocus);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [isMaid, isHomeowner]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const onExportMaids = async () => {
    try {
      const resp = await maidAPI.exportMaids();
      downloadBlob(resp.data, 'maids_export.csv');
    } catch (e) {
      alert('Failed to export maids');
    }
  };
  const onExportHomeowners = async () => {
    try {
      const resp = await homeownerAPI.exportHomeowners();
      downloadBlob(resp.data, 'homeowners_export.csv');
    } catch (e) {
      alert('Failed to export homeowners');
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BrandLogo sizeClass="h-8" />
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Image with Status for Maids */}
              {isMaid && maidProfile && (
                <div className="relative">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                    {maidProfile.profile_photo ? (
                      <img
                        src={maidProfile.profile_photo}
                        alt={maidProfile.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      maidProfile.availability_status ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={maidProfile.availability_status ? 'Available' : 'Unavailable'}
                  />
                </div>
              )}
              
              {/* Profile Image for Homeowners */}
              {isHomeowner && currentUser && (
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                  {currentUser.profile_picture ? (
                    <img
                      src={currentUser.profile_picture}
                      alt={currentUser.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              )}
              <span className="text-sm text-gray-700 flex items-center gap-2">
                {user?.username}
                <span className="ml-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                  {user?.user_type}
                </span>
                {isHomeowner && homeownerProfile && (
                  homeownerProfile.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium" title="Verified homeowner">
                      <ShieldCheck className="h-3 w-3"/> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium" title="Not verified">
                      <Shield className="h-3 w-3"/> Not Verified
                    </span>
                  )
                )}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-gray-600">
            {isHomeowner && "Manage your jobs and find the perfect maid for your home."}
            {isMaid && "Browse available jobs and manage your profile."}
            {isAdmin && "Manage the MaidMatch platform."}
          </p>
        </div>

        {/* Verification Status Banner */}
        {isMaid && maidProfile && !maidProfile.is_verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Pending Verification
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your account is currently under review. Please ensure you have uploaded all required documents 
                    (ID and certificates) in your profile settings. Once verified, you'll be able to apply for jobs.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/profile-settings')}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Complete Your Profile →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMaid && maidProfile && maidProfile.is_verified && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  ✓ Account Verified
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your account has been verified by our admin team. You can now browse and apply for jobs!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMaid && maidProfile && !maidProfile.is_enabled && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Account Disabled
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Your account has been temporarily disabled. Please contact support for more information.
                  </p>
                  {maidProfile.verification_notes && (
                    <p className="mt-2 font-medium">
                      Reason: {maidProfile.verification_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maid Profile Card */}
        {isMaid && maidProfile && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              {/* Large Profile Image with Status */}
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {maidProfile.profile_photo ? (
                    <img
                      src={maidProfile.profile_photo}
                      alt={maidProfile.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                {/* Status Badge */}
                <div
                  className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white shadow-md ${
                    maidProfile.availability_status ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={maidProfile.availability_status ? 'Available for work' : 'Not available'}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{maidProfile.full_name || user?.username}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-600">{maidProfile.location || 'Location not set'}</p>
                  {!maidProfile.location && (
                    <button
                      onClick={async () => {
                        if ('geolocation' in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const { latitude, longitude } = position.coords;
                              try {
                                // Reverse geocode to get location name
                                const response = await fetch(
                                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                                );
                                const data = await response.json();
                                const location = data.address.city || data.address.town || data.address.county || 'Unknown location';
                                
                                // Update profile with location
                                await maidAPI.updateMyProfile({
                                  location: location,
                                  latitude: latitude.toFixed(6),
                                  longitude: longitude.toFixed(6)
                                });
                                
                                setMaidProfile({
                                  ...maidProfile,
                                  location: location,
                                  latitude: latitude,
                                  longitude: longitude
                                });
                              } catch (error) {
                                console.error('Error getting location name:', error);
                              }
                            },
                            (error) => {
                              console.error('Error getting location:', error);
                              alert('Unable to get your location. Please enable location services.');
                            }
                          );
                        } else {
                          alert('Geolocation is not supported by your browser');
                        }
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 underline"
                    >
                      Detect Location
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                  {/* Availability Toggle */}
                  <button
                    onClick={async () => {
                      try {
                        const newStatus = !maidProfile.availability_status;
                        const response = await maidAPI.updateMyProfile({ 
                          availability_status: newStatus 
                        });
                        setMaidProfile({ ...maidProfile, availability_status: newStatus });
                      } catch (error) {
                        console.error('Error updating availability:', error);
                        console.error('Error details:', error.response?.data);
                      }
                    }}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer hover:opacity-80 ${
                      maidProfile.availability_status 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      maidProfile.availability_status ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {maidProfile.availability_status ? 'Available' : 'Unavailable'}
                  </button>
                  {maidProfile.hourly_rate && (
                    <span className="text-gray-700">
                      <span className="font-semibold">Starting Pay: UGX {maidProfile.hourly_rate}</span>
                    </span>
                  )}
                  {maidProfile.category && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {maidProfile.category === 'live_in' ? 'Live-in' : 'Temporary'}
                    </span>
                  )}
                  {maidProfile.experience_years > 0 && (
                    <span className="text-gray-600">
                      {maidProfile.experience_years} years experience
                    </span>
                  )}
                </div>
              </div>

              {/* View + Edit Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/my-profile')}
                  className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Homeowner Profile Card */}
        {isHomeowner && currentUser && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {currentUser.profile_picture ? (
                    <img
                      src={currentUser.profile_picture}
                      alt={currentUser.full_name || currentUser.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <Home className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{currentUser.full_name || currentUser.username}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-600 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    {currentUser.address || 'Location not set'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                  {/* Verification badge for homeowner */}
                  {homeownerProfile && (
                    homeownerProfile.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        <ShieldCheck className="h-3 w-3"/> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                        <Shield className="h-3 w-3"/> Not Verified
                      </span>
                    )
                  )}
                  <span className="text-gray-700">
                    <span className="font-semibold">Homeowner</span>
                  </span>
                  {homeownerProfile?.home_type && (
                    <span className="text-gray-600">
                      {homeownerProfile.home_type.charAt(0).toUpperCase() + homeownerProfile.home_type.slice(1)}
                    </span>
                  )}
                  {homeownerProfile?.number_of_rooms && (
                    <span className="text-gray-600">
                      {homeownerProfile.number_of_rooms} rooms
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Edit Button */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="btn-secondary w-full sm:w-auto flex items-center justify-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isMaid && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Jobs Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(maidProfile?.total_jobs_completed || 0)}</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(maidProfile?.rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          )}
          {isAdmin && adminStats && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Maids</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_maids}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified: {adminStats.verified_maids} • Not verified: {adminStats.unverified_maids}</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Homeowners</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_homeowners}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Home className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Temporary Available</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.temporary_available_maids}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Live-in Available</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.live_in_available_maids}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Home className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.completed_jobs}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isHomeowner && (
              <>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Post a Job</p>
                </button>
                <button onClick={() => navigate('/find-maids')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Find Maids</p>
                </button>
                <button onClick={() => navigate('/my-reviews')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">My Reviews</p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Settings</p>
                </button>
              </>
            )}

            {isMaid && (
              <>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Browse Jobs</p>
                </button>
                <button onClick={() => navigate('/my-reviews')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">My Reviews</p>
                </button>
                <button 
                  onClick={() => navigate('/profile-settings')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Profile Settings</p>
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button 
                  onClick={() => navigate('/manage-maids')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Maids</p>
                </button>
                <button 
                  onClick={() => navigate('/manage-homeowners')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <Home className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Homeowners</p>
                </button>
                <button onClick={onExportMaids} className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Export Maids (CSV)</p>
                </button>
                <button onClick={onExportHomeowners} className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Home className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Export Homeowners (CSV)</p>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {isMaid ? (
            recentClients && recentClients.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentClients.map((c, idx) => (
                  <li
                    key={idx}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                    onClick={() => { setSelectedClient(c); setShowClientModal(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{c.full_name || c.username}</p>
                        <p className="text-xs text-gray-500">Closed a job • {c.created_at ? new Date(c.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Your activity will appear here</p>
              </div>
            )
          ) : isHomeowner ? (
            recentMaids && recentMaids.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentMaids.map((m, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {(m.full_name || m.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{m.full_name || m.username}</p>
                        <p className="text-xs text-gray-500">Worked together on {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-secondary"
                        onClick={()=>{
                          navigate(`/find-maids?maidId=${m.maid_id}`);
                        }}
                      >Re-contact Maid</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Your activity will appear here</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Your activity will appear here</p>
            </div>
          )}
        </div>
      {/* Homeowner brief modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-semibold">Homeowner Details</h4>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=>setShowClientModal(false)}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {(selectedClient.full_name || selectedClient.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{selectedClient.full_name || selectedClient.username}</p>
                  <p className="text-xs text-gray-500">Worked together on {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}</p>
                </div>
              </div>
              {selectedClient.home_address && (
                <p className="text-sm text-gray-700"><span className="font-medium">Address:</span> {selectedClient.home_address}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-700">
                {selectedClient.home_type && <span><span className="font-medium">Home:</span> {selectedClient.home_type}</span>}
                {selectedClient.number_of_rooms && <span>• {selectedClient.number_of_rooms} rooms</span>}
                {selectedClient.is_verified && <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
            </div>
            <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="btn-secondary w-full sm:w-auto"
                onClick={()=>{
                  const subject = encodeURIComponent(`Support: homeowner ${selectedClient.username}`);
                  const body = encodeURIComponent(`Hello Support,\n\nI need help regarding homeowner ${selectedClient.full_name || selectedClient.username}.\nClosed on: ${selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}.\n\nThanks.`);
                  window.location.href = `mailto:support@maidmatch.local?subject=${subject}&body=${body}`;
                }}
              >
                Contact Support
              </button>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={()=>{ setShowHomeRating(true); }}
              >
                Rate & Review
              </button>
            </div>
            {showHomeRating && (
              <div className="p-4 pt-0">
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-900 font-medium mb-2">Rate homeowner</p>
                  <div className="space-y-3 mb-3">
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Respect & Communication</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={`rc-${n}`} type="button" onClick={()=>setRcRespect(n)} className="focus:outline-none" title={`${n} star${n>1?'s':''}`}>
                            <Star className={`h-6 w-6 ${rcRespect>=n?'text-yellow-500':'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Payment Timeliness</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={`pay-${n}`} type="button" onClick={()=>setRcPayment(n)} className="focus:outline-none" title={`${n} star${n>1?'s':''}`}>
                            <Star className={`h-6 w-6 ${rcPayment>=n?'text-yellow-500':'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Work Environment & Safety</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={`safe-${n}`} type="button" onClick={()=>setRcSafety(n)} className="focus:outline-none" title={`${n} star${n>1?'s':''}`}>
                            <Star className={`h-6 w-6 ${rcSafety>=n?'text-yellow-500':'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Fairness of Workload</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={`fair-${n}`} type="button" onClick={()=>setRcFairness(n)} className="focus:outline-none" title={`${n} star${n>1?'s':''}`}>
                            <Star className={`h-6 w-6 ${rcFairness>=n?'text-yellow-500':'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Optional comment"
                    className="input-field w-full mb-3"
                    value={rcComment}
                    onChange={(e)=>setRcComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-secondary"
                      onClick={()=>{ setShowHomeRating(false); setRcRespect(0); setRcPayment(0); setRcSafety(0); setRcFairness(0); setRcComment(''); }}
                    >Cancel</button>
                    <button
                      disabled={submittingHomeRating || [rcRespect, rcPayment, rcSafety, rcFairness].some(v=>v===0)}
                      className="btn-primary"
                      onClick={async ()=>{
                        if (!selectedClient) return;
                        try {
                          setSubmittingHomeRating(true);
                          await reviewAPI.create({
                            homeowner_id: selectedClient.homeowner_id,
                            respect_communication: rcRespect,
                            payment_timeliness: rcPayment,
                            safety_environment: rcSafety,
                            fairness_workload: rcFairness,
                            comment: rcComment
                          });
                          setShowHomeRating(false);
                          setRcRespect(0); setRcPayment(0); setRcSafety(0); setRcFairness(0); setRcComment('');
                          alert('Thanks for your review!');
                        } catch (e) {
                          console.error('Failed to submit homeowner review', e);
                          const serverMsg = e?.response?.data ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)) : '';
                          alert(`Failed to submit review. ${serverMsg}`);
                        } finally {
                          setSubmittingHomeRating(false);
                        }
                      }}
                    >{submittingHomeRating? 'Submitting...' : 'Submit Review'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Dashboard;
