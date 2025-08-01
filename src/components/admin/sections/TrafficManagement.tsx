
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Users, 
  Server, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Globe,
  Database,
  Zap,
  Timer,
  UserCheck,
  Lock
} from 'lucide-react';

export function TrafficManagement() {
  const [trafficControls, setTrafficControls] = useState({
    enableRegistration: true,
    enableRateLimiting: true,
    maintenanceMode: false,
    emergencyMode: false,
    maxConcurrentUsers: 10000,
    rateLimitPerMinute: 100
  });

  const [currentMetrics] = useState({
    activeUsers: 847,
    requestsPerMinute: 2341,
    serverLoad: 65,
    databaseConnections: 23,
    responseTime: 125,
    errorRate: 0.2
  });

  const [alerts] = useState([
    { id: 1, type: 'warning', message: 'Server load above 60%', timestamp: '2 minutes ago' },
    { id: 2, type: 'info', message: 'Traffic spike detected from social media', timestamp: '5 minutes ago' }
  ]);

  const handleEmergencyMode = () => {
    setTrafficControls(prev => ({
      ...prev,
      emergencyMode: !prev.emergencyMode,
      enableRegistration: false,
      rateLimitPerMinute: 20
    }));
  };

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Traffic Management</h1>
          <p className="text-slate-400">Monitor and control site traffic for optimal performance</p>
        </div>
        <Button 
          onClick={handleEmergencyMode}
          variant={trafficControls.emergencyMode ? "destructive" : "outline"}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          {trafficControls.emergencyMode ? "Exit Emergency Mode" : "Emergency Mode"}
        </Button>
      </div>

      {trafficControls.emergencyMode && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            Emergency mode is active. New registrations are disabled and rate limiting is strict.
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{currentMetrics.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Requests/Min</p>
                <p className="text-2xl font-bold text-white">{currentMetrics.requestsPerMinute.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Server Load</p>
                <p className="text-2xl font-bold text-white">{currentMetrics.serverLoad}%</p>
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
                <p className="text-2xl font-bold text-white">{currentMetrics.databaseConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-sm text-slate-400">Response Time</p>
                <p className="text-2xl font-bold text-white">{currentMetrics.responseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-sm text-slate-400">Error Rate</p>
                <p className="text-2xl font-bold text-white">{currentMetrics.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Access Controls
            </CardTitle>
            <CardDescription>Manage user access and registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-reg" className="text-slate-200">Enable New Registrations</Label>
              <Switch
                id="enable-reg"
                checked={trafficControls.enableRegistration}
                onCheckedChange={(checked) => setTrafficControls({...trafficControls, enableRegistration: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance" className="text-slate-200">Maintenance Mode</Label>
              <Switch
                id="maintenance"
                checked={trafficControls.maintenanceMode}
                onCheckedChange={(checked) => setTrafficControls({...trafficControls, maintenanceMode: checked})}
              />
            </div>

            <div>
              <Label htmlFor="max-users" className="text-slate-200">Max Concurrent Users</Label>
              <Input
                id="max-users"
                type="number"
                value={trafficControls.maxConcurrentUsers}
                onChange={(e) => setTrafficControls({...trafficControls, maxConcurrentUsers: parseInt(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="pt-4">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Current Users</span>
                <span>{currentMetrics.activeUsers} / {trafficControls.maxConcurrentUsers}</span>
              </div>
              <Progress 
                value={(currentMetrics.activeUsers / trafficControls.maxConcurrentUsers) * 100} 
                className="bg-slate-700"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
            <CardDescription>Control request rates and traffic spikes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-limit" className="text-slate-200">Enable Rate Limiting</Label>
              <Switch
                id="enable-limit"
                checked={trafficControls.enableRateLimiting}
                onCheckedChange={(checked) => setTrafficControls({...trafficControls, enableRateLimiting: checked})}
              />
            </div>

            <div>
              <Label htmlFor="rate-limit" className="text-slate-200">Requests per Minute (per IP)</Label>
              <Input
                id="rate-limit"
                type="number"
                value={trafficControls.rateLimitPerMinute}
                onChange={(e) => setTrafficControls({...trafficControls, rateLimitPerMinute: parseInt(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button variant="outline" size="sm">
                <UserCheck className="h-4 w-4 mr-2" />
                Whitelist IP
              </Button>
              <Button variant="outline" size="sm">
                <Lock className="h-4 w-4 mr-2" />
                Block IP Range
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Monitoring */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Performance Monitoring
          </CardTitle>
          <CardDescription>Real-time system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Server Load</span>
                <span>{currentMetrics.serverLoad}%</span>
              </div>
              <Progress 
                value={currentMetrics.serverLoad} 
                className="bg-slate-700"
              />
              <Badge variant={currentMetrics.serverLoad > 80 ? "destructive" : currentMetrics.serverLoad > 60 ? "secondary" : "default"} className="mt-2">
                {currentMetrics.serverLoad > 80 ? "Critical" : currentMetrics.serverLoad > 60 ? "Warning" : "Normal"}
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Response Time</span>
                <span>{currentMetrics.responseTime}ms</span>
              </div>
              <Progress 
                value={(currentMetrics.responseTime / 500) * 100} 
                className="bg-slate-700"
              />
              <Badge variant={currentMetrics.responseTime > 300 ? "destructive" : currentMetrics.responseTime > 150 ? "secondary" : "default"} className="mt-2">
                {currentMetrics.responseTime > 300 ? "Slow" : currentMetrics.responseTime > 150 ? "Fair" : "Fast"}
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Error Rate</span>
                <span>{currentMetrics.errorRate}%</span>
              </div>
              <Progress 
                value={currentMetrics.errorRate * 10} 
                className="bg-slate-700"
              />
              <Badge variant={currentMetrics.errorRate > 1 ? "destructive" : currentMetrics.errorRate > 0.5 ? "secondary" : "default"} className="mt-2">
                {currentMetrics.errorRate > 1 ? "High" : currentMetrics.errorRate > 0.5 ? "Elevated" : "Low"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`border ${alert.type === 'warning' ? 'border-yellow-700 bg-yellow-900/20' : 'border-blue-700 bg-blue-900/20'}`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span className={alert.type === 'warning' ? 'text-yellow-300' : 'text-blue-300'}>
                    {alert.message}
                  </span>
                  <span className="text-slate-400 text-sm">{alert.timestamp}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
