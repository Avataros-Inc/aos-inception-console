import React, { useState, useEffect, useRef } from 'react';
import { getFiles, getFileById, deleteFile, uploadFile, API_BASE_URL } from './postgrestAPI';
import {
  File as FileIcon,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardPreview, CardContent, CardBadge, CardActions, CardTitle, CardDescription } from './Components/Card';
import { Button } from './Components/Button';
import { Modal, ModalHeader, ModalContent, ModalFooter } from './Components/Modal';

// Helper to get file icon based on content type
const getFileIcon = (contentType, extension) => {
  if (!contentType && !extension) return FileIcon;

  const type = contentType?.toLowerCase() || '';
  const ext = extension?.toLowerCase() || '';

  if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    return FileVideo;
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return FileAudio;
  }
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return FileImage;
  }
  if (type.startsWith('text/') || ['txt', 'md', 'json', 'xml'].includes(ext)) {
    return FileText;
  }

  return FileIcon;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const FileCard = ({ file, onDelete }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const FileIconComponent = getFileIcon(file.content_type, file.extension);

  // Check if file has a thumbnail (based on API documentation, it's available for files)
  const hasThumbnail = file.thumbnail || file.id;

  const handleDownload = async () => {
    try {
      setLoading(true);

      // Get the file with presigned URL if we don't have it yet
      if (!fileUrl) {
        const fileData = await getFileById(file.id);
        setFileUrl(fileData.url);
        window.open(fileData.url, '_blank');
      } else {
        window.open(fileUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${file.pretty_name || file.id}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteFile(file.id);
      onDelete(file.id);
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      {/* Preview section */}
      <CardPreview>
        {hasThumbnail && !thumbnailError ? (
          <>
            {/* Loading spinner while thumbnail streams from backend */}
            {thumbnailLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                <Loader2 className="text-accent-mint animate-spin" size={32} />
              </div>
            )}

            <img
              src={`${API_BASE_URL}/api/v1/file/${file.id}/thumbnail`}
              alt={file.pretty_name || file.id}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                thumbnailLoading ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onLoad={() => setThumbnailLoading(false)}
              onError={() => {
                setThumbnailError(true);
                setThumbnailLoading(false);
              }}
            />

            {/* Fallback background if image doesn't load */}
            {!thumbnailLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 -z-10">
                <FileIconComponent className="text-accent-mint" size={48} />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center">
            <FileIconComponent className="text-accent-mint" size={48} />
          </div>
        )}
        {file.extension && (
          <CardBadge className="absolute top-2 right-2">
            {file.extension.toUpperCase()}
          </CardBadge>
        )}
      </CardPreview>

      {/* Content section */}
      <CardContent>
        <CardTitle className="mb-1 truncate" title={file.pretty_name || file.id}>
          {file.pretty_name || file.id}
        </CardTitle>
        <CardDescription className="mb-3">
          {file.content_type || 'Unknown type'}
        </CardDescription>

        {/* File details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Size</span>
            <span className="text-text-primary">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Created</span>
            <span className="text-text-primary">{new Date(file.created_at).toLocaleString()}</span>
          </div>
          {file.created_by && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Created by</span>
              <span className="text-text-primary truncate ml-2" title={file.created_by}>
                {file.created_by}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border-subtle">
          <CardActions>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 size={16} className="mr-1 animate-spin" />
              ) : (
                <Download size={16} className="mr-1" />
              )}
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-300"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
          </CardActions>
        </div>
      </CardContent>
    </Card>
  );
};

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, images, videos, audio, documents
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFiles({ order_by: 'created_at', order_direction: 'desc' });
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDeleteFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  };

  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setUploading(true);
    const uploadProgressArray = Array.from(filesToUpload).map((file) => ({
      name: file.name,
      status: 'uploading',
      progress: 0,
      error: null,
    }));
    setUploadProgress(uploadProgressArray);

    try {
      const uploadPromises = Array.from(filesToUpload).map(async (file, index) => {
        try {
          const result = await uploadFile(file, file.name);

          setUploadProgress(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'completed', progress: 100, error: null };
            return updated;
          });

          return result;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);

          const errorMessage = err.message || 'Unknown error occurred';

          setUploadProgress(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: 'failed',
              progress: 0,
              error: errorMessage
            };
            return updated;
          });

          return null;
        }
      });

      await Promise.all(uploadPromises);

      // Refresh the files list after all uploads complete
      await fetchFiles();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    // Only allow closing if not currently uploading
    if (!uploading) {
      setUploadProgress([]);
    }
  };

  const getUploadStats = () => {
    const completed = uploadProgress.filter(f => f.status === 'completed').length;
    const failed = uploadProgress.filter(f => f.status === 'failed').length;
    const uploading = uploadProgress.filter(f => f.status === 'uploading').length;
    return { completed, failed, uploading, total: uploadProgress.length };
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
    // Reset input so the same file can be uploaded again
    e.target.value = '';
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;

    const type = file.content_type?.toLowerCase() || '';
    const ext = file.extension?.toLowerCase() || '';

    if (filter === 'images') {
      return type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    }
    if (filter === 'videos') {
      return type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
    }
    if (filter === 'audio') {
      return type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
    }
    if (filter === 'documents') {
      return type.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'pdf', 'doc', 'docx'].includes(ext);
    }

    return true;
  });

  const getFilterCount = (filterType) => {
    if (filterType === 'all') return files.length;

    return files.filter(file => {
      const type = file.content_type?.toLowerCase() || '';
      const ext = file.extension?.toLowerCase() || '';

      if (filterType === 'images') {
        return type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      }
      if (filterType === 'videos') {
        return type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
      }
      if (filterType === 'audio') {
        return type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
      }
      if (filterType === 'documents') {
        return type.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'pdf', 'doc', 'docx'].includes(ext);
      }

      return false;
    }).length;
  };

  if (loading) {
    return (
      <div>
        <h2 className="gradient-text text-3xl font-bold text-white mb-6">Files</h2>
        <div className="flex flex-col items-center justify-center min-h-96">
          <Loader2 className="animate-spin text-accent-mint mb-3" size={32} />
          <p className="text-slate-400">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="gradient-text text-3xl font-bold text-white mb-6">Files</h2>
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
          <h5 className="flex items-center text-red-400 font-semibold mb-3">
            <XCircle className="mr-2" size={20} />
            Error Loading Files
          </h5>
          <p className="text-red-300 mb-4">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchFiles}
          >
            <RefreshCw size={16} className="mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-bg-secondary border-2 border-dashed border-accent-mint rounded-2xl p-12 text-center max-w-lg mx-4">
            <Upload className="text-accent-mint mx-auto mb-4" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">Drop files here</h3>
            <p className="text-slate-400">Release to upload your files</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="gradient-text text-3xl font-bold text-white">Files</h2>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleUploadButtonClick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <Upload size={16} className="mr-1" />
            )}
            Upload
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchFiles}
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload progress modal */}
      <Modal isOpen={uploadProgress.length > 0} onClose={handleCloseUploadModal} closeOnBackdrop={!uploading}>
        <ModalHeader onClose={!uploading ? handleCloseUploadModal : null}>
          Upload Progress
        </ModalHeader>
        <ModalContent>
          {uploadProgress.length > 0 && (() => {
            const stats = getUploadStats();
            return (
              <>
                {/* Summary stats */}
                <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Total Files:</span>
                    <span className="text-text-primary font-semibold">{stats.total}</span>
                  </div>
                  {stats.uploading > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-text-secondary">Uploading:</span>
                      <span className="text-accent-mint font-semibold">{stats.uploading}</span>
                    </div>
                  )}
                  {stats.completed > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-text-secondary">Completed:</span>
                      <span className="text-green-500 font-semibold">{stats.completed}</span>
                    </div>
                  )}
                  {stats.failed > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-text-secondary">Failed:</span>
                      <span className="text-red-500 font-semibold">{stats.failed}</span>
                    </div>
                  )}
                </div>

                {/* File list */}
                <div className="space-y-3">
                  {uploadProgress.map((item, index) => (
                    <div key={index} className="bg-slate-800/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {item.status === 'uploading' && (
                            <Loader2 size={18} className="text-accent-mint animate-spin" />
                          )}
                          {item.status === 'completed' && (
                            <CheckCircle size={18} className="text-green-500" />
                          )}
                          {item.status === 'failed' && (
                            <XCircle size={18} className="text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-text-primary font-medium truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className={`text-xs ml-2 ${
                              item.status === 'completed' ? 'text-green-500' :
                              item.status === 'failed' ? 'text-red-500' :
                              'text-accent-mint'
                            }`}>
                              {item.status === 'completed' ? 'Complete' :
                               item.status === 'failed' ? 'Failed' :
                               'Uploading...'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          {item.status !== 'failed' && (
                            <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  item.status === 'completed' ? 'bg-green-500' : 'bg-accent-mint'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          )}

                          {/* Error message */}
                          {item.status === 'failed' && item.error && (
                            <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-300 flex items-start gap-2">
                              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                              <span>{item.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </ModalContent>
        <ModalFooter>
          {!uploading && (
            <Button variant="primary" size="sm" onClick={handleCloseUploadModal}>
              Close
            </Button>
          )}
          {uploading && (
            <div className="text-sm text-text-secondary flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Upload in progress...
            </div>
          )}
        </ModalFooter>
      </Modal>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({getFilterCount('all')})
        </Button>
        <Button
          variant={filter === 'images' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('images')}
        >
          Images ({getFilterCount('images')})
        </Button>
        <Button
          variant={filter === 'videos' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('videos')}
        >
          Videos ({getFilterCount('videos')})
        </Button>
        <Button
          variant={filter === 'audio' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('audio')}
        >
          Audio ({getFilterCount('audio')})
        </Button>
        <Button
          variant={filter === 'documents' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('documents')}
        >
          Documents ({getFilterCount('documents')})
        </Button>
      </div>

      {/* Files grid */}
      {filteredFiles.length === 0 ? (
        <div
          onClick={handleUploadButtonClick}
          className="flex flex-col items-center justify-center min-h-96 bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-xl cursor-pointer hover:border-accent-mint/50 transition-colors group"
        >
          <Upload className="text-slate-600 mb-4 group-hover:text-accent-mint transition-colors" size={48} />
          <p className="text-slate-400 text-lg group-hover:text-slate-300 transition-colors">No files found</p>
          <p className="text-slate-500 text-sm">Click or drag files here to upload</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => (
            <FileCard key={file.id} file={file} onDelete={handleDeleteFile} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Files;
