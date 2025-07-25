import React, { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import { getRenderJobs, cancelRenderJob, retryRenderJob } from './postgrestAPI'
import { Tv, Play, Stop, ArrowClockwise, Clock } from 'react-bootstrap-icons'

// Status mapping object with AVATAROS styling
const JOB_STATUS = {
  0: { text: 'Unknown', variant: 'secondary', icon: Clock },
  1: { text: 'Active', variant: 'primary', icon: Play },
  2: { text: 'Suspended', variant: 'warning', icon: Stop },
  3: { text: 'Completed', variant: 'success', icon: Tv },
  4: { text: 'Failed', variant: 'danger', icon: Stop },
  6: { text: 'Pending', variant: 'info', icon: Clock }
}

export const RenderQueue = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRenderJobs()
      setJobs(data)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError(err.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleCancel = async (jobId) => {
    try {
      console.log('cancel', jobId)
      await cancelRenderJob(jobId)
      // Refresh the job list after successful cancellation
      await fetchJobs()
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to cancel job:', error)
    }
  }

  const handleRetry = async (jobId) => {
    try {
      await retryRenderJob(jobId)
      // Refresh the job list after successful retry
      await fetchJobs()
      // Optional: Show success notification
    } catch (error) {
      // Optional: Show error notification
      console.error('Failed to retry job:', error)
    }
  }

  if (loading) {
    return (
      <div
        className='d-flex flex-column align-items-center justify-content-center'
        style={{ minHeight: '400px' }}
      >
        <Spinner animation='border' role='status' style={{ color: 'var(--accent-mint)' }}>
          <span className='visually-hidden'>Loading...</span>
        </Spinner>
        <p className='mt-3 text-text-secondary'>Loading render jobs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='alert alert-danger glass-effect'>
        <h5 className='d-flex align-items-center'>
          <Tv className='me-2' />
          Error Loading Render Queue
        </h5>
        <p className='mb-3'>{error}</p>
        <Button variant='primary' onClick={fetchJobs}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <div className='mb-4'>
        <h2 className='gradient-text mb-2'>Render Queue</h2>
        <p className='text-text-secondary'>Monitor and manage your avatar rendering jobs</p>
      </div>

      <Card className='glass-effect'>
        <Card.Header>
          <Card.Title className='d-flex align-items-center mb-0'>
            <Tv className='me-2' style={{ color: 'var(--accent-mint)' }} />
            Active Render Jobs
          </Card.Title>
        </Card.Header>
        <Card.Body className='p-0'>
          <Table hover className='table-dark mb-0'>
            <thead>
              <tr>
                <th>#</th>
                <th>Job Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => {
                const status = JOB_STATUS[job.jobstatus] || JOB_STATUS[0]
                const IconComponent = status.icon

                return (
                  <tr key={job.id}>
                    <td>
                      <span className='fw-medium'>#{index + 1}</span>
                    </td>
                    <td>
                      <div className='fw-semibold'>{job.jobtype}</div>
                    </td>
                    <td>
                      <Badge
                        bg={status.variant}
                        className='d-flex align-items-center gap-1'
                        style={{ width: 'fit-content' }}
                      >
                        <IconComponent size={14} />
                        {status.text}
                      </Badge>
                    </td>
                    <td>
                      <small className='text-text-secondary'>
                        {new Date(job.created_at).toLocaleString()}
                      </small>
                    </td>
                    <td>
                      {job.jobstatus < 3 ? (
                        <Button
                          variant='outline-danger'
                          size='sm'
                          onClick={() => handleCancel(job.id)}
                          disabled={job.jobstatus === 0}
                          className='d-flex align-items-center gap-1'
                        >
                          <Stop size={14} />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => handleRetry(job.id)}
                          disabled={job.jobstatus === 3}
                          className='d-flex align-items-center gap-1'
                        >
                          <ArrowClockwise size={14} />
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan='5' className='text-center py-4'>
                    <div className='text-text-secondary'>
                      <Tv size={32} className='mb-2 d-block mx-auto opacity-50' />
                      No render jobs found. Start creating content to see jobs here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}
