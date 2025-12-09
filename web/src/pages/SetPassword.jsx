import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import BrandLogo from '../components/BrandLogo';
import { KeyRound, AlertCircle } from 'lucide-react';

const SetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    new_password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Backend ignores old_password for set_initial_password, but the
      // serializer expects the field, so send an empty string.
      await authAPI.setInitialPassword({
        old_password: '',
        new_password: formData.new_password,
        new_password2: formData.new_password2,
      });
      setSuccess('Password set successfully. You can now use it to log in.');
      // Optionally redirect back to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.new_password) {
        setError(data.new_password[0]);
      } else if (data?.new_password2) {
        setError(data.new_password2[0]);
      } else {
        setError('Failed to set password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center"><BrandLogo sizeClass="h-20" showText /></div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Set Your Password</h2>
            <p className="mt-2 text-gray-600 text-sm">
              Create a password you will use with your phone number to sign in to MaidMatch.
            </p>
          </div>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                className="input-field"
                value={formData.new_password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="new_password2" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="new_password2"
                name="new_password2"
                type="password"
                required
                className="input-field"
                value={formData.new_password2}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving password...
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  Set Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
