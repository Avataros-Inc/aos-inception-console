import React, { useState, useEffect } from 'react';
import { getRenderJobs, cancelRenderJob, retryRenderJob } from './postgrestAPI';
import { MonitorPlay, Play, Square, RotateCcw, Clock, Loader2 } from 'lucide-react';

// Status mapping object
const JOB_STATUS = {
  0: { text: 'Unknown', variant: 'secondary', icon: Clock, bgColor: 'bg-slate-500', textColor: 'text-slate-100' },
  1: { text: 'Active', variant: 'primary', icon: Play, bgColor: 'bg-blue-500', textColor: 'text-blue-100' },
  2: { text: 'Suspended', variant: 'warning', icon: Square, bgColor: 'bg-yellow-500', textColor: 'text-yellow-100' },
  3: { text: 'Completed', variant: 'success', icon: MonitorPlay, bgColor: 'bg-green-500', textColor: 'text-green-100' },
  4: { text: 'Failed', variant: 'danger', icon: Square, bgColor: 'bg-red-500', textColor: 'text-red-100' },
  6: { text: 'Pending', variant: 'info', icon: Clock, bgColor: 'bg-cyan-500', textColor: 'text-cyan-100' },
};

export const RenderQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: REMOVE BYPASS - Mock render jobs data for UI testing
      const mockJobs = [
        {
          id: 1,
          jobtype: 'text-to-avatar',
          jobstatus: 3,
          created_at: new Date().toISOString(),
          config: { character: 'Alex Thompson', text: 'Hello world!' },
        },
        {
          id: 2,
          jobtype: 'audio-to-avatar',
          jobstatus: 1,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          config: { character: 'Sarah Chen', audio_duration: 30 },
        },
        {
          id: 3,
          jobtype: 'text-to-avatar',
          jobstatus: 4,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          config: { character: 'Marcus Rodriguez', text: 'Testing failed job' },
        },
      ];
      setJobs(mockJobs);
      return;
      // END BYPASS - Uncomment below when API is available

      // const data = await getRenderJobs();
      // setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCancel = async (jobId) => {
    try {
      console.log('cancel', jobId);

      // TODO: REMOVE BYPASS - Mock cancel operation for UI testing
      console.log(`Mocking cancel for job ${jobId}`);
      // Update the job status locally to simulate the operation
      setJobs((prevJobs) => prevJobs.map((job) => (job.id === jobId ? { ...job, jobstatus: 2 } : job)));
      return;
      // END BYPASS - Uncomment below when API is available

      // await cancelRenderJob(jobId);
      // // Refresh the job list after successful cancellation
      // await fetchJobs();
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to cancel job:', error);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      // TODO: REMOVE BYPASS - Mock retry operation for UI testing
      console.log(`Mocking retry for job ${jobId}`);
      // Update the job status locally to simulate the operation
      setJobs((prevJobs) => prevJobs.map((job) => (job.id === jobId ? { ...job, jobstatus: 6 } : job)));
      return;
      // END BYPASS - Uncomment below when API is available

      // await retryRenderJob(jobId);
      // // Refresh the job list after successful retry
      // await fetchJobs();
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to retry job:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Loader2 className="animate-spin text-emerald-400 mb-3" size={32} />
        <p className="text-slate-400">Loading render jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
        <h5 className="flex items-center text-red-400 font-semibold mb-3">
          <MonitorPlay className="mr-2" size={20} />
          Error Loading Render Queue
        </h5>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchJobs}
          className="bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-2">
          Render Queue
        </h2>
        <p className="text-slate-400">Monitor and manage your avatar rendering jobs</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="border-b border-slate-700/50 p-4">
          <h3 className="flex items-center text-white font-semibold">
            <MonitorPlay className="mr-2 text-emerald-400" size={20} />
            Active Render Jobs
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-slate-300 font-medium">#</th>
                <th className="text-left p-4 text-slate-300 font-medium">Job Type</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                <th className="text-left p-4 text-slate-300 font-medium">Created</th>
                <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => {
                const status = JOB_STATUS[job.jobstatus] || JOB_STATUS[0];
                const IconComponent = status.icon;

                return (
                  <tr key={job.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-white">#{index + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{job.jobtype}</div>
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
                      <span className="text-sm text-slate-400">{new Date(job.created_at).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      {job.jobstatus < 3 ? (
                        <button
                          onClick={() => handleCancel(job.id)}
                          disabled={job.jobstatus === 0}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-red-500 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Square size={12} />
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={job.jobstatus === 3}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={12} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="text-slate-400">
                      <MonitorPlay size={48} className="mb-3 mx-auto opacity-50" />
                      <p>No render jobs found. Start creating content to see jobs here.</p>
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
