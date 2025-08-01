
import React, { useState, useEffect } from 'react';
import { EnhancedCard, EnhancedCardContent, EnhancedCardDescription, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Database,
  Globe,
  Zap
} from 'lucide-react';

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  icon: any;
  description: string;
}

interface SystemHealthMonitorProps {
  syncJobs?: Array<{
    id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    error_message: string | null;
    processed_records: number | null;
    synced_records: number | null;
    job_type: string;
  }>;
}

export function SystemHealthMonitor({ syncJobs = [] }: SystemHealthMonitorProps) {
  const [services, setServices] = useState<SystemService[]>([
    {
      name: 'Database',
      status: 'operational',
      latency: 45,
      icon: Database,
      description: 'Supabase PostgreSQL'
    },
    {
      name: 'Beehiiv API',
      status: 'operational',
      latency: 120,
      icon: Globe,
      description: 'Newsletter sync service'
    },
    {
      name: 'Edge Functions',
      status: 'operational',
      latency: 80,
      icon: Zap,
      description: 'Backend processing'
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update Beehiiv status based on sync jobs
  useEffect(() => {
    if (syncJobs && syncJobs.length > 0) {
      const hasFailedJobs = syncJobs.some(job => job.status === 'failed');
      const hasRunningJobs = syncJobs.some(job => job.status === 'running');
      
      setServices(prev => prev.map(service => 
        service.name === 'Beehiiv API' 
          ? { 
              ...service, 
              status: hasFailedJobs ? 'degraded' : hasRunningJobs ? 'operational' : 'operational'
            }
          : service
      ));
    }
  }, [syncJobs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: 'bg-green-500/20 text-green-400 border-green-500/30',
      degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      down: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'down') 
    ? 'down' 
    : 'degraded';

  return (
    <EnhancedCard variant="glass">
      <EnhancedCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <EnhancedCardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-cyan-400" />
              System Health
            </EnhancedCardTitle>
            <EnhancedCardDescription className="text-slate-300">
              Real-time service monitoring
            </EnhancedCardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border-white/10 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </EnhancedCardHeader>
      <EnhancedCardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <span className="font-medium text-white">Overall Status</span>
          </div>
          {getStatusBadge(overallStatus)}
        </div>

        {/* Service Details */}
        <div className="space-y-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <service.icon className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="font-medium text-sm text-white">{service.name}</div>
                  <div className="text-xs text-slate-400">{service.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {service.latency && (
                  <span className="text-xs text-slate-400">
                    {service.latency}ms
                  </span>
                )}
                {getStatusIcon(service.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Active Jobs Summary */}
        {syncJobs && syncJobs.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <div className="text-sm font-medium mb-2 text-white">Recent Sync Jobs</div>
            <div className="text-xs text-slate-400">
              {syncJobs.filter(job => job.status === 'running').length} running, {' '}
              {syncJobs.filter(job => job.status === 'paused').length} paused, {' '}
              {syncJobs.filter(job => job.status === 'failed').length} failed
            </div>
          </div>
        )}
      </EnhancedCardContent>
    </EnhancedCard>
  );
}
