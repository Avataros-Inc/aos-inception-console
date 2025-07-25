import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Container, Nav, Navbar, Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import TextToAvatar from './TextToAvatar';
import AudioToAvatar from './AudioToAvatar';
import AccountSettings from './AccountSettings';
import Videos from './Videos';
import CharPage from './CharPage';
import AssetFetcher from './AssetFetcher';
import { getCharacters, getSessionToken, API_BASE_URL } from './postgrestAPI';
import { RenderQueue } from './Renders';
import { ComingSoonCard, AlphaCard } from './Components/ComingSoon';
import { Login, Register, ResetPassword } from './LoginRegister';
import { jwtDecode } from 'jwt-decode';
import ApiKeys from './ApiKeys';
import LiveStreamPage from './LiveStream';

import 'bootstrap/dist/css/bootstrap.min.css';
import {
  HouseDoor,
  Mic,
  Tv,
  Film,
  ChatSquareText,
  ArrowLeftRight,
  PersonBadge,
  Receipt,
  PersonCircle,
  Key,
  Easel,
  Globe,
} from 'react-bootstrap-icons';

// CSS for the sidebar and content
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '240px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: `1px solid var(--border-subtle)`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
  },
  logo: {
    padding: '20px',
    fontSize: '24px',
    fontWeight: '700',
    borderBottom: `1px solid var(--border-subtle)`,
    background: 'linear-gradient(135deg, var(--accent-mint) 0%, #10b981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontFamily: "'Montserrat', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.2rem',
  },
  content: {
    marginLeft: '240px',
    padding: '20px',
    width: 'calc(100% - 240px)',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  navGroup: {
    marginBottom: '15px',
    padding: '15px 0',
  },
  navGroupTitle: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    padding: '0 20px',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1rem',
    fontWeight: '600',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    fontSize: '14px',
    borderRadius: 0,
    transition: 'all 0.3s ease-out',
    borderLeft: '4px solid transparent',
  },
  navIcon: {
    marginRight: '12px',
    width: '20px',
    height: '20px',
  },
};

// Sidebar component
const Sidebar = () => {
  return (
    <div style={styles.sidebar} className="sidebar-glass">
      <div style={styles.logo} className="avataros-title">
        AvatarOS
      </div>

      <Nav className="flex-column mt-3">
        <Nav.Link as={Link} to="/" style={styles.navLink} className="nav-item">
          <HouseDoor style={styles.navIcon} />
          Home
        </Nav.Link>
      </Nav>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Characters</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/characters" style={styles.navLink} className="nav-item">
            <PersonBadge style={styles.navIcon} />
            Avatar Editor
          </Nav.Link>
          <Nav.Link as={Link} to="/console/trainer" style={styles.navLink} className="nav-item">
            <ChatSquareText style={styles.navIcon} />
            Avatar Trainer
          </Nav.Link>
        </Nav>
      </div>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Scenes</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/scenes" style={styles.navLink} className="nav-item">
            <Globe style={styles.navIcon} />
            My Scenes
          </Nav.Link>
          <Nav.Link as={Link} to="/console/scene-editor" style={styles.navLink} className="nav-item">
            <Easel style={styles.navIcon} />
            Scene Editor
          </Nav.Link>
        </Nav>
      </div>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Playground</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/text-to-avatar" style={styles.navLink} className="nav-item">
            <ArrowLeftRight style={styles.navIcon} />
            Text to Avatar
          </Nav.Link>
          <Nav.Link as={Link} to="/console/audio-to-avatar" style={styles.navLink} className="nav-item">
            <Mic style={styles.navIcon} />
            Audio to Avatar
          </Nav.Link>
          <Nav.Link as={Link} to="/console/conversational-ai" style={styles.navLink} className="nav-item">
            <ChatSquareText style={styles.navIcon} />
            Interactive Agent
          </Nav.Link>
        </Nav>
      </div>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Settings</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/renders" style={styles.navLink} className="nav-item">
            <Tv style={styles.navIcon} />
            Render Queue
          </Nav.Link>
          <Nav.Link as={Link} to="/console/videos" style={styles.navLink} className="nav-item">
            <Film style={styles.navIcon} />
            Videos
          </Nav.Link>
          <Nav.Link as={Link} to="/console/apikeys" style={styles.navLink} className="nav-item">
            <Key style={styles.navIcon} />
            API Keys
          </Nav.Link>
          <Nav.Link as={Link} to="/console/billing" style={styles.navLink} className="nav-item">
            <Receipt style={styles.navIcon} />
            Billing
          </Nav.Link>
          <Nav.Link as={Link} to="/console/account" style={styles.navLink} className="nav-item">
            <PersonCircle style={styles.navIcon} />
            Account
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
        } else {
          setApiStatus({ status: 'unhealthy' });
        }
      } catch (error) {
        setApiStatus({ status: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold gradient-text mb-2">Welcome to AvatarOS Console</h1>
        <p className="text-text-secondary text-lg">The future of AI-powered avatar creation and interaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="glass-effect">
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <PersonBadge className="me-2" style={{ color: 'var(--accent-mint)' }} />
              Avatar Creation
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-text-secondary mb-3">
              Create and customize lifelike 3D avatars with our advanced editor
            </p>
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Card.Body>
        </Card>

        <Card className="glass-effect">
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <Mic className="me-2" style={{ color: 'var(--accent-mint)' }} />
              AI Generation
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-text-secondary mb-3">Transform text and audio into expressive avatar content</p>
            <Button variant="primary" size="sm">
              Explore Tools
            </Button>
          </Card.Body>
        </Card>

        <Card className="glass-effect">
          <Card.Header>
            <Card.Title className="d-flex align-items-center">
              <ChatSquareText className="me-2" style={{ color: 'var(--accent-mint)' }} />
              Interactive Agents
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-text-secondary mb-3">Deploy conversational AI avatars across any platform</p>
            <Button variant="primary" size="sm">
              Deploy Now
            </Button>
          </Card.Body>
        </Card>
      </div>

      <Card className="glass-effect">
        <Card.Header>
          <Card.Title className="d-flex align-items-center">
            <Tv className="me-2" style={{ color: 'var(--accent-mint)' }} />
            System Status
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-text-secondary">API Endpoint: {API_BASE_URL}</small>
            </div>
            <div className="d-flex align-items-center">
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  <small className="text-text-secondary">Checking status...</small>
                </>
              ) : (
                <div className="d-flex align-items-center">
                  <div
                    className={`badge ${
                      apiStatus?.status === 'healthy' || apiStatus ? 'bg-success' : 'bg-danger'
                    } me-2`}
                  >
                    {apiStatus?.status === 'healthy' || apiStatus ? 'Online' : 'Offline'}
                  </div>
                  <small className="text-text-secondary">
                    {apiStatus?.status === 'error' ? apiStatus.message : 'System operational'}
                  </small>
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="mt-6">
        <AlphaCard />
      </div>
    </div>
  );
};

// Main App Component
const Console = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const data = await getCharacters();
        setCharacters(data);
      } catch (error) {
        console.error('Failed to load characters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<HomePage characters={characters} />} />
          <Route path="/characters" element={<CharPage characters={characters} />} />
          <Route path="/text-to-avatar" element={<TextToAvatar characters={characters} />} />
          <Route path="/audio-to-avatar" element={<AudioToAvatar characters={characters} />} />
          <Route
            path="/scenes"
            element={
              <div>
                <h2>My Scenes</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route
            path="/scene-editor"
            element={
              <div>
                <h2>Scene Editor</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route
            path="/trainer"
            element={
              <div>
                <h2>Avatar Trainer</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route path="/renders" element={<RenderQueue characters={characters} />} />
          <Route path="/videos" element={<Videos characters={characters} />} />
          <Route path="/conversational-ai" element={<LiveStreamPage characters={characters} />} />
          <Route path="/apikeys" element={<ApiKeys />} />
          <Route
            path="/billing"
            element={
              <div>
                <h2>Billing</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/fetch-asset/:org/:job/:filename" element={<AssetFetcher />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      try {
        const decoded = jwtDecode(sessionToken);
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setSession(null);
        } else {
          setSession(decoded);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        setSession(null);
      }
    } else {
      setSession(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/console" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/console" />} />
        <Route path="/reset-password" element={!session ? <ResetPassword /> : <Navigate to="/console" />} />
        <Route path="/console/*" element={session ? <Console session={session} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={session ? '/console' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
