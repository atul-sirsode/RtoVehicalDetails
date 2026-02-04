import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingStatusProps {
  total: number;
  processed: number;
  failed: number;
  isProcessing: boolean;
}

export function ProcessingStatus({ total, processed, failed, isProcessing }: ProcessingStatusProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const successful = processed - failed;

  return (
    <AnimatePresence>
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-5 h-5 text-primary" />
                </motion.div>
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success" />
              )}
              <span className="font-medium text-foreground">
                {isProcessing ? 'Verifying RC Numbers...' : 'Verification Complete'}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {processed} / {total}
            </span>
          </div>

          <Progress value={percentage} className="h-2" />

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">{successful} successful</span>
            </div>
            {failed > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-muted-foreground">{failed} failed</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
