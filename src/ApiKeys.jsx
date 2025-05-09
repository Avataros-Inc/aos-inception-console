import React, { useState, useEffect } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { getApiKeys, createApiKey } from './postgrestAPI'; // Import your API functions

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    expiresOption: '30days',
    customDate: ''
  });

  const handleApiKeyChange = async (e, apikey) => {
    //TODO
    console.log(e.target.checked);
    console.log(apikey);
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to fetch keys:', err);
      setError(err.message || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    try {
      // Calculate expires_at based on the selected option
      let expiresAt = null;
      const now = new Date();
      
      switch(formData.expiresOption) {
        case '7days':
          expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
          break;
        case '30days':
          expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();
          break;
        case '90days':
          expiresAt = new Date(now.setDate(now.getDate() + 90)).toISOString();
          break;
        case 'custom':
          if (formData.customDate) {
            expiresAt = new Date(formData.customDate).toISOString();
          }
          break;
        default:
          expiresAt = null;
      }

      // Call API to create new key
      const response = await createApiKey({
        name: formData.name,
        expires_at: expiresAt
      });

      // Show the new key in modal
      setNewKey(response.key); // Adjust based on your API response structure
      setShowModal(true);
      
      // Refresh the keys list
      await fetchApiKeys();
      
      // Reset form
      setFormData({
        name: '',
        expiresOption: '30days',
        customDate: ''
      });
    } catch (err) {
      console.error('Failed to generate key:', err);
      setError(err.message || 'Failed to generate key');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    // You could add a tooltip or notification here to confirm copy
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading api keys...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p>Error loading api keys: {error}</p>
        <Button variant="primary" onClick={fetchApiKeys}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Table striped bordered hover size="sm" className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>User</th>
            <th>Disabled</th>
            <th>Created At</th>
            <th>Expires At</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((apikey, index) => (
            <tr key={apikey.id}>
              <td>{apikey.name}</td>
              <td>{apikey.org_users.name} - {apikey.org_users.email}</td>
              <td>
                {apikey.is_disabled}
                <Form.Check type="checkbox" id={apikey.id} checked={apikey.is_disabled} onChange={(e) => handleApiKeyChange(e, apikey)} />
              </td>
              <td>{new Date(apikey.created_at).toLocaleString()}</td>
              <td>
              {apikey.expires_at === null ? "Never" : new Date(apikey.expires_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="card mt-4">
        <div className="card-header">
          <h5>Generate New API Key</h5>
        </div>
        <div className="card-body">
          <Form onSubmit={handleGenerateKey}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Key Name</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter a name for this key" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formExpiry">
              <Form.Label>Expiration</Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="expires7days"
                  label="7 days"
                  name="expiresOption"
                  value="7days"
                  checked={formData.expiresOption === '7days'}
                  onChange={handleInputChange}
                  inline
                />
                <Form.Check
                  type="radio"
                  id="expires30days"
                  label="30 days"
                  name="expiresOption"
                  value="30days"
                  checked={formData.expiresOption === '30days'}
                  onChange={handleInputChange}
                  inline
                />
                <Form.Check
                  type="radio"
                  id="expires90days"
                  label="90 days"
                  name="expiresOption"
                  value="90days"
                  checked={formData.expiresOption === '90days'}
                  onChange={handleInputChange}
                  inline
                />
                <Form.Check
                  type="radio"
                  id="expiresNever"
                  label="Never"
                  name="expiresOption"
                  value="never"
                  checked={formData.expiresOption === 'never'}
                  onChange={handleInputChange}
                  inline
                />
                <Form.Check
                  type="radio"
                  id="expiresCustom"
                  label="Custom date"
                  name="expiresOption"
                  value="custom"
                  checked={formData.expiresOption === 'custom'}
                  onChange={handleInputChange}
                  inline
                />
              </div>
              {formData.expiresOption === 'custom' && (
                <Form.Control
                  type="datetime-local"
                  className="mt-2"
                  name="customDate"
                  value={formData.customDate}
                  onChange={handleInputChange}
                  required={formData.expiresOption === 'custom'}
                />
              )}
            </Form.Group>

            <Button variant="primary" type="submit">
              Generate API Key
            </Button>
          </Form>
        </div>
      </div>

      {/* Modal to display new API key */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New API Key Generated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Here is your new API key. Make sure to copy it now as you won't be able to see it again:</p>
          <div className="input-group mb-3">
            <Form.Control
              type="text"
              value={newKey}
              readOnly
            />
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Copy to clipboard</Tooltip>}
            >
              <Button variant="outline-secondary" onClick={copyToClipboard}>
                <i className="bi bi-clipboard"></i> Copy
              </Button>
            </OverlayTrigger>
          </div>
          <p className="text-muted">This key will {formData.expiresOption === 'never' ? 'never expire' : `expire on ${new Date(
            formData.expiresOption === 'custom' ? formData.customDate : 
            formData.expiresOption === '7days' ? new Date(new Date().setDate(new Date().getDate() + 7)) :
            formData.expiresOption === '30days' ? new Date(new Date().setDate(new Date().getDate() + 30)) :
            new Date(new Date().setDate(new Date().getDate() + 90))
          ).toLocaleString()}`}.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ApiKeys;