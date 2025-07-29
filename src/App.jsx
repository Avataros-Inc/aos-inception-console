import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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
import { Sidebar } from './Components/Sidebar';
import { Header } from './Components/Header';

import {
  Home,
  Mic,
  MonitorPlay,
  Video,
  MessageSquare,
  ArrowLeftRight,
  Users,
  Receipt,
  User as UserIcon,
  Key,
  Palette,
  Globe,
  Loader2,
} from 'lucide-react';

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-2">
          Welcome to AvatarOS Console
        </h1>
        <p className="text-slate-400 text-lg">The future of AI-powered avatar creation and interaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <Users className="mr-3 text-emerald-400" size={24} />
            <h3 className="text-xl font-semibold text-white">Avatar Creation</h3>
          </div>
          <p className="text-slate-400 mb-4">Create and customize lifelike 3D avatars with our advanced editor</p>
          <button className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300">
            Get Started
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <Mic className="mr-3 text-emerald-400" size={24} />
            <h3 className="text-xl font-semibold text-white">AI Generation</h3>
          </div>
          <p className="text-slate-400 mb-4">Transform text and audio into expressive avatar content</p>
          <button className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300">
            Explore Tools
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1">
          <div className="flex items-center mb-4">
            <MessageSquare className="mr-3 text-emerald-400" size={24} />
            <h3 className="text-xl font-semibold text-white">Interactive Agents</h3>
          </div>
          <p className="text-slate-400 mb-4">Deploy conversational AI avatars across any platform</p>
          <button className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300">
            Deploy Now
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <MonitorPlay className="mr-3 text-emerald-400" size={24} />
          <h3 className="text-xl font-semibold text-white">System Status</h3>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-slate-400">API Endpoint: {API_BASE_URL}</span>
          </div>
          <div className="flex items-center">
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 text-emerald-400" size={16} />
                <span className="text-sm text-slate-400">Checking status...</span>
              </>
            ) : (
              <div className="flex items-center">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium mr-2 ${
                    apiStatus?.status === 'healthy' || apiStatus
                      ? 'bg-green-500 text-green-900'
                      : 'bg-red-500 text-red-900'
                  }`}
                >
                  {apiStatus?.status === 'healthy' || apiStatus ? 'Online' : 'Offline'}
                </div>
                <span className="text-sm text-slate-400">
                  {apiStatus?.status === 'error' ? apiStatus.message : 'System operational'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <Sidebar />
      <div className="ml-0 lg:ml-64 pl-4 pr-4 pt-16 min-h-screen " style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Routes>
          <Route path="/" element={<HomePage characters={characters} />} />
          <Route path="/characters" element={<CharPage characters={characters} />} />
          <Route path="/text-to-avatar" element={<TextToAvatar characters={characters} />} />
          <Route path="/audio-to-avatar" element={<AudioToAvatar characters={characters} />} />
          <Route
            path="/scenes"
            element={
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">My Scenes</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route
            path="/scene-editor"
            element={
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Scene Editor</h2>
                <ComingSoonCard />
              </div>
            }
          />
          <Route
            path="/trainer"
            element={
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Avatar Trainer</h2>
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
                <h2 className="text-2xl font-bold text-white mb-4">Billing</h2>
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
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
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
