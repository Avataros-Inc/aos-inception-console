import React, { useState, useEffect } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import { getRenderJobs, cancelRenderJob, retryRenderJob } from './postgrestAPI'; // Import your API function

// Status mapping object
const JOB_STATUS = {
  0: { text: 'Unknown', variant: 'secondary' },
  1: { text: 'Active', variant: 'primary' },
  2: { text: 'Suspended', variant: 'warning' },
  3: { text: 'Completed', variant: 'success' },
  4: { text: 'Failed', variant: 'danger' },
  6: { text: 'Pending', variant: 'info' }
};

export const RenderQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRenderJobs();
      setJobs(data);
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
      console.log("cancel",jobId);
      await cancelRenderJob(jobId);
      // Refresh the job list after successful cancellation
      await fetchJobs();
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to cancel job:', error);
    }
  };
  
  const handleRetry = async (jobId) => {
    try {
      await retryRenderJob(jobId);
      // Refresh the job list after successful retry
      await fetchJobs();
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to retry job:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading render jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p>Error loading render jobs: {error}</p>
        <Button variant="primary" onClick={fetchJobs}>
          Retry
        </Button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <div className="alert alert-info">No render jobs found</div>;
  }

  return (
    <Table striped bordered hover size="sm" className="mt-3">
      <thead>
        <tr>
          <th>#</th>
          <th>Job Type</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job, index) => (
          <tr key={job.id}>
            <td>{index + 1}</td>
            <td>{job.jobtype}</td>
            <td>
              <Badge bg={JOB_STATUS[job.jobstatus]?.variant || 'secondary'}>
                {JOB_STATUS[job.jobstatus]?.text || 'Unknown'}
              </Badge>
            </td>
            <td>{new Date(job.created_at).toLocaleString()}</td>
            <td>
              {job.jobstatus < 3 ? (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleCancel(job.id)}
                  disabled={job.jobstatus === 0} // Optionally disable for unknown status
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </Button>
              ) : (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleRetry(job.id)}
                  disabled={job.jobstatus === 3} // Optionally disable for completed
                >
                  <i className="bi bi-arrow-repeat"></i> Retry
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};