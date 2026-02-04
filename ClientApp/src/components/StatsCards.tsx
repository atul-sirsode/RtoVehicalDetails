import { motion } from 'framer-motion';
import { Truck, BarChart3, Shield, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { RCTableRow } from '@/types/rc-verification';

interface StatsCardsProps {
  data: RCTableRow[];
}

export function StatsCards({ data }: StatsCardsProps) {
  const stats = {
    total: data.length,
    verified: data.filter(r => r.status === 'success').length,
    pending: data.filter(r => r.status === 'pending').length,
    processing: data.filter(r => r.status === 'processing').length,
    failed: data.filter(r => r.status === 'error').length,
    active: data.filter(r => r.rc_status === 'ACTIVE').length,
    financed: data.filter(r => r.financed).length,
  };

  const cards = [
    {
      title: 'Total Records',
      value: stats.total,
      icon: FileSpreadsheet,
      gradient: 'gradient-primary',
      delay: 0,
    },
    {
      title: 'Verified',
      value: stats.verified,
      icon: CheckCircle2,
      gradient: 'gradient-success',
      delay: 0.1,
    },
    {
      title: 'Pending',
      value: stats.pending + stats.processing,
      icon: Clock,
      gradient: 'bg-warning',
      delay: 0.2,
    },
    {
      title: 'Active RCs',
      value: stats.active,
      icon: Truck,
      gradient: 'bg-info',
      delay: 0.3,
    },
    {
      title: 'Financed',
      value: stats.financed,
      icon: BarChart3,
      gradient: 'bg-primary',
      delay: 0.4,
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: AlertTriangle,
      gradient: 'bg-destructive',
      delay: 0.5,
    },
  ];

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
          className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${card.gradient} flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
        </motion.div>
      ))}
    </div>
  );
}
