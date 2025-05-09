import React, { useState, useEffect  } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Container, Nav, Navbar, Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import TextToAvatar from './TextToAvatar';
import AudioToAvatar from './AudioToAvatar';
import AccountSettings from './AccountSettings';
import CharPage from './CharPage';
import { getCharacters, getSessionToken, API_BASE_URL } from './postgrestAPI';
import { RenderQueue } from './Renders';
import ComingSoonCard from './Components/ComingSoon';
import { Login, Register, ResetPassword} from './LoginRegister'
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
  Globe 
} from 'react-bootstrap-icons';

// CSS for the sidebar and content
const styles = {

  container: {
    // width: '100%',
    // display: 'flex',
  },

  sidebar: {
    width: '180px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 1000,
  },
  logo: {
    padding: '15px',
    fontSize: '20px',
    borderBottom: '1px solid #e9ecef',
  },
  content: {
    marginLeft: '180px',
    padding: '20px',
    width: 'calc(100% - 180px)',
    // width: '100%',
    minHeight: '100vh',
    
  },
  navGroup: {
    marginBottom: '10px',
    padding: '10px 0',
  },
  navGroupTitle: {
    fontSize: '12px',
    color: '#6c757d',
    padding: '0 15px',
    marginBottom: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 15px',
    textDecoration: 'none',
    color: '#495057',
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: 0,
  },
  navIcon: {
    marginRight: '10px',
    width: '20px',
    height: '20px',
  },

};

// Sidebar component
const Sidebar = () => {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
          AvatarOS
      </div>

      <Nav className="flex-column mt-3">
        <Nav.Link as={Link} to="/" style={styles.navLink}>
          <HouseDoor style={styles.navIcon} />
          Home
        </Nav.Link>      
      </Nav>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Characters</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/characters" style={styles.navLink}>
            <PersonBadge style={styles.navIcon} />
            Avatar Editor
          </Nav.Link>
          <Nav.Link as={Link} to="/console/conversational-ai" style={styles.navLink}>
            <ChatSquareText style={styles.navIcon} />
            Avatar Trainer
          </Nav.Link>
        </Nav>
      </div>

      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Scenes</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/scenes" style={styles.navLink}>
            <Globe style={styles.navIcon} />
            My Scenes
          </Nav.Link>
          <Nav.Link as={Link} to="/console/scene-editor" style={styles.navLink}>
            <Easel style={styles.navIcon} />
            Scene Editor
          </Nav.Link>
        </Nav>
      </div>
      
      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Playground</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/text-to-avatar" style={styles.navLink}>
            <ArrowLeftRight style={styles.navIcon} />
            Text to Avatar
          </Nav.Link>
          <Nav.Link as={Link} to="/console/audio-to-avatar" style={styles.navLink}>
            <Mic style={styles.navIcon} />
            Audio to Avatar
          </Nav.Link>
          <Nav.Link as={Link} to="/console/conversational-ai" style={styles.navLink}>
            <ChatSquareText style={styles.navIcon} />
            Interactive Agent
          </Nav.Link>
        </Nav>
      </div>
      
      <div style={styles.navGroup}>
        <div style={styles.navGroupTitle}>Settings</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/console/renders" style={styles.navLink}>
            <Tv style={styles.navIcon} />
            Render Queue
          </Nav.Link>
          <Nav.Link as={Link} to="/console/videos" style={styles.navLink}>
            <Film style={styles.navIcon} />
            Videos
          </Nav.Link>
          <Nav.Link as={Link} to="/console/apikeys" style={styles.navLink}>
            <Key style={styles.navIcon} />
            API Keys
          </Nav.Link>
          <Nav.Link as={Link} to="/console/billing" style={styles.navLink}>
            <Receipt style={styles.navIcon} />
            Billing
          </Nav.Link>
          <Nav.Link as={Link} to="/console/account" style={styles.navLink}>
            <PersonCircle style={styles.navIcon} />
            Account
          </Nav.Link>          
        </Nav>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = ({characters}) => {
  return (
    <div>
      <h2>Welcome to the AvatarOS Console</h2>
                <div className="text-right mt-3">
                  <small className="text-muted">Api: {API_BASE_URL}</small>
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
        console.error("Failed to load characters:", error);
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
          <Route path="/scenes" element={<div><h2>My Scenes</h2><ComingSoonCard /></div>} />
          <Route path="/scene-editor" element={<div><h2>Scene Editor</h2><ComingSoonCard /></div>} />
          <Route path="/renders" element={<RenderQueue characters={characters} />}  />
          <Route path="/videos" element={<div><h2>Videos</h2></div>} />
          <Route path="/conversational-ai" element={<LiveStreamPage characters={characters} />} />
          <Route path="/apikeys" element={<ApiKeys />} />
          <Route path="/billing" element={<div><h2>Billing</h2></div>} />
          <Route path="/account" element={<AccountSettings />} />
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
          setSession(decoded)
        }
      } catch (error) {
        console.error("Invalid token:", error);
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
        <Route path="/" element={<Navigate to={session ? "/console" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;