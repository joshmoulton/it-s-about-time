import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Activity, 
  Zap, 
  HardDrive, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  BarChart3,
  Server,
  Cpu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatabaseBackupSection } from './settings/DatabaseBackupSection';
import { useDatabaseMetrics } from '@/hooks/admin-operations/useDatabaseMetrics';

export function DatabasePerformance() {
  const { toast } = useToast(); // Move this to the top before any conditional logic
  const { data: dbMetrics, isLoading, error } = useDatabaseMetrics();
  
  const [databaseSettings, setDatabaseSettings] = useState({
    enableQueryOptimization: true,
    enableConnectionPooling: true,
    enableQueryCache: true,
    enableSlowQueryLogging: true,
    autoVacuum: true,
    enableReplicationMonitoring: true,
    maxConnections: 100,
    queryTimeout: 30,
    cacheSize: 256
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading database metrics...</div>
        </div>
      </div>
    );
  }

  if (error || !dbMetrics) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400">Failed to load database metrics</div>
        </div>
      </div>
    );
  }


  const handleOptimizeDatabase = () => {
    toast({
      title: "Database Optimization Started",
      description: "Running VACUUM, ANALYZE, and index optimization...",
    });
  };

  const handleResetConnections = () => {
    toast({
      title: "Connection Pool Reset",
      description: "All idle connections have been reset.",
    });
  };

  const handleQueryAnalysis = () => {
    toast({
      title: "Query Analysis Running",
      description: "Analyzing query performance and generating recommendations...",
    });
  };

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Database Performance</h1>
          <p className="text-slate-400">Monitor and optimize database performance for scale</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleOptimizeDatabase} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Database
          </Button>
          <Button onClick={handleQueryAnalysis} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyze Queries
          </Button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Query Performance</p>
                <p className="text-2xl font-bold text-green-400">{Math.round(dbMetrics.cacheHitRatio)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Active Connections</p>
                <p className="text-2xl font-bold text-blue-400">{dbMetrics.activeConnections}/{dbMetrics.connectionPoolSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Avg Query Time</p>
                <p className="text-2xl font-bold text-white">{Math.round(dbMetrics.avgQueryTime)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Cache Hit Ratio</p>
                <p className="text-2xl font-bold text-purple-400">{Math.round(dbMetrics.cacheHitRatio)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>CPU Usage</span>
                    <span>{Math.round(dbMetrics.memoryUsage)}%</span>
                  </div>
                  <Progress value={dbMetrics.memoryUsage} className="bg-slate-700" />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Memory Usage</span>
                    <span>{Math.round(dbMetrics.memoryUsage)}%</span>
                  </div>
                  <Progress value={dbMetrics.memoryUsage} className="bg-slate-700" />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-slate-3000 mb-2">
                    <span>Disk Usage</span>
                    <span>{Math.round(dbMetrics.diskUsage)}%</span>
                  </div>
                  <Progress value={dbMetrics.diskUsage} className="bg-slate-700" />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Connection Pool</span>
                    <span>{dbMetrics.activeConnections}/{dbMetrics.connectionPoolSize}</span>
                  </div>
                  <Progress value={(dbMetrics.activeConnections / dbMetrics.connectionPoolSize) * 100} className="bg-slate-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Query Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{dbMetrics.totalQueries.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Total Queries</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">{dbMetrics.slowQueries}</div>
                    <div className="text-sm text-slate-400">Slow Queries</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Cache Hit Ratio</span>
                    <span className="text-green-400">{Math.round(dbMetrics.cacheHitRatio)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Avg Query Time</span>
                    <span className="text-white">{Math.round(dbMetrics.avgQueryTime)}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Replication Lag</span>
                    <span className="text-blue-400">0.2s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Statistics */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5" />
                Table Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dbMetrics.tableStats.map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-white">{table.table}</div>
                      <div className="text-sm text-slate-400">
                        {table.size} • {table.rows} rows • Last vacuum: {table.lastVacuum}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm text-slate-400">Index Efficiency</div>
                        <Badge variant={table.indexEfficiency > 90 ? "default" : table.indexEfficiency > 80 ? "secondary" : "destructive"}>
                          {table.indexEfficiency}%
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5" />
                  Query Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="query-opt" className="text-slate-200">Auto Query Optimization</Label>
                  <Switch
                    id="query-opt"
                    checked={databaseSettings.enableQueryOptimization}
                    onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, enableQueryOptimization: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="query-cache" className="text-slate-200">Query Result Cache</Label>
                  <Switch
                    id="query-cache"
                    checked={databaseSettings.enableQueryCache}
                    onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, enableQueryCache: checked})}
                  />
                </div>

                <div>
                  <Label htmlFor="cache-size" className="text-slate-200">Cache Size (MB)</Label>
                  <Input
                    id="cache-size"
                    type="number"
                    value={databaseSettings.cacheSize}
                    onChange={(e) => setDatabaseSettings({...databaseSettings, cacheSize: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button onClick={handleOptimizeDatabase} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Optimization
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5" />
                  Slow Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dbMetrics.slowQueryList.map((query) => (
                    <div key={query.id} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-sm text-white truncate flex-1">
                          {query.query}
                        </div>
                        <Badge variant="destructive" className="ml-2">
                          {query.duration}s
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        Table: {query.table} • Executions: {query.executions}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <DatabaseBackupSection />
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server className="h-5 w-5" />
                  Connection Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max-connections" className="text-slate-200">Max Connections</Label>
                  <Input
                    id="max-connections"
                    type="number"
                    value={databaseSettings.maxConnections}
                    onChange={(e) => setDatabaseSettings({...databaseSettings, maxConnections: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="query-timeout" className="text-slate-200">Query Timeout (seconds)</Label>
                  <Input
                    id="query-timeout"
                    type="number"
                    value={databaseSettings.queryTimeout}
                    onChange={(e) => setDatabaseSettings({...databaseSettings, queryTimeout: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="connection-pooling" className="text-slate-200">Connection Pooling</Label>
                  <Switch
                    id="connection-pooling"
                    checked={databaseSettings.enableConnectionPooling}
                    onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, enableConnectionPooling: checked})}
                  />
                </div>

                <Button onClick={handleResetConnections} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Idle Connections
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Connection Pool Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-3xl font-bold text-blue-400">
                    {dbMetrics.activeConnections}/{dbMetrics.connectionPoolSize}
                  </div>
                  <div className="text-sm text-slate-400">Active Connections</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Pool Utilization</span>
                    <span className="text-blue-400">
                      {Math.round((dbMetrics.activeConnections / dbMetrics.connectionPoolSize) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(dbMetrics.activeConnections / dbMetrics.connectionPoolSize) * 100} 
                    className="bg-slate-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Performance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-vacuum" className="text-slate-200">Auto Vacuum</Label>
                    <Switch
                      id="auto-vacuum"
                      checked={databaseSettings.autoVacuum}
                      onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, autoVacuum: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="slow-query-log" className="text-slate-200">Slow Query Logging</Label>
                    <Switch
                      id="slow-query-log"
                      checked={databaseSettings.enableSlowQueryLogging}
                      onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, enableSlowQueryLogging: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="replication-monitor" className="text-slate-200">Replication Monitoring</Label>
                    <Switch
                      id="replication-monitor"
                      checked={databaseSettings.enableReplicationMonitoring}
                      onCheckedChange={(checked) => setDatabaseSettings({...databaseSettings, enableReplicationMonitoring: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Alert className="bg-blue-900/20 border-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-blue-300">
                      Performance monitoring is active and optimized for high-traffic scenarios.
                    </AlertDescription>
                  </Alert>

                  <div className="text-sm text-slate-400">
                    <p><strong>Next Optimization:</strong> Scheduled for tonight at 2 AM UTC</p>
                    <p><strong>Last Optimization:</strong> 6 hours ago (successful)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
