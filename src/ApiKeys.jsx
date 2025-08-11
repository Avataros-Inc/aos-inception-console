import { useState, useEffect } from 'react';
import { Container, Card, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { API_BASE_URL, getSession, authenticatedFetch, getSessionToken } from './postgrestAPI';
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

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);

      const response = await authenticatedFetch(`${API_BASE_URL}/apikeys`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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

    try {
      setCreatingKey(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/apikeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          user_id: getSession().user_id,
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setApiKeys([...apiKeys, newKey]);
        setShowModal(false);
        setNewKeyName('');
        setSuccess('API key created successfully!');
        setTimeout(() => setSuccess(null), 3000);
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
                    <th style={{ width: '25%', minWidth: '150px' }}>Key</th>
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
                      <td style={{ width: '25%', minWidth: '150px' }}>
                        <div className="d-flex align-items-center">
                          <code className="text-accent me-2">
                            {key.key
                              ? `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
                              : 'Hidden'}
                          </code>
                          {key.key && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-accent"
                              onClick={() => copyToClipboard(key.key)}
                              title="Copy to clipboard"
                            >
                              📋
                            </Button>
                          )}
                        </div>
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">Create New API Key</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Key Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter a descriptive name for this API key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-dark text-white border-secondary"
                disabled={creatingKey}
              />
              <Form.Text className="text-light-gray">
                Choose a name that helps you identify where this key will be used.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
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
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApiKeys;
