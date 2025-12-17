import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maidAPI, authAPI } from '../services/api';
import { detectCurrentLocation, geolocationErrorToMessage } from '../utils/location';
import { 
  User, Calendar, MapPin, Phone, Mail, Briefcase, 
  DollarSign, FileText, Upload, Camera, Save, 
  CheckCircle, AlertCircle, Star, Award, Trash2 
} from 'lucide-react';

const MAID_SERVICE_OPTIONS = [
  'Domestic Housekeeping Services',
  'Nanny / Childcare Services',
  'Home Care & Elderly Support',
  'Residential Cleaning Services',
  'Live-in Maid Services',
  'Live-out Maid Services',
  'Cooking & Meal Preparation',
  'Laundry & Ironing Services',
  'Domestic Staff Placement / Recruitment',
  'Home Assistant Services',
  'After-Party & Event Cleaning Services',
  'Cooking, Serving & Event Helpers',
];

const MaidProfileSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    // Bio Data
    full_name: '',
    date_of_birth: '',
    location: '',
    phone_number: '',
    email: '',
    gender: '',
    bio: '',
    
    // Professional Info
    experience_years: 0,
    hourly_rate: '',
    category: '',
    skills: '',
    service_pricing: '',
    availability_status: true,
    
    // Files
    profile_photo: null,
    id_document: null,
    certificate: null,
  });

  const [previewImages, setPreviewImages] = useState({
    profile_photo: null,
    id_document: null,
    certificate: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await maidAPI.getMyProfile();
      const profile = response.data;
      
      setProfileData({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        location: profile.location || '',
        phone_number: profile.phone_number || '',
        email: profile.email || '',
        gender: profile.user?.gender || '',
        bio: profile.bio || '',
        experience_years: profile.experience_years || 0,
        hourly_rate: profile.hourly_rate || '',
        category: profile.category || '',
        skills: profile.skills || '',
        service_pricing: profile.service_pricing || '',
        availability_status: profile.availability_status ?? true,
        profile_photo: null,
        id_document: null,
        certificate: null,
      });

      // Set existing image previews
      if (profile.profile_photo) {
        setPreviewImages(prev => ({ ...prev, profile_photo: profile.profile_photo }));
      }
      if (profile.id_document) {
        setPreviewImages(prev => ({ ...prev, id_document: profile.id_document }));
      }
      if (profile.certificate) {
        setPreviewImages(prev => ({ ...prev, certificate: profile.certificate }));
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
    await logout();
    navigate('/login');
  };

  // Local map of per-service starting pay, derived from the single
  // service_pricing text field (one "Service: text" per line).
  const [serviceRates, setServiceRates] = useState({});

  useEffect(() => {
    const raw = profileData.service_pricing || '';
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const map = {};
    lines.forEach((line) => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const name = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (name) map[name] = value;
      }
    });
    setServiceRates(map);
  }, [profileData.service_pricing]);

  const toggleServiceInSkills = (serviceName) => {
    setProfileData((prev) => {
      const raw = prev.skills || '';
      const parts = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const set = new Set(parts);
      if (set.has(serviceName)) {
        set.delete(serviceName);
      } else {
        set.add(serviceName);
      }
      const nextSkills = Array.from(set).join(', ');
      return { ...prev, skills: nextSkills };
    });
  };

  const isServiceChecked = (serviceName) => {
    const raw = profileData.skills || '';
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return parts.includes(serviceName);
  };

  const handleServiceRateChange = (serviceName, value) => {
    setServiceRates((prev) => {
      const next = { ...prev, [serviceName]: value };

      // Rebuild service_pricing as one line per service: "Service: value"
      const lines = [];
      MAID_SERVICE_OPTIONS.forEach((svc) => {
        const v = next[svc];
        if (v && v.trim().length > 0) {
          lines.push(`${svc}: ${v.trim()}`);
        }
      });

      setProfileData((p) => ({ ...p, service_pricing: lines.join('\n') }));
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setProfileData(prev => ({ ...prev, [name]: file }));
      
      // Create preview for images
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => ({ ...prev, [name]: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      setProfileData(prev => ({ ...prev, [name]: checked }));
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
      // Prepare FormData for file uploads
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== '' && 
            !['profile_photo', 'id_document', 'certificate'].includes(key)) {
          formData.append(key, profileData[key]);
        }
      });

      // Add files if they exist
      if (profileData.profile_photo instanceof File) {
        formData.append('profile_photo', profileData.profile_photo);
      }
      if (profileData.id_document instanceof File) {
        formData.append('id_document', profileData.id_document);
      }
      if (profileData.certificate instanceof File) {
        formData.append('certificate', profileData.certificate);
      }

      // First, update account-level fields (gender lives on User)
      const userForm = new FormData();
      if (profileData.gender) userForm.append('gender', profileData.gender);
      try {
        if ([...userForm.keys()].length > 0) {
          await authAPI.updateUser(userForm);
        }
      } catch (err) {
        console.error('Failed updating user info:', err);
      }

      // Then update maid profile fields
      await maidAPI.updateMyProfile(formData);
      
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
            Complete your profile to increase your chances of getting hired
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

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
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              <div className="flex-shrink-0 self-center sm:self-auto">
                {previewImages.profile_photo ? (
                  <img
                    src={previewImages.profile_photo}
                    alt="Profile"
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <label className="btn-primary cursor-pointer inline-flex items-center w-full sm:w-auto justify-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                  <input
                    type="file"
                    name="profile_photo"
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

          {/* Personal Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  className="input-field"
                  value={profileData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  className="input-field"
                  value={profileData.date_of_birth}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <input
                    type="text"
                    name="location"
                    required
                    className="input-field flex-1"
                    placeholder="e.g., Nairobi, Westlands"
                    value={profileData.location}
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
                          location: label,
                        });
                      } catch (error) {
                        console.error('Error getting location:', error);
                        alert(geolocationErrorToMessage(error));
                      }
                    }}
                    className="btn-secondary whitespace-nowrap w-full sm:w-auto"
                  >
                    📍 Detect
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Click "Detect" to use your current location
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  className="input-field"
                  placeholder="Tell homeowners about yourself, your experience, and what makes you a great maid..."
                  value={profileData.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
              Professional Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience_years"
                  min="0"
                  required
                  className="input-field"
                  value={profileData.experience_years}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maid Category
                </label>
                <select
                  name="category"
                  className="input-field"
                  value={profileData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="temporary">Temporary</option>
                  <option value="live_in">Live-in</option>
                  <option value="placement">Domestic Staff Placement</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Temporary: come work and go. Live-in: moves in with the homeowner.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services you offer
                </label>

                {/* Predefined services checklist that keeps the skills field in sync */}
                <div className="mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MAID_SERVICE_OPTIONS.map((service) => (
                      <div key={service} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isServiceChecked(service)}
                            onChange={() => toggleServiceInSkills(service)}
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                        <input
                          type="text"
                          className="input-field text-xs"
                          placeholder="Starting pay for this service (optional)"
                          value={serviceRates[service] || ''}
                          onChange={(e) => handleServiceRateChange(service, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Free-text skills stays as the single source of truth sent to the backend */}
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                  Additional Skills & Services
                </label>
                <textarea
                  name="skills"
                  rows="3"
                  className="input-field"
                  placeholder="e.g., House cleaning, Laundry, Cooking, Ironing, Childcare"
                  value={profileData.skills}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  You can also type or edit your skills manually. They will be saved as one list.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="availability_status"
                    checked={profileData.availability_status}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I am currently available for work
                  </span>
                </label>
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
                  {previewImages.id_document ? (
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

              {/* Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate / Reference Letter <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  {previewImages.certificate ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-sm text-gray-600">Certificate uploaded</p>
                      <label className="btn-secondary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Change Certificate
                        <input
                          type="file"
                          name="certificate"
                          accept="image/*,.pdf"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <label className="btn-secondary cursor-pointer inline-flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                        <input
                          type="file"
                          name="certificate"
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
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary w-full sm:w-auto"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-secondary border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center w-full sm:w-auto"
              disabled={saving}
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete account
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center justify-center w-full sm:w-auto"
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

export default MaidProfileSettings;
