import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { parseFile, ParseResult } from '@/lib/file-parser';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileProcessed: (result: ParseResult) => void;
  isProcessing?: boolean;
}

export function FileUpload({ onFileProcessed, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    const result = await parseFile(file);
    
    if (!result.success) {
      setError(result.error || 'Failed to parse file');
      setUploadedFile(null);
      return;
    }

    setUploadedFile(result);
    onFileProcessed(result);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
              error && 'border-destructive bg-destructive/5'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <motion.div
                animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center',
                  isDragging ? 'gradient-primary' : 'bg-secondary'
                )}
              >
                {error ? (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                ) : (
                  <Upload className={cn('w-8 h-8', isDragging ? 'text-primary-foreground' : 'text-muted-foreground')} />
                )}
              </motion.div>
              
              <div>
                <p className="text-lg font-medium text-foreground">
                  {isDragging ? 'Drop your file here' : 'Upload CSV or Excel file'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop or click to browse
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Supports .csv, .xlsx, .xls files</span>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive font-medium"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border rounded-xl p-6"
          >
            <button
              onClick={clearFile}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {uploadedFile.fileName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadedFile.rcNumbers.length} RC numbers found out of {uploadedFile.totalRows} rows
                </p>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  Processing...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
