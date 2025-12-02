import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseFile } from '../utils/fileParser';
import { ExtractionResult } from '../types/resume';

interface FileUploadProps {
  onFileUpload: (result: ExtractionResult) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await parseFile(file);
      onFileUpload(result);
      setUploadedFile(file.name);
    } catch (error: any) {
      console.error('Error parsing file:', error);
      setUploadError(error.message || 'Failed to parse file. Please try again or use a different file.');
      setUploadedFile(null);
      onFileUpload({ text: '', extraction_mode: 'TEXT', trimmed: false });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    setUploadError(null);
    await processFile(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    onFileUpload({ text: '', extraction_mode: 'TEXT', trimmed: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTryAgain = () => {
    clearFile();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isUploading
            ? 'border-emerald-400 bg-emerald-500/5'
            : uploadError
            ? 'border-red-400 bg-red-500/5'
            : uploadedFile
            ? 'border-emerald-400 bg-emerald-500/5'
            : isDragging
            ? 'border-cyan-400 bg-cyan-500/5'
            : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50 hover:bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-base font-medium text-slate-200 mb-1">Processing your file...</p>
            <p className="text-sm text-slate-400">Please wait while we extract the content</p>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-base font-medium text-red-300 mb-1">Upload Failed</p>
            <p className="text-sm text-red-400/80 mb-4 max-w-sm">{uploadError}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTryAgain();
              }}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-emerald-500/10"
            >
              <span>Try again</span>
            </button>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 shadow-emerald-glow">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-medium text-emerald-300 mb-1">File uploaded successfully!</p>
            <p className="text-sm text-slate-400 mb-4 truncate max-w-xs">{uploadedFile}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              <span>Remove file</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
              isDragging ? 'bg-cyan-500/20' : 'bg-slate-700/50'
            }`}>
              <Upload className={`w-7 h-7 transition-colors ${
                isDragging ? 'text-cyan-400' : 'text-slate-400'
              }`} />
            </div>
            <p className="text-base font-medium text-slate-200 mb-1">
              {isDragging ? 'Drop your file here' : 'Upload your resume'}
            </p>
            <p className="text-sm text-slate-400 mb-3">
              Drag and drop your file here, or click to browse
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileText className="w-4 h-4" />
              <span>Supports PDF, DOCX, and TXT files</span>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Supported File Formats Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-slate-200 mb-3">Supported file formats:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>PDF files (.pdf)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Word documents (.docx)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span>Text files (.txt)</span>
              </div>
            </div>
            <p className="text-slate-500 mt-3 text-xs">
              Maximum file size: 10MB. For best results, ensure your resume is well-formatted and readable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
