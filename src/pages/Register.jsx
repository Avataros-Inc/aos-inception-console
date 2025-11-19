import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../postgrestAPI';
import { Check, X } from 'lucide-react';

// Get password validation criteria
const getPasswordCriteria = (password) => {
  const hasLength = password.length >= 8 && password.length <= 32;
  const hasNumber = /[0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
  const hasSpecial = password.split('').some(char => specialChars.includes(char));

  return {
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
};

// Password validation function matching backend requirements
const validatePassword = (password) => {
  const criteria = getPasswordCriteria(password);

  if (!criteria.hasLength) {
    return 'Password must be between 8 and 32 characters long';
  }

  const errors = [];
  if (!criteria.hasNumber) errors.push('at least one number');
  if (!criteria.hasUpper) errors.push('at least one uppercase letter');
  if (!criteria.hasLower) errors.push('at least one lowercase letter');
  if (!criteria.hasSpecial) errors.push('at least one special character');

  if (errors.length > 0) {
    return `Password must contain: ${errors.join(', ')}`;
  }

  return null;
};

// Register.jsx
export const Register = () => {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Validate password in real-time
    if (newPassword) {
      const validationError = validatePassword(newPassword);
      setPasswordError(validationError);
    } else {
      setPasswordError(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_name: orgName,
          billing_email: email,
          user_name: userName,
          user_email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Successful registration
      setRegistered(true);
    } catch (error) {
      setError(error.message);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 mb-6">
              <p className="text-emerald-300 text-sm text-center">
                Please check your email to verify your account. You must verify your email address before you can sign in.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get password criteria for display
  const passwordCriteria = getPasswordCriteria(password);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h2 className="text-center text-2xl font-bold text-white mb-2">Create your Organization</h2>
          <p className="text-center text-slate-400 text-sm mb-6">
            Check your email for an invitation link if joining an existing organization
          </p>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Organization Name</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@acme.com"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
              />
            </div>
            {password && (
              <div className="pt-2">
                <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                  <p className="text-slate-300 text-xs font-medium mb-2">Password requirements:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasLength ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${passwordCriteria.hasLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                        8-32 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasUpper ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                        At least one uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasLower ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${passwordCriteria.hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
                        At least one lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasNumber ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.hasSpecial ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
            >
              Create Account
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="#/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
