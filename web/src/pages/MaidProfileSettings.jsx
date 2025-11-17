import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maidAPI } from '../services/api';
import { 
  User, Calendar, MapPin, Phone, Mail, Briefcase, 
  DollarSign, FileText, Upload, Camera, Save, 
  CheckCircle, AlertCircle, Star, Award 
} from 'lucide-react';

const MaidProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    bio: '',
    
    // Professional Info
    experience_years: 0,
    hourly_rate: '',
    skills: '',
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
        bio: profile.bio || '',
        experience_years: profile.experience_years || 0,
        hourly_rate: profile.hourly_rate || '',
        skills: profile.skills || '',
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
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
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
                <label className="btn-primary cursor-pointer inline-flex items-center">
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
                <div className="flex space-x-2">
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
                    onClick={() => {
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
                              
                              setProfileData({
                                ...profileData,
                                location: location
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
                  Hourly Rate (KSH) *
                </label>
                <input
                  type="number"
                  name="hourly_rate"
                  min="0"
                  step="0.01"
                  required
                  className="input-field"
                  placeholder="e.g., 500"
                  value={profileData.hourly_rate}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Services
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
                  List your skills separated by commas
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

export default MaidProfileSettings;
