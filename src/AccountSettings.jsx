import { useState, useEffect } from 'react';
import { Container, Spinner, Form, Table, Card, Button, Alert } from 'react-bootstrap';
import { API_BASE_URL, getSessionToken, getSession } from './postgrestAPI';
import UpdatePassword from './Account/UpdatePassword';
import OrgUsers from './Account/OrgUsers';
import { PersonCircle, Shield, People } from 'react-bootstrap-icons';

const AccountSettings = () => {
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
      } catch (error) {
        setError('Failed to fetch user data');
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

  if (!userData) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status" style={{ color: 'var(--accent-mint)' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-text-secondary">Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="gradient-text mb-2">Account Settings</h2>
        <p className="text-text-secondary">Manage your profile and organization settings</p>
      </div>

      {/* Profile Section */}
      <Card className="glass-effect mb-4">
        <Card.Header>
          <Card.Title className="d-flex align-items-center mb-0">
            <PersonCircle className="me-2" style={{ color: 'var(--accent-mint)' }} />
            Profile Information
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-3">
              {success}
            </Alert>
          )}

          <Form onSubmit={handleProfileUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your display name"
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={isLoading} className="d-flex align-items-center gap-2">
              {isLoading && <Spinner size="sm" />}
              Update Profile
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Password Section */}
      <Card className="glass-effect mb-4">
        <Card.Header>
          <Card.Title className="d-flex align-items-center mb-0">
            <Shield className="me-2" style={{ color: 'var(--accent-mint)' }} />
            Security
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <UpdatePassword />
        </Card.Body>
      </Card>

      {/* Organization Users Section */}
      <Card className="glass-effect">
        <Card.Header>
          <Card.Title className="d-flex align-items-center mb-0">
            <People className="me-2" style={{ color: 'var(--accent-mint)' }} />
            Organization Users
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <OrgUsers />
        </Card.Body>
      </Card>
    </div>
  );
};

export default AccountSettings;
