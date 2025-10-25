import { useState, useEffect } from 'react';
import { Spinner, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, getSessionToken, getSession, removeSession } from './postgrestAPI';
import UpdatePassword from './Account/UpdatePassword';
import OrgUsers from './Account/OrgUsers';
import { User, Shield, Users, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/Components/Button';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      console.log(`${API_BASE_URL}/org_users?user_id=eq.${getSession().user_id}`);
      try {
        const response = await fetch(`${API_BASE_URL}/org_users?user_id=eq.${getSession().user_id}`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        });
        const data = await response.json();
        if (data && data.length > 0) {
          setUserData(data[0]);
          setName(data[0].name);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/org_users?user_id=eq.${userData.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeSession();
    navigate('/');
  };

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Loader2 className="animate-spin text-accent-mint mb-3" size={32} />
        <p className="text-slate-400">Loading account information...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="gradient-text text-3xl font-bold mb-6">Account Settings</h2>
        <p className="text-slate-400">Manage your profile and organization settings</p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl mb-6">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-accent-mint font-semibold mb-0">
            <User className="mr-2" size={20} />
            Profile Information
          </h3>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-4">
              <p className="text-red-300 mb-0">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-brand-900/20 border border-brand-700/50 rounded-xl p-4 mb-4">
              <p className="text-brand-300 mb-0">{success}</p>
            </div>
          )}

          <Form onSubmit={handleProfileUpdate}>
            <Form.Group className="mb-4">
              <Form.Label className="block text-slate-300 font-medium mb-2">Display Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your display name"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint"
              />
            </Form.Group>
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              Update Profile
            </Button>
          </Form>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl mb-6">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-accent-mint font-semibold mb-0">
            <Shield className="mr-2" size={20} />
            Security
          </h3>
        </div>
        <div className="p-6">
          <UpdatePassword />
        </div>
      </div>

      {/* Organization Users Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl mb-6">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-accent-mint font-semibold mb-0">
            <Users className="mr-2" size={20} />
            Organization Users
          </h3>
        </div>
        <div className="p-6">
          <OrgUsers />
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-red-400 font-semibold mb-0">
            <LogOut className="mr-2" size={20} />
            Logout
          </h3>
        </div>
        <div className="p-6">
          <p className="text-slate-400 mb-4">Sign out of your account and return to the login page.</p>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
