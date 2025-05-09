import { useState, useEffect } from 'react'
import { Container, Spinner, Form, Table } from 'react-bootstrap';
import { API_BASE_URL, getSessionToken, getSession } from './postgrestAPI';
import UpdatePassword from './Account/UpdatePassword';
import OrgUsers from './Account/OrgUsers';
import 'bootstrap/dist/css/bootstrap.min.css';

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
                        'Authorization': `Bearer ${getSessionToken()}`
                    }
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
                    'Authorization': `Bearer ${getSessionToken()}`
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
            <Container className="d-flex justify-content-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="d-flex">
            <div className="w-100">
                <h2 className="mb-4">Account Settings</h2>

                {/* Profile Section */}
                <div className="mb-5">
                    <h5 className="mb-3">Profile Information</h5>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <Form onSubmit={handleProfileUpdate}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Update Profile'}
                        </button>
                    </Form>
                </div>

                <UpdatePassword />
                <OrgUsers />



            </div>
        </Container>
    );
};

export default AccountSettings;