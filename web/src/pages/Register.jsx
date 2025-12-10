import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { UserPlus, AlertCircle } from 'lucide-react';
import { cleaningCompanyAPI, homeNursingAPI, authAPI } from '../services/api';

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

    // Cleaning Company
    company_name: '',
    company_location: '',
    company_services: [],
    company_display_photo: null,

    // Home Nursing
    nursing_level: 'registered',
    council_registration_number: '',
    years_of_experience: 0,
    nurse_services: [],
    preferred_working_hours: '',
    emergency_availability: false,
    nurse_location: '',
    nurse_display_photo: null,
    nurse_date_of_birth: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cleaningCategories, setCleaningCategories] = useState(null);
  const [nursingCategories, setNursingCategories] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const getAdultMaxDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Fetch grouped categories when corresponding role is selected
  useEffect(() => {
    const fetchCleaning = async () => {
      const res = await cleaningCompanyAPI.categoriesGrouped();
      setCleaningCategories(res.data);
    };
    const fetchNursing = async () => {
      const res = await homeNursingAPI.categoriesGrouped();
      setNursingCategories(res.data);
    };
    if (formData.user_type === 'cleaning_company' && !cleaningCategories) fetchCleaning();
    if (formData.user_type === 'home_nurse' && !nursingCategories) fetchNursing();
  }, [formData.user_type]);

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

  const handleCheckboxArray = (name, id) => {
    const current = new Set(formData[name]);
    if (current.has(id)) current.delete(id); else current.add(id);
    setFormData({ ...formData, [name]: Array.from(current) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!acceptedTerms) {
      setErrors({ non_field_errors: ['You must agree to the MaidMatch Terms & Conditions before creating an account.'] });
      setLoading(false);
      return;
    }

    // Enforce 18+ age for maids and home nurses on the client side
    const computeAge = (isoDate) => {
      if (!isoDate) return null;
      const dob = new Date(isoDate);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    };

    if (formData.user_type === 'maid') {
      const age = computeAge(formData.date_of_birth);
      if (age !== null && age < 18) {
        setErrors({ non_field_errors: ['Maids must be at least 18 years old.'] });
        setLoading(false);
        return;
      }
    }

    if (formData.user_type === 'home_nurse') {
      const age = computeAge(formData.nurse_date_of_birth);
      if (age !== null && age < 18) {
        setErrors({ non_field_errors: ['Home nurses must be at least 18 years old.'] });
        setLoading(false);
        return;
      }
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

    // Prepare data for submission - only fields expected by accounts/register.
    const submitData = new FormData();
    const baseKeys = ['username', 'email', 'user_type', 'phone_number', 'address', 'password', 'password2'];
    baseKeys.forEach((k) => {
      const v = formData[k];
      if (v !== undefined && v !== null && v !== '') submitData.append(k, v);
    });

    // Include maid/homeowner extras because backend registration creates these profiles
    if (formData.user_type === 'maid') {
      ['full_name', 'date_of_birth', 'location'].forEach((k) => {
        const v = formData[k];
        if (v) submitData.append(k, v);
      });
      if (formData.profile_photo) submitData.append('profile_photo', formData.profile_photo);
    }
    if (formData.user_type === 'home_nurse') {
      // Pass nurse DOB to the accounts/register endpoint so the backend can
      // enforce the 18+ rule before creating the user record.
      if (formData.nurse_date_of_birth) {
        submitData.append('date_of_birth', formData.nurse_date_of_birth);
      }
    }
    if (formData.user_type === 'homeowner') {
      ['home_address', 'home_type', 'number_of_rooms'].forEach((k) => {
        const v = formData[k];
        if (v !== undefined && v !== null && v !== '') submitData.append(k, v);
      });
    }

    const result = await register(submitData);

    if (result.success) {
      try {
        // After account creation, create the role-specific profile if needed
        if (formData.user_type === 'cleaning_company') {
          await authAPI.getCsrfToken();
          const ccForm = new FormData();
          ccForm.append('company_name', formData.company_name);
          ccForm.append('location', formData.company_location);
          formData.company_services.forEach((id) => ccForm.append('services', id));
          if (formData.company_display_photo) ccForm.append('display_photo', formData.company_display_photo);
          await cleaningCompanyAPI.register(ccForm);
        } else if (formData.user_type === 'home_nurse') {
          await authAPI.getCsrfToken();
          const nurseForm = new FormData();
          // Include phone_number so the backend can resolve the underlying
          // User for this HomeNurse profile without relying on JWT auth.
          if (formData.phone_number) {
            nurseForm.append('phone_number', formData.phone_number);
          }
          nurseForm.append('nursing_level', formData.nursing_level);
          if (formData.council_registration_number) nurseForm.append('council_registration_number', formData.council_registration_number);
          nurseForm.append('years_of_experience', String(Number(formData.years_of_experience) || 0));
          (formData.nurse_services || []).forEach((id) => nurseForm.append('services', id));
          if (formData.preferred_working_hours) nurseForm.append('preferred_working_hours', formData.preferred_working_hours);
          nurseForm.append('emergency_availability', formData.emergency_availability ? 'true' : 'false');
          if (formData.nurse_location) nurseForm.append('location', formData.nurse_location);
          if (formData.nurse_date_of_birth) nurseForm.append('date_of_birth', formData.nurse_date_of_birth);
          if (formData.nurse_display_photo) nurseForm.append('display_photo', formData.nurse_display_photo);
          await homeNursingAPI.register(nurseForm);
        }

        // After successful registration + profile creation, send user to login
        // so they can continue with the OTP-based login flow.
        navigate('/login');
      } catch (e) {
        // If profile creation fails, show error but keep user registered
        setErrors(e.response?.data || { non_field_errors: ['Failed to create profile'] });
      }
    } else {
      setErrors(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center"><BrandLogo sizeClass="h-20" showText /></div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Join our community today</p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'homeowner' })}
                  className={`p-4 border-2 rounded-lg transition-all ${formData.user_type === 'homeowner'
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
                  className={`p-4 border-2 rounded-lg transition-all ${formData.user_type === 'maid'
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

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'cleaning_company' })}
                  className={`p-4 border-2 rounded-lg transition-all ${formData.user_type === 'cleaning_company'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🧹</div>
                    <div className="font-semibold">Cleaning Company</div>
                    <div className="text-xs text-gray-600 mt-1">Provide cleaning services</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, user_type: 'home_nurse' })}
                  className={`p-4 border-2 rounded-lg transition-all ${formData.user_type === 'home_nurse'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-300'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🩺</div>
                    <div className="font-semibold">Home Nursing</div>
                    <div className="text-xs text-gray-600 mt-1">Professional nursing services</div>
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
                placeholder="+256702345678 or 0772345678"
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
                placeholder="john@gmail.com (optional)"
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
                placeholder="Enter a strong password"
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
                placeholder="Re-enter your password"
                value={formData.password2}
                onChange={handleChange}
              />
              {errors.password2 && (
                <p className="mt-1 text-sm text-red-600">{errors.password2[0]}</p>
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
                    placeholder="Jane Doe"
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
                    max={getAdultMaxDate()}
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
                    placeholder="Munyonyo, Kampala"
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

            {/* Cleaning Company fields */}
            {formData.user_type === 'cleaning_company' && (
              <>
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Company name *
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    required
                    className="input-field"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="company_location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    id="company_location"
                    name="company_location"
                    type="text"
                    required
                    className="input-field"
                    value={formData.company_location}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">Select services *</div>
                  {!cleaningCategories ? (
                    <p className="text-sm text-gray-500">Loading categories...</p>
                  ) : (
                    Object.entries(cleaningCategories).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="mb-3">
                        <div className="font-semibold text-sm mb-1">{groupLabel}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map((item) => (
                            <label key={item.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.company_services.includes(item.id)}
                                onChange={() => handleCheckboxArray('company_services', item.id)}
                              />
                              <span className="text-sm">{item.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <label htmlFor="company_display_photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Display Photo
                  </label>
                  <input
                    id="company_display_photo"
                    name="company_display_photo"
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={handleChange}
                  />
                  {formData.company_display_photo && (
                    <p className="mt-1 text-sm text-green-600">Selected: {formData.company_display_photo.name}</p>
                  )}
                </div>
              </>
            )}

            {/* Home Nursing fields */}
            {formData.user_type === 'home_nurse' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Image *
                  </label>
                  <input
                    name="nurse_display_photo"
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={handleChange}
                    required
                  />
                  {formData.nurse_display_photo && (
                    <p className="mt-1 text-sm text-green-600">Selected: {formData.nurse_display_photo.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    name="nurse_date_of_birth"
                    type="date"
                    max={getAdultMaxDate()}
                    className="input-field"
                    value={formData.nurse_date_of_birth}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nursing level *</label>
                    <select
                      name="nursing_level"
                      className="input-field"
                      value={formData.nursing_level}
                      onChange={handleChange}
                    >
                      <option value="enrolled">Enrolled Nurse</option>
                      <option value="registered">Registered Nurse</option>
                      <option value="midwife">Midwife</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Council registration number</label>
                    <input
                      name="council_registration_number"
                      type="text"
                      className="input-field"
                      value={formData.council_registration_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of experience</label>
                    <input
                      name="years_of_experience"
                      type="number"
                      min="0"
                      className="input-field"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred working hours</label>
                    <input
                      name="preferred_working_hours"
                      type="text"
                      className="input-field"
                      value={formData.preferred_working_hours}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="emergency_availability"
                    name="emergency_availability"
                    type="checkbox"
                    checked={!!formData.emergency_availability}
                    onChange={(e) => setFormData({ ...formData, emergency_availability: e.target.checked })}
                  />
                  <label htmlFor="emergency_availability" className="text-sm text-gray-700">
                    Emergency availability
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    name="nurse_location"
                    type="text"
                    className="input-field"
                    value={formData.nurse_location}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">Select services *</div>
                  {!nursingCategories ? (
                    <p className="text-sm text-gray-500">Loading categories...</p>
                  ) : (
                    Object.entries(nursingCategories).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="mb-3">
                        <div className="font-semibold text-sm mb-1">{groupLabel}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map((item) => (
                            <label key={item.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.nurse_services.includes(item.id)}
                                onChange={() => handleCheckboxArray('nurse_services', item.id)}
                              />
                              <span className="text-sm">{item.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
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
                    placeholder="Plot 42, Ntinda Kisasi Road, Kampala"
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

            {/* Password fields removed: all users authenticate via OTP-based login */}

            {errors.non_field_errors && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{errors.non_field_errors[0]}</span>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-gray-700">
              <input
                id="acceptedTerms"
                name="acceptedTerms"
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="acceptedTerms" className="leading-tight">
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary-600 hover:text-primary-500 font-medium">
                  MaidMatch Uganda Terms &amp; Conditions
                </Link>
                .
              </label>
            </div>

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
