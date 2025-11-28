import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeownerAPI, authAPI } from '../services/api';
import { 
  User, Phone, Mail, MapPin, Home as HomeIcon, 
  Save, CheckCircle, AlertCircle, Camera, Upload, FileText,
  Power, CreditCard
} from 'lucide-react';

const HomeownerProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    // User account fields
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    gender: '',
    profile_picture: null,
    
    // Homeowner specific fields
    home_address: '',
    home_type: 'apartment',
    number_of_rooms: 1,
    
    // Documents
    id_document: null,
    lc_letter: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [documentPreviews, setDocumentPreviews] = useState({
    id_document: null,
    lc_letter: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get user data
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;
      
      // Get homeowner profile
      const profileResponse = await homeownerAPI.getMyProfile();
      const profileData = profileResponse.data;
      
      setProfileData({
        username: userData.username || '',
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        address: userData.address || '',
        gender: userData.gender || '',
        profile_picture: null,
        
        home_address: profileData.home_address || '',
        home_type: profileData.home_type || 'apartment',
        number_of_rooms: profileData.number_of_rooms || 1,
        
        id_document: null,
        lc_letter: null,
      });

      if (userData.profile_picture) {
        setPreviewImage(userData.profile_picture);
      }
      
      if (profileData.id_document) {
        setDocumentPreviews(prev => ({ ...prev, id_document: profileData.id_document }));
      }
      if (profileData.lc_letter) {
        setDocumentPreviews(prev => ({ ...prev, lc_letter: profileData.lc_letter }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrors({ general: 'Failed to load profile' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setProfileData(prev => ({ ...prev, [name]: file }));
      
      // Create preview for images
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSuccess('');

    try {
      // Update user account info
      const userFormData = new FormData();
      if (profileData.full_name) userFormData.append('full_name', profileData.full_name);
      if (profileData.email) userFormData.append('email', profileData.email);
      if (profileData.phone_number) userFormData.append('phone_number', profileData.phone_number);
      if (profileData.address) userFormData.append('address', profileData.address);
      if (profileData.gender) userFormData.append('gender', profileData.gender);
      if (profileData.profile_picture instanceof File) {
        userFormData.append('profile_picture', profileData.profile_picture);
      }
      
      // Update user
      await authAPI.updateUser(userFormData);
      
      // Update homeowner profile
      const profileFormData = new FormData();
      if (profileData.home_address) profileFormData.append('home_address', profileData.home_address);
      profileFormData.append('home_type', profileData.home_type);
      profileFormData.append('number_of_rooms', profileData.number_of_rooms);
      
      // Add documents if uploaded
      if (profileData.id_document instanceof File) {
        profileFormData.append('id_document', profileData.id_document);
      }
      if (profileData.lc_letter instanceof File) {
        profileFormData.append('lc_letter', profileData.lc_letter);
      }
      
      const profileResponse = await homeownerAPI.getMyProfile();
      await homeownerAPI.update(profileResponse.data.id, profileFormData);
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors(error.response?.data || { general: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
            Update your account and home information
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Account Deactivation / Take a Break */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Power className="h-5 w-5 mr-2 text-red-600" />
            Account status
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Need to take a break from Maid Match? You can temporarily disable your homeowner account.
            Your profile and jobs will be hidden until you come back.
          </p>
          <button
            type="button"
            className="btn-secondary border-red-300 text-red-700 hover:bg-red-50 flex items-center"
            onClick={() => {
              alert('Account deactivation will be available soon. For now, contact support to disable your account.');
            }}
          >
            <Power className="h-4 w-4 mr-2" />
            Take a break / Disable account
          </button>
        </div>

        {/* Payments & Subscriptions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
            Payments &amp; subscriptions
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Manage how you pay for services and future subscription plans.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <p className="font-semibold mb-1">Saved payment methods</p>
              <p className="text-xs text-gray-500">Coming soon – you&apos;ll be able to save and manage cards or mobile money here.</p>
            </div>
            <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <p className="font-semibold mb-1">Subscriptions &amp; billing history</p>
              <p className="text-xs text-gray-500">No active subscriptions yet. This section will show your plans and invoices once enabled.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-primary-600" />
              Profile Photo
            </h2>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <label className="btn-primary cursor-pointer inline-flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  disabled
                  className="input-field bg-gray-100"
                  value={profileData.username}
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="input-field"
                  placeholder="John Doe"
                  value={profileData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  className="input-field"
                  value={profileData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  value={profileData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  className="input-field"
                  value={profileData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address/Location *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="address"
                    required
                    className="input-field flex-1"
                    placeholder="e.g., Nairobi, Westlands"
                    value={profileData.address}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                              );
                              const data = await response.json();
                              const location = data.address.city || data.address.town || data.address.county || 'Unknown location';
                              
                              setProfileData({
                                ...profileData,
                                address: location
                              });
                            } catch (error) {
                              console.error('Error getting location name:', error);
                              alert('Unable to get location name. Please enter manually.');
                            }
                          },
                          (error) => {
                            console.error('Error getting location:', error);
                            alert('Unable to get your location. Please enable location services or enter manually.');
                          }
                        );
                      } else {
                        alert('Geolocation is not supported by your browser');
                      }
                    }}
                    className="btn-secondary whitespace-nowrap"
                  >
                    📍 Detect
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Click "Detect" to use your current location
                </p>
              </div>
            </div>
          </div>

          {/* Home Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-primary-600" />
              Home Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Address
                </label>
                <textarea
                  name="home_address"
                  rows="2"
                  className="input-field"
                  placeholder="Full home address"
                  value={profileData.home_address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Type
                </label>
                <select
                  name="home_type"
                  className="input-field"
                  value={profileData.home_type}
                  onChange={handleChange}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="condo">Condominium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  name="number_of_rooms"
                  min="1"
                  className="input-field"
                  value={profileData.number_of_rooms}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Documents
            </h2>
            
            <div className="space-y-6">
              {/* ID Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Document / Passport
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  {documentPreviews.id_document ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm text-gray-600">Document uploaded</p>
                      <label className="btn-secondary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Change Document
                        <input
                          type="file"
                          name="id_document"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <label className="btn-primary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload ID Document
                        <input
                          type="file"
                          name="id_document"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-sm text-gray-500">
                        PNG, JPG or PDF. Max size 10MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* LC Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LC Letter (Local Council Letter)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  {documentPreviews.lc_letter ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm text-gray-600">LC Letter uploaded</p>
                      <label className="btn-secondary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Change Document
                        <input
                          type="file"
                          name="lc_letter"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <label className="btn-secondary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload LC Letter
                        <input
                          type="file"
                          name="lc_letter"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-sm text-gray-500">
                        PNG, JPG or PDF. Max size 10MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeownerProfileSettings;
