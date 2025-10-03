import { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Alert, Spinner } from 'react-bootstrap';
import { API_BASE_URL, authenticatedFetch, getSessionToken, getOrgId } from './postgrestAPI';
import { Button } from '@/Components/Button';

const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [expirationOption, setExpirationOption] = useState('30d');
  const [customDate, setCustomDate] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [createdKeyValue, setCreatedKeyValue] = useState(null);
  const [createdKeyExpires, setCreatedKeyExpires] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);

      // Fetch API keys with user info using a join
      const response = await authenticatedFetch(
        `${API_BASE_URL}/apikeys?select=*,org_users!fk_user_id(name,email)&org_id=eq.${getOrgId()}`
      );

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
        setError(null);
      } else {
        throw new Error(`Failed to fetch API keys: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    let expires_at = null;
    if (expirationOption === '7d') {
      expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expirationOption === '30d') {
      expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expirationOption === '90d') {
      expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expirationOption === 'custom' && customDate) {
      expires_at = new Date(customDate).toISOString();
    } // Never: expires_at stays null

    try {
      setCreatingKey(true);
      setError(null);
      const response = await authenticatedFetch(`${API_BASE_URL}/apikeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          org_id: getOrgId(),
          expires_at,
        }),
      });

      if (response.ok) {
        const newKeyArr = await response.json();
        // Handle both array and object response
        const newKey = Array.isArray(newKeyArr) ? newKeyArr[0] : newKeyArr;
        await fetchApiKeys();
        setShowModal(false);
        setCreatedKeyValue(newKey.apikey || '');
        setCreatedKeyExpires(expires_at || null);
        setShowKeyModal(true);
        setNewKeyName('');
      } else {
        throw new Error(`Failed to create API key: ${response.status}`);
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      setError('Failed to create API key. Please try again.');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/apikeys?id=eq.${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== keyId));
        setSuccess('API key deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(`Failed to delete API key: ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key. Please try again.');
    }
  };

  const toggleApiKeyStatus = async (keyId, currentStatus) => {
    try {
      setUpdatingKey(keyId);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/apikeys?id=eq.${keyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_disabled: currentStatus, // If currently active (true), set is_disabled to true
        }),
      });

      if (response.ok) {
        // Update the local state
        setApiKeys(apiKeys.map((key) => (key.id === keyId ? { ...key, is_disabled: currentStatus } : key)));
        setSuccess(`API key ${currentStatus ? 'disabled' : 'enabled'} successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(`Failed to update API key: ${response.status}`);
      }
    } catch (err) {
      console.error('Error updating API key:', err);
      setError('Failed to update API key status. Please try again.');
    } finally {
      setUpdatingKey(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setSuccess('API key copied to clipboard!');
        setTimeout(() => setSuccess(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setError('Failed to copy to clipboard');
      });
  };

  const expirationOptions = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: 'never', label: 'Never' },
    { value: 'custom', label: 'Custom date' },
  ];

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="gradient-text text-3xl font-bold mb-6">API Keys</h1>
          <p className="text-light-gray mb-0">Manage your API keys for programmatic access to AVATAROS services</p>
        </div>
        <Button variant="secondary" className="btn-modern" onClick={() => setShowModal(true)} disabled={loading}>
          Create New Key
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="glass-effect mb-4 p-2 rounded-sm" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          className="glass-effect mb-4 p-2 rounded-sm"
          onClose={() => setSuccess(null)}
          dismissible
        >
          {success}
        </Alert>
      )}

      <Card className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl">
        <Card.Header className="p-4 border-b border-border-subtle">
          <Card.Title className="mb-0 text-xl font-semibold">Your API Keys</Card.Title>
        </Card.Header>
        <Card.Body className="p-4">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="light" />
              <p className="text-light-gray mt-2">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-light-gray mb-3">No API keys found</p>
              <Button variant="outline-light" className="btn-modern" onClick={() => setShowModal(true)}>
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table variant="dark" hover className="mb-0 api-keys-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%', minWidth: '120px' }}>Name</th>
                    <th style={{ width: '20%', minWidth: '120px' }}>User</th>
                    <th style={{ width: '15%', minWidth: '100px' }}>Status</th>
                    <th style={{ width: '15%', minWidth: '100px' }}>Created</th>
                    <th style={{ width: '15%', minWidth: '100px' }}>Last Used</th>
                    <th style={{ width: '10%', minWidth: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id}>
                      <td style={{ width: '20%', minWidth: '120px' }}>
                        <strong className="text-white">{key.name}</strong>
                      </td>
                      <td style={{ width: '20%', minWidth: '120px' }}>
                        <span className="text-light-gray">
                          {key.org_users ? `${key.org_users.name} (${key.org_users.email})` : 'Unknown'}
                        </span>
                      </td>
                      <td style={{ width: '15%', minWidth: '100px' }}>
                        <div className="d-flex align-items-center">
                          <Form.Check
                            type="checkbox"
                            checked={!key.is_disabled}
                            onChange={() => toggleApiKeyStatus(key.id, !key.is_disabled)}
                            disabled={updatingKey === key.id}
                            className="me-2"
                          />
                          {updatingKey === key.id ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-sm text-sm font-medium ${
                                !key.is_disabled ? 'text-accent-mint' : 'text-light-gray'
                              }`}
                            >
                              {!key.is_disabled ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ width: '15%', minWidth: '100px' }} className="text-light-gray">
                        {formatDate(key.created_at)}
                      </td>
                      <td style={{ width: '15%', minWidth: '100px' }} className="text-light-gray">
                        {key.last_used ? formatDate(key.last_used) : 'Never'}
                      </td>
                      <td style={{ width: '10%', minWidth: '80px' }}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                          title="Delete API key"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create API Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-subtle">
              <h5 className="text-white text-xl font-semibold">Create New API Key</h5>
              <button
                onClick={() => setShowModal(false)}
                className="text-light-gray hover:text-white focus:outline-none text-2xl leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label htmlFor="newKeyName" className="text-white block mb-1 font-medium">
                  Key Name
                </label>
                <input
                  id="newKeyName"
                  type="text"
                  placeholder="Enter a descriptive name for this API key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded p-2 text-white placeholder-gray-400"
                  disabled={creatingKey}
                />
              </div>
              <div className="mb-4">
                <label className="text-white block mb-1 font-medium">Expiration</label>
                <select
                  className="w-full bg-bg-secondary border border-border-subtle rounded p-2 text-white"
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value)}
                  disabled={creatingKey}
                >
                  {expirationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {expirationOption === 'custom' && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-bg-secondary border border-border-subtle rounded p-2 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 px-6 py-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={creatingKey}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createApiKey} disabled={creatingKey || !newKeyName.trim()}>
                {creatingKey ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  'Create API Key'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Show created API Key modal (only once) */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-bg-secondary rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-subtle">
              <h5 className="text-white text-xl font-semibold">New API Key Generated</h5>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setCreatedKeyValue(null);
                  setCreatedKeyExpires(null);
                }}
                className="text-light-gray hover:text-white focus:outline-none text-2xl leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="mb-3 text-light-gray">
                Here is your new API key. Make sure to copy it now as you won't be able to see it again:
              </p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={createdKeyValue || ''}
                  readOnly
                  className="w-full bg-slate-800 text-accent px-3 py-2 rounded border border-border-subtle"
                  style={{ fontFamily: 'monospace', fontSize: '1rem' }}
                />
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => copyToClipboard(createdKeyValue)}
                  title="Copy to clipboard"
                >
                  Copy
                </Button>
              </div>
              {createdKeyExpires && (
                <div className="mb-4 text-light-gray text-sm">
                  This key will expire on {createdKeyExpires ? formatDate(createdKeyExpires) : 'Never'}.
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowKeyModal(false);
                    setCreatedKeyValue(null);
                    setCreatedKeyExpires(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default ApiKeys;
