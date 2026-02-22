import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState, useRef } from 'react'
import { useOutletContext } from 'react-router';
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants';

interface UploadProps {
  onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

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
            setTimeout(() => {
              onComplete?.(base64String);
            }, REDIRECT_DELAY_MS);

            return 100;
          }

          return newProgress;
        });
      }, PROGRESS_INTERVAL_MS);
    };

    reader.readAsDataURL(fileToProcess);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && isSignedIn) {
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