import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { API_BASE_URL, getSessionToken } from '../postgrestAPI';
import { Button } from '@/Components/Button';
import { UserPlus, Loader2 } from 'lucide-react';

const AddUser = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/org_users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.error) {
        if (data.details) {
          throw new Error(`${data.error}: ${data.details}`);
        } else {
          throw new Error(`${data.error}`);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      //
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl mt-6">
      <div className="border-b border-slate-700/50 p-4">
        <h5 className="text-emerald-400 font-semibold mb-0">Add New User</h5>
      </div>
      <div className="p-6">
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-4">
            <p className="text-red-300 mb-0">Error: {error}</p>
          </div>
        )}

        <Form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">User's Name</label>
            <input
              type="text"
              placeholder="Enter a name for this user"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">User's Email</label>
            <input
              type="email"
              placeholder="Enter an e-mail for this user"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">User's Password</label>
            <input
              type="password"
              placeholder="Enter a default password for the user"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            {loading && <Loader2 className="animate-spin" size={16} />}
            Add New User
          </Button>
        </Form>
      </div>
    </div>
  );
};

const OrgUsers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [AddUserVisible, setAddUserVisible] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/org_users`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        });
        const data = await response.json();
        if (data && data.length > 0) {
          setKeys(data);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="animate-spin text-emerald-400 mb-3" size={24} />
        <p className="text-slate-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
        <p className="text-red-300 mb-0">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 font-medium text-slate-300">Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">E-Mail</th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">Disabled</th>
              <th className="text-left py-3 px-4 font-medium text-slate-300">ID</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((user) => (
              <tr key={user.user_id} className="border-b border-slate-700/50 hover:bg-slate-700/25">
                <td className="py-3 px-4 text-slate-200">{user.name}</td>
                <td className="py-3 px-4 text-slate-200">{user.email}</td>
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={user.is_disabled}
                    disabled={true}
                    className="rounded bg-slate-700 border-slate-600"
                  />
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-sm">{user.user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        {AddUserVisible ? (
          <AddUser />
        ) : (
          <Button onClick={() => setAddUserVisible(true)} className="flex items-center gap-2">
            <UserPlus size={16} />
            Add New User
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrgUsers;
