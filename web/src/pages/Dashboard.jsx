import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maidAPI, homeownerAPI, authAPI } from '../services/api';
import { 
  Briefcase, Users, Star, Settings, LogOut,
  Home, Calendar, DollarSign, TrendingUp, User,
  Shield, ShieldCheck, Ban
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
  const [homeownerProfile, setHomeownerProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isMaid) {
        try {
          const response = await maidAPI.getMyProfile();
          setMaidProfile(response.data);
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
        } catch (error) {
          console.error('Error fetching homeowner profile:', error);
        }
      }
    };
    fetchData();
  }, [isMaid, isHomeowner]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">MaidMatch</h1>
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
              <span className="text-sm text-gray-700">
                {user?.username}
                <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                  {user?.user_type}
                </span>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
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
            <div className="flex items-center space-x-6">
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
                <h3 className="text-2xl font-bold text-gray-900">{maidProfile.full_name || user?.username}</h3>
                <div className="flex items-center space-x-2 mt-1">
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
                <div className="flex items-center space-x-4 mt-3">
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
                      <span className="font-semibold">KSH {maidProfile.hourly_rate}</span>/hr
                    </span>
                  )}
                  {maidProfile.experience_years > 0 && (
                    <span className="text-gray-600">
                      {maidProfile.experience_years} years experience
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Edit Button */}
              <div>
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="btn-secondary flex items-center"
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
            <div className="flex items-center space-x-6">
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
                <h3 className="text-2xl font-bold text-gray-900">{currentUser.full_name || currentUser.username}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-600 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    {currentUser.address || 'Location not set'}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-3">
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
              <div>
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="btn-secondary flex items-center"
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
          {isHomeowner && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          )}

          {isMaid && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Jobs Completed</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
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
                    <p className="text-3xl font-bold text-gray-900">0.0</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-green-600" />
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
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Find Maids</p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
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
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">My Applications</p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
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
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Jobs</p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Reviews</p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
                  <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Settings</p>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Your activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
