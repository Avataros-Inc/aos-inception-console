import { useState } from 'react';
import { API_BASE_URL, getSessionToken } from '../postgrestAPI';
import { Button } from '@/Components/Button';
import { Loader2 } from 'lucide-react';

const UpdatePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL + '/rpc/update_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-4">
          <p className="text-red-300 mb-0">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 mb-4">
          <p className="text-green-300 mb-0">{success}</p>
        </div>
      )}

      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label className="block text-slate-300 font-medium mb-2">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-2">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 font-medium mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
          {isLoading && <Loader2 className="animate-spin" size={16} />}
          Update Password
        </Button>
      </form>
    </div>
  );
};
export default UpdatePassword;
