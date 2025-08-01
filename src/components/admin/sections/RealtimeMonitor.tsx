
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Activity, Users, Database, Globe, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useSystemMetrics } from '@/hooks/admin-operations/useSystemMetrics';

export function RealtimeMonitor() {
  const { data: metrics, isLoading, error } = useSystemMetrics();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading system metrics...</div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400">Failed to load system metrics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Real-time System Monitor</h1>
          <p className="text-slate-400">Live monitoring for enterprise-scale operations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-blue-400">{metrics.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Requests/sec</p>
                <p className="text-2xl font-bold text-green-400">{metrics.requestsPerMinute}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">DB Connections</p>
                <p className="text-2xl font-bold text-purple-400">{metrics.databaseConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Response Time</p>
                <p className="text-2xl font-bold text-orange-400">{metrics.responseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Monitor className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Server Load</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500"
                    style={{ width: `${metrics.serverLoad}%` }}
                  />
                </div>
                <Badge variant={metrics.serverLoad > 80 ? "destructive" : "default"}>
                  {metrics.serverLoad}%
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Error Rate</span>
              <Badge variant={metrics.errorRate > 0.05 ? "destructive" : "default"}>
                {(metrics.errorRate * 100).toFixed(2)}%
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Uptime</span>
              <Badge variant="default" className="bg-green-500/20 text-green-400">
                {metrics.uptime}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-400">All Systems Operational</p>
                <p className="text-xs text-slate-400">Ready for high traffic load</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Globe className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-400">CDN Optimized</p>
                <p className="text-xs text-slate-400">Global edge locations active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
