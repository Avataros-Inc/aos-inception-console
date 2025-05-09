import { useState, useEffect } from 'react'
import { Button, Spinner, Form, Table } from 'react-bootstrap';
import { API_BASE_URL, getSessionToken, getSession } from '../postgrestAPI';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
    PersonAdd
} from 'react-bootstrap-icons';

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
        setFormData(prev => ({
            ...prev,
            [name]: value
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
                    'Authorization': `Bearer ${getSessionToken()}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(formData)
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

    }


    return (
        <div className="card mt-4">
            <div className="card-header">
                <h5>Add New User</h5>
            </div>
            <div className="card-body">

                {error ? <div className="alert alert-danger"> Error: {error}</div> : ''}


                <Form onSubmit={handleCreateUser}>
                    <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Users Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter a name for this user"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Users Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter an e-mail for this user"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formPassword">
                        <Form.Label>Users Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter a default password for the user"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </Form.Group>


                    <Button variant="primary" type="submit" disabled={loading}>
                        Add New User
                    </Button>
                </Form>
            </div>
        </div>
    );
}

const OrgUsers = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [keys, setKeys] = useState([]);
    const [AddUserVisible, setAddUserVisible] = useState(false);


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_BASE_URL}/org_users`, {
                    headers: {
                        'Authorization': `Bearer ${getSessionToken()}`
                    }
                });
                const data = await response.json();
                if (data && data.length > 0) {
                    setKeys(data);
                }
            } catch (error) {
                setError('Failed to fetch user data');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (isLoading) {
        return (
            <div className="mb-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="mb-5">
            <h5 className=" mb-3">Org Users</h5>
            <Table striped bordered hover size="sm" className="mt-3">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>E-Mail</th>
                        <th>Disabled</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map((user, index) => (
                        <tr key={user.user_id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <Form.Check type="checkbox" checked={user.is_disabled} disabled={true} />
                            </td>
                            <td>{user.user_id}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {AddUserVisible ? <AddUser /> : <Button onClick={() => setAddUserVisible(true)}><PersonAdd /></Button>}

        </div>
    );

};

export default OrgUsers;