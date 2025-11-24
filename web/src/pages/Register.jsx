import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    // User model fields
    username: '',
    email: '',
    password: '',
    password2: '',
    user_type: 'homeowner',
    phone_number: '',
    address: '',
    
    // Maid-specific fields (MaidProfile)
    full_name: '',
    date_of_birth: '',
    profile_photo: null,
    location: '',
    
    // Homeowner-specific fields (HomeownerProfile)
    home_address: '',
    home_type: 'apartment',
    number_of_rooms: 1,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match'] });
      setLoading(false);
      return;
    }

    // Validate maid-specific required fields
    if (formData.user_type === 'maid') {
      if (!formData.full_name || !formData.date_of_birth || !formData.location) {
        setErrors({ 
          non_field_errors: ['Please fill in all required maid information'] 
        });
        setLoading(false);
        return;
      }
    }

    // Prepare data for submission
    const submitData = new FormData();
    
    // Add all form fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        if (key === 'profile_photo' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'profile_photo') {
          submitData.append(key, formData[key]);
        }
      }
    });

    const result = await register(submitData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center"><BrandLogo sizeClass="h-16" /></div>
          <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join our community today</p>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'homeowner' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.user_type === 'homeowner'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-semibold">Homeowner</div>
                    <div className="text-xs text-gray-600 mt-1">Looking for a maid</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'maid' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.user_type === 'maid'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">👩‍🔧</div>
                    <div className="font-semibold">Maid</div>
                    <div className="text-xs text-gray-600 mt-1">Offering services</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                required
                className="input-field"
                placeholder="+254712345678 or 0712345678"
                value={formData.phone_number}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Primary contact and login identifier
              </p>
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field"
                placeholder="john@example.com (optional)"
                value={formData.email}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional - for email notifications
              </p>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
              )}
            </div>

            {/* Maid-specific fields */}
            {formData.user_type === 'maid' && (
              <>
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Jane Mary Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    className="input-field"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Nairobi, Westlands"
                    value={formData.location}
                    onChange={handleChange}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile_photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <input
                    id="profile_photo"
                    name="profile_photo"
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={handleChange}
                  />
                  {formData.profile_photo && (
                    <p className="mt-1 text-sm text-green-600">
                      Selected: {formData.profile_photo.name}
                    </p>
                  )}
                  {errors.profile_photo && (
                    <p className="mt-1 text-sm text-red-600">{errors.profile_photo[0]}</p>
                  )}
                </div>
              </>
            )}

            {/* Homeowner-specific fields */}
            {formData.user_type === 'homeowner' && (
              <>
                <div>
                  <label htmlFor="home_address" className="block text-sm font-medium text-gray-700 mb-2">
                    Home Address
                  </label>
                  <input
                    id="home_address"
                    name="home_address"
                    type="text"
                    className="input-field"
                    placeholder="123 Main Street, Nairobi"
                    value={formData.home_address}
                    onChange={handleChange}
                  />
                  {errors.home_address && (
                    <p className="mt-1 text-sm text-red-600">{errors.home_address[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="home_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Home Type
                    </label>
                    <select
                      id="home_type"
                      name="home_type"
                      className="input-field"
                      value={formData.home_type}
                      onChange={handleChange}
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                      <option value="condo">Condo</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="number_of_rooms" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Rooms
                    </label>
                    <input
                      id="number_of_rooms"
                      name="number_of_rooms"
                      type="number"
                      min="1"
                      className="input-field"
                      value={formData.number_of_rooms}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password2}
                  onChange={handleChange}
                />
                {errors.password2 && (
                  <p className="mt-1 text-sm text-red-600">{errors.password2[0]}</p>
                )}
              </div>
            </div>

            {errors.non_field_errors && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{errors.non_field_errors[0]}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
