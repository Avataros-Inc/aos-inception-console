import { useState, useEffect } from 'react'
import { Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, setSessionObj } from './postgrestAPI';
import 'bootstrap/dist/css/bootstrap.min.css';


// Login.jsx
export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
  
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
          const response = await fetch(API_BASE_URL + '/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
      
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }
      
          // Successful login - data contains org_id, token, and user_id
          setSessionObj(data);
          window.location.reload();
        navigate('/');
          
        } catch (error) {
          setError(error.message);
        }
      };
  
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <h2 className="text-center mb-4">Sign in to your account</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Sign in
            </button>
          </form>
          <div className="text-center mt-3">
            <a href="#/register" className="text-decoration-none me-2">Register</a>
            |
            <a href="#/reset-password" className="text-decoration-none ms-2">Forgot password?</a>
          </div>
          <div className="text-right mt-3">
            <small className="text-muted">Api: {API_BASE_URL}</small>
          </div>
        </div>
      </Container>
    );
  };
  
  // Register.jsx
export const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState("Registration currently by invite only");
    const [success, setSuccess] = useState(null);
    const [currentUrl, setCurrentUrl] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate
  
    // useEffect(() => {
    //   // Get the current URL when the component mounts
    //   setCurrentUrl(window.location.href);
    // }, []); 
    
    // useEffect(() => {
    //   let timer;
    //   if (success) {
    //     timer = setTimeout(() => {
    //       navigate('/'); // Redirect to homepage after 5 seconds
    //     }, 5000);
    //   }
    //   return () => clearTimeout(timer); // Cleanup timer on component unmount
    // }, [success, navigate]);
  
    // const handleRegister = async (e) => {
    //   e.preventDefault();
    //   try {
    //     const { error } = await supabase.auth.signUp({
    //       email,
    //       password,
    //       options: {
    //         emailRedirectTo: currentUrl
    //       }
    //     });
    //     if (error) throw error;
    //     setSuccess('Registration successful! Please check your email to confirm your account.');
    //     setError(null);
    //   } catch (error) {
    //     setError(error.message);
    //   }
    // };
  
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <h2 className="text-center mb-4">Create your account</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && (<div className="alert alert-success mt-3" role="alert">{success}</div>)}   

          {/* <form onSubmit={handleRegister}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form> */}
          <div className="text-center mt-3">
            <a href="#/login" className="text-decoration-none">Already have an account? Sign in</a>
          </div>
        </div>
      </Container>
    );
  };
  
  // ResetPassword.jsx
export const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
  
    const handleResetPassword = async (e) => {
      e.preventDefault();
      try {
        // TODO: ensure redirects to the correct page
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Check your email for the password reset link');
      } catch (error) {
        setError(error.message);
      }
    };
  
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <h2 className="text-center mb-4">Reset your password</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Send reset link
            </button>
          </form>
          <div className="text-center mt-3">
            <a href="#/login" className="text-decoration-none">Back to login</a>
          </div>
        </div>
      </Container>
    );
  };