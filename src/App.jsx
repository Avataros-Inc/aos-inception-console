import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import TextToAvatar from './TextToAvatar';
import AudioToAvatar from './AudioToAvatar';
import AccountSettings from './AccountSettings';
import Files from './Files';
import CharPage from './CharPage';
import AssetFetcher from './AssetFetcher';
import { getCharacters, getSessionToken, API_BASE_URL, onAuthError, removeSession } from './postgrestAPI';
import { jwtDecode } from 'jwt-decode';
import { RenderQueue } from './Renders';
import { ComingSoonCard, AlphaCard } from './Components/ComingSoon';
import { Login, Register, ResetPassword, ResetPasswordConfirm } from './LoginRegister';
import ApiKeys from './ApiKeys';
import LiveStreamPage from './LiveStream';
import { Sidebar } from './Components/Sidebar';
import { Header } from './Components/Header';
import { ConfigProvider } from './contexts/ConfigContext';
import { AvatarLivestreamProvider } from './contexts/AvatarLivestreamContext';

import {
  Home,
  Mic,
  MonitorPlay,
  Video,
  MessageSquare,
  ArrowLeftRight,
  Receipt,
  User as UserIcon,
  Key,
  Palette,
  Globe,
  Loader2
} from 'lucide-react';
import BillingPage from './pages/Billing';
import CreditsCard from './pages/CreditsCard';


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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="animate-spin text-accent-mint" size={32} />
      </div>
    );
  }

  return (
    <AvatarLivestreamProvider>
      <ConfigProvider characters={characters}>
        <div className="min-h-screen bg-background">
          <div className="fixed top-3 left-4 text-3xl">HelloAvatarOS</div>
          <Header />
          <Sidebar />
          <div className="ml-0 lg:ml-64 pl-4 pr-4 pt-16 min-h-screen " style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Routes>
              <Route path="/" element={<CharPage characters={characters} />} />
              <Route path="/characters" element={<CharPage characters={characters} />} />
              <Route path="/text-to-avatar" element={<TextToAvatar />} />
              <Route path="/audio-to-avatar" element={<AudioToAvatar />} />
              <Route
                path="/scenes"
                element={
                  <div>
                    <h2 className="gradient-text text-3xl font-bold text-white mb-4">My Scenes</h2>
                    <ComingSoonCard />
                  </div>
                }
              />
              <Route
                path="/scene-editor"
                element={
                  <div>
                    <h2 className="gradient-text text-3xl font-bold text-white mb-4">Scene Editor</h2>
                    <ComingSoonCard />
                  </div>
                }
              />
              <Route
                path="/trainer"
                element={
                  <div>
                    <h2 className="gradient-text text-3xl font-bold text-white mb-4">Avatar Trainer</h2>
                    <ComingSoonCard />
                  </div>
                }
              />
              <Route path="/renders" element={<RenderQueue characters={characters}/>} />
              <Route path="/files" element={<Files />} />
              <Route path="/conversational-ai" element={<LiveStreamPage />} />
              <Route path="/conversational-ai/:sessionId" element={<LiveStreamPage />} />
              <Route path="/apikeys" element={<ApiKeys />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/credits" element={<CreditsCard />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/fetch-asset/:org/:job/:filename" element={<AssetFetcher />} />
            </Routes>
          </div>
        </div>
      </ConfigProvider>
    </AvatarLivestreamProvider>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      try {
        const decoded = jwtDecode(sessionToken);
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setSession(null);
          removeSession();
        } else {
          setSession(decoded);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        setSession(null);
        removeSession();
      }
    } else {
      setSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Listen for authentication errors from API calls
    const unsubscribe = onAuthError((event) => {
      console.log('Authentication error detected:', event.detail);
      setSession(null);
      // The redirect to login is already handled in the authenticatedFetch function
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="animate-spin text-accent-mint" size={32} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/console" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/console" />} />
        <Route path="/reset-password" element={!session ? <ResetPassword /> : <Navigate to="/console" />} />
        <Route path="/reset-password-confirm" element={!session ? <ResetPasswordConfirm /> : <Navigate to="/console" />} />
        <Route path="/console/*" element={session ? <Console session={session} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={session ? '/console' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
