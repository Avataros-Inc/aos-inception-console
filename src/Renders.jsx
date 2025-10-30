import React, { useState, useEffect } from 'react';
import { getLiveSessions, deleteLivestream } from './postgrestAPI';
import { MonitorPlay, Play, Square, RotateCcw, Clock, Loader2, RefreshCw } from 'lucide-react';

// Status mapping object for live sessions
const LIVE_STATUS = {
  0: { text: 'Unknown', variant: 'secondary', icon: Clock, bgColor: 'bg-slate-500', textColor: 'text-slate-100' },
  1: { text: 'Live', variant: 'primary', icon: Play, bgColor: 'bg-green-500', textColor: 'text-green-100' },
  2: { text: 'Ended', variant: 'warning', icon: Square, bgColor: 'bg-yellow-500', textColor: 'text-yellow-100' },
  3: { text: 'Completed', variant: 'success', icon: MonitorPlay, bgColor: 'bg-brand-500', textColor: 'text-brand-100' },
  4: { text: 'Failed', variant: 'danger', icon: Square, bgColor: 'bg-red-500', textColor: 'text-red-100' },
  5: { text: 'Processing', variant: 'info', icon: Loader2, bgColor: 'bg-blue-500', textColor: 'text-blue-100' },
  6: { text: 'Initializing', variant: 'info', icon: Loader2, bgColor: 'bg-cyan-500', textColor: 'text-cyan-100' },
  7: { text: 'Starting', variant: 'info', icon: Loader2, bgColor: 'bg-purple-500', textColor: 'text-purple-100' },
};

export const RenderQueue = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getLiveSessions();
      console.log('Fetched live sessions:', data);

      // Log each session's status details for debugging
      data.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          jobstatus: session.jobstatus,
          ended_at: session.ended_at,
          ended_at_type: typeof session.ended_at,
          ended_at_null: session.ended_at === null,
          ended_at_empty: session.ended_at === '',
        });
      });

      setSessions(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
      setError(err.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Only set up auto-refresh if enabled and there are active sessions
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSessions();
      }, 10000); // Increased to 10 seconds for less aggressive polling
    }

    // Cleanup interval on component unmount or when autoRefresh changes
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleEnd = async (sessionId) => {
    try {
      console.log('Ending live session:', sessionId);

      await deleteLivestream(sessionId);
      // Refresh the session list after successful termination
      await fetchSessions();
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to end live session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Loader2 className="animate-spin text-[#74ECC7] mb-3" size={32} />
        <p className="text-slate-400">Loading live sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
        <h5 className="flex items-center text-red-400 font-semibold mb-3">
          <MonitorPlay className="mr-2" size={20} />
          Error Loading Live Sessions
        </h5>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchSessions}
          className="bg-gradient-to-r from-brand-400 to-[#74ECC7] text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-[#74ECC7]/25 transition-all duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#74ECC7] to-green-500 bg-clip-text text-transparent mb-2">
              Live Sessions
            </h2>
            <p className="text-slate-400">Monitor and manage your active avatar live sessions</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-slate-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-[#74ECC7] focus:ring-[#74ECC7] focus:ring-offset-slate-800"
              />
              Auto-refresh (10s)
            </label>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#74ECC7] hover:bg-[#74ECC7] disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-white font-semibold">
            <MonitorPlay className="mr-2 text-[#74ECC7]" size={20} />
            Active Live Sessions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-slate-300 font-medium">#</th>
                <th className="text-left p-4 text-slate-300 font-medium">Session ID</th>
                <th className="text-left p-4 text-slate-300 font-medium">Avatar</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                <th className="text-left p-4 text-slate-300 font-medium">Created</th>
                <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => {
                const status = LIVE_STATUS[session.jobstatus] || LIVE_STATUS[0];
                const IconComponent = status.icon;

                // Debug logging for each session
                console.log(`Rendering session ${session.id}:`, {
                  jobstatus: session.jobstatus,
                  status_text: status.text,
                  ended_at: session.ended_at,
                  display_status: status,
                });

                return (
                  <tr key={session.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-white">#{index + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm font-mono">{session.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300">{session.avatar_id || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                      >
                        <IconComponent size={12} />
                        {status.text}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-400">{new Date(session.created_at).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      {session.jobstatus === 1 ? (
                        <button
                          onClick={() => handleEnd(session.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-red-500 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Square size={12} />
                          End Session
                        </button>
                      ) : session.jobstatus >= 5 ? (
                        <span className="text-cyan-400 text-sm flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" />
                          {session.jobstatus === 5
                            ? 'Processing...'
                            : session.jobstatus === 6
                            ? 'Initializing...'
                            : session.jobstatus === 7
                            ? 'Starting...'
                            : 'Loading...'}
                        </span>
                      ) : session.jobstatus === 2 || session.jobstatus === 4 ? (
                        <span className="text-slate-500 text-sm">Session Ended</span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="text-slate-400">
                      <MonitorPlay size={48} className="mb-3 mx-auto opacity-50" />
                      <p>No live sessions found. Start a livestream to see sessions here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
