import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { sendLoginPin, verifyLoginPin } = useAuth();
  const [formData, setFormData] = useState({
    phone_number: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await sendLoginPin(formData.phone_number.trim());

    if (result.success) {
      setCodeSent(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await verifyLoginPin({
      phone_number: formData.phone_number.trim(),
      pin: formData.pin.trim(),
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center"><BrandLogo sizeClass="h-20" showText /></div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-3 text-gray-600">Sign in to your account</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={codeSent ? handleVerify : handleSendCode}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
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
            </div>

            {codeSent && (
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Code
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  maxLength={6}
                  required
                  className="input-field tracking-widest text-center"
                  placeholder="Enter 6-digit code"
                  value={formData.pin}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              {codeSent && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  disabled={loading}
                >
                  Resend code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {codeSent ? 'Verifying...' : 'Sending code...'}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {codeSent ? 'Sign In' : 'Send WhatsApp Code'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Register here
              </Link>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Login;
