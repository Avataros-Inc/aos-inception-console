import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, setSessionObj } from './postgrestAPI';
import { AlphaCard } from './Components/ComingSoon';
import { Loader2 } from 'lucide-react';

// Re-export Register and EmailVerificationPending from their new location
export { Register, EmailVerificationPending } from './pages/Register';

// Login.jsx
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
        } else {
          setApiStatus({ status: 'unhealthy' });
        }
      } catch (error) {
        setApiStatus({ status: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_BASE_URL + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Successful login - data contains org_id, token, and user_id
      setSessionObj(data);
      window.location.reload();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AlphaCard />
        <div className="mt-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold text-white mb-6">Sign in to your account</h2>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <input
                type="password"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
            >
              Sign in
            </button>
          </form>
          <div className="text-center mt-6 space-x-2">
            <a href="#/register" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Register
            </a>
            <span className="text-slate-500">|</span>
            <a href="#/reset-password" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="text-right mt-4">
            <small className="text-slate-500">Api: {API_BASE_URL}</small>
          </div>
          {loading ? (
            <div className="flex items-center mt-2">
              <Loader2 className="animate-spin text-emerald-400 mr-2" size={16} />
              <small className="text-slate-400">Checking status...</small>
            </div>
          ) : (
            <div className="mt-2">
              <small className="text-slate-500">Status: {JSON.stringify(apiStatus)}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ResetPassword.jsx
export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const returnUrl = `${window.location.origin}/#/reset-password-confirm`;

      const response = await fetch(API_BASE_URL + '/passwordReset', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, returnUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setMessage(data.message || 'Check your email for the password reset link');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold text-white mb-6">Reset your password</h2>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mb-4">
              <p className="text-green-300 text-sm">{message}</p>
            </div>
          )}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <input
                type="email"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
            >
              Send reset link
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="#/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ResetPasswordConfirm.jsx
export const ResetPasswordConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extract token from URL hash parameters
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleResetPasswordConfirm = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + 'passwordReset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage('Password reset successfully! You can now login with your new password.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold text-white mb-6">Reset your password</h2>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mb-4">
              <p className="text-green-300 text-sm">{message}</p>
            </div>
          )}
          {token ? (
            <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
              <div>
                <input
                  type="password"
                  className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
              >
                Reset password
              </button>
            </form>
          ) : (
            <p className="text-slate-300 text-center">Invalid or missing reset token.</p>
          )}
          <div className="text-center mt-6">
            <a href="#/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};