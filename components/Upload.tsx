import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router';
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants';

interface UploadProps {
  onComplete?: (base64Data: string) => void;
  onError?: (error: DOMException) => void;
}

const Upload = ({ onComplete, onError }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const processFile = (fileToProcess: File) => {
    if (!isSignedIn) return;

    setFile(fileToProcess);
    setProgress(0);

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64String = e.target?.result as string;

      // Simulate progress increment
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + PROGRESS_STEP;

          if (newProgress >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // Call onComplete after delay
            timeoutRef.current = setTimeout(() => {
              onComplete?.(base64String);
            }, REDIRECT_DELAY_MS);

            return 100;
          }

          return newProgress;
        });
      }, PROGRESS_INTERVAL_MS);
    };

    reader.onerror = () => {
      // Clear progress interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Clear pending completion timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Set visible error state
      setProgress(0);
      const errorMessage = reader.error?.message || 'Failed to read file';
      setError(errorMessage);

      // Log the error
      console.error('FileReader error:', reader.error);

      // Invoke onError callback if provided
      if (onError && reader.error) {
        onError(reader.error);
      }
    };

    reader.readAsDataURL(fileToProcess);
  };

  const validateFile = (file: File): { isValid: boolean; errorMessage?: string } => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
    const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;

    // Check file size
    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        errorMessage: 'File size exceeds 10 MB limit. Please choose a smaller file.',
      };
    }

    // Check file type by MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      // Fallback: check by file extension
      if (!ALLOWED_EXTENSIONS.test(file.name)) {
        return {
          isValid: false,
          errorMessage: 'Only .jpg, .jpeg, and .png files are allowed.',
        };
      }
    }

    return { isValid: true };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && isSignedIn) {
      const validation = validateFile(files[0]);
      if (!validation.isValid) {
        setError(validation.errorMessage || 'Invalid file');
        console.warn('File validation failed:', validation.errorMessage);
        return;
      }
      // Clear any previous error on successful validation
      setError(null);
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isSignedIn) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validation = validateFile(files[0]);
      if (!validation.isValid) {
        setError(validation.errorMessage || 'Invalid file');
        console.warn('File validation failed:', validation.errorMessage);
        return;
      }
      // Clear any previous error on successful validation
      setError(null);
      processFile(files[0]);
    }
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg, .jpeg, .png"
            disabled={!isSignedIn}
            onChange={handleChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? "Drag and drop your floor plan here, or click to select a file."
                : "Please sign in to upload your floor plan."}
            </p>
            <p className="help">Maximum file size is 10 MB.</p>
            {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />

              <p className="status-text">
                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload