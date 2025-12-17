import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeownerAPI, authAPI, paymentAPI } from '../services/api';
import { detectCurrentLocation, geolocationErrorToMessage } from '../utils/location';
import { 
  User, Phone, Mail, MapPin, Home as HomeIcon, 
  Save, CheckCircle, AlertCircle, Camera, Upload, FileText,
  Power, CreditCard, Trash2
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

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null); // 'live_in' | 'monthly' | 'day_pass'
  const [paymentNetwork, setPaymentNetwork] = useState('mtn');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

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

  const handleDeleteAccount = async () => {
    const ok = window.confirm('This will permanently delete your MaidMatch account and data. This cannot be undone. Continue?');
    if (!ok) return;
    try {
      await authAPI.deleteMe();
    } catch (e) {
      console.error('Error deleting account:', e);
      alert('Failed to delete account. Please try again.');
      return;
    }
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    window.location.href = '/login';
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
    <div className="min-h-screen bg-gray-50 pb-8 safe-top-8">
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
          <div className="flex flex-col sm:flex-row gap-3">
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
            <button
              type="button"
              className="btn-secondary border-red-300 text-red-700 hover:bg-red-50 flex items-center"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete account
            </button>
          </div>
        </div>

        {/* Payments & Access Plans */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
            Payments &amp; access
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Choose how you want to use Maid Match. All payments are processed securely.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('live_in');
                setPaymentNetwork('mtn');
                setPaymentPhone(profileData.phone_number || '');
                setPaymentMessage('');
                setPaymentModalOpen(true);
              }}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40 transition text-left"
            >
              <p className="font-semibold mb-1">Live-in placement fee</p>
              <p className="text-xs text-gray-500 mb-1">UGX 25,000 once per live-in maid hired.</p>
              <p className="text-[11px] text-gray-500">Pay when you are ready to hire a live-in maid through the app.</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('monthly');
                setPaymentNetwork('mtn');
                setPaymentPhone(profileData.phone_number || '');
                setPaymentMessage('');
                setPaymentModalOpen(true);
              }}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40 transition text-left"
            >
              <p className="font-semibold mb-1">Monthly access</p>
              <p className="text-xs text-gray-500 mb-1">UGX 20,000 for 30 days.</p>
              <p className="text-[11px] text-gray-500">Browse maids, companies &amp; nurses and schedule services.</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan('day_pass');
                setPaymentNetwork('mtn');
                setPaymentPhone(profileData.phone_number || '');
                setPaymentMessage('');
                setPaymentModalOpen(true);
              }}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40 transition text-left"
            >
              <p className="font-semibold mb-1">24 hour pass</p>
              <p className="text-xs text-gray-500 mb-1">UGX 5,000 for 24 hours.</p>
              <p className="text-[11px] text-gray-500">Short-term access to view contacts and schedule a one-off service.</p>
            </button>
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
                    onClick={async () => {
                      try {
                        const { coords, placeName } = await detectCurrentLocation({
                          enableHighAccuracy: true,
                          timeoutMs: 15000,
                          maximumAgeMs: 0,
                          reverseGeocode: true,
                        });
                        const label = placeName || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
                        setProfileData({
                          ...profileData,
                          address: label,
                        });
                      } catch (error) {
                        console.error('Error getting location:', error);
                        alert(geolocationErrorToMessage(error));
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
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <a
                          href={documentPreviews.id_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 underline"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View document
                        </a>
                      </div>
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
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <a
                          href={documentPreviews.lc_letter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 underline"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View LC Letter
                        </a>
                      </div>
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

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Mobile Money Payment</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  if (paymentSubmitting) return;
                  setPaymentModalOpen(false);
                  setPaymentMessage('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Pay using MTN or Airtel Mobile Money. We will redirect you to Pesapal to complete the payment, then you will receive a prompt on your phone to enter your PIN.
              </p>
              {paymentMessage && (
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  {paymentMessage}
                </p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedPlan === 'live_in' && 'Live-in placement fee (UGX 25,000)'}
                    {selectedPlan === 'monthly' && 'Monthly access (UGX 20,000)'}
                    {selectedPlan === 'day_pass' && '24 hour pass (UGX 5,000)'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                  <select
                    className="input-field text-sm"
                    value={paymentNetwork}
                    onChange={(e) => setPaymentNetwork(e.target.value)}
                  >
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="airtel">Airtel Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Money number</label>
                  <input
                    type="tel"
                    className="input-field text-sm"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={paymentSubmitting}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                onClick={async () => {
                  if (!paymentPhone.trim()) {
                    setPaymentMessage('Please enter the mobile number you are paying from.');
                    return;
                  }
                  if (!selectedPlan) {
                    setPaymentMessage('Please choose a plan again from the Payments section.');
                    return;
                  }
                  setPaymentSubmitting(true);
                  setPaymentMessage('');
                  try {
                    const res = await paymentAPI.initiateHomeownerPayment({
                      plan: selectedPlan,
                      network: paymentNetwork,
                      phone_number: paymentPhone.trim(),
                    });
                    const msg = res.data?.message || 'We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.';
                    setPaymentMessage(msg);
                    const redirectUrl = res.data?.redirect_url;
                    if (redirectUrl) {
                      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                    }
                  } catch (err) {
                    const data = err.response?.data;
                    const msg = data?.error || data?.detail || 'Failed to start payment. Please try again.';
                    setPaymentMessage(msg);
                  } finally {
                    setPaymentSubmitting(false);
                  }
                }}
              >
                {paymentSubmitting ? 'Starting payment...' : 'Pay via Mobile Money'}
              </button>
              <p className="text-[11px] text-gray-500 mt-1">
                You will receive a Mobile Money prompt on your phone to enter your PIN. Maid Match does not see or store your PIN.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeownerProfileSettings;
