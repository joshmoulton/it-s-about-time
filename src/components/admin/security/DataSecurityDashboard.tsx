import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getDataAccessLogs,
  getIPAllowlist,
  getAuthorizedDevices,
  getDataAccessQuotas,
  generateDeviceFingerprint,
  getCurrentIP,
  type DataAccessLog,
  type IPAllowlistEntry,
  type DeviceAuth,
  type DataAccessQuota
} from '@/utils/securityUtils';
import { IPAllowlistManager } from './IPAllowlistManager';
import { DeviceAuthManager } from './DeviceAuthManager';
import { DataAccessQuotaManager } from './DataAccessQuotaManager';
import { AccessLogsViewer } from './AccessLogsViewer';

interface SecurityMetrics {
  totalAccessAttempts: number;
  blockedAttempts: number;
  authorizedDevices: number;
  allowlistedIPs: number;
  riskScore: number;
}

export const DataSecurityDashboard: React.FC = () => {
  const [logs, setLogs] = useState<DataAccessLog[]>([]);
  const [ipAllowlist, setIPAllowlist] = useState<IPAllowlistEntry[]>([]);
  const [devices, setDevices] = useState<DeviceAuth[]>([]);
  const [quotas, setQuotas] = useState<DataAccessQuota[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAccessAttempts: 0,
    blockedAttempts: 0,
    authorizedDevices: 0,
    allowlistedIPs: 0,
    riskScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentDeviceFingerprint, setCurrentDeviceFingerprint] = useState<string>('');
  const [currentIP, setCurrentIP] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
    setCurrentDeviceFingerprint(generateDeviceFingerprint());
    getCurrentIP().then(ip => ip && setCurrentIP(ip));
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [logsData, ipData, devicesData, quotasData] = await Promise.all([
        getDataAccessLogs(),
        getIPAllowlist(),
        getAuthorizedDevices(),
        getDataAccessQuotas()
      ]);
      
      setLogs(logsData);
      setIPAllowlist(ipData);
      setDevices(devicesData);
      setQuotas(quotasData);
      
      // Calculate security metrics
      const totalAttempts = logsData.length;
      const blocked = logsData.filter(log => !log.access_granted).length;
      const avgRisk = logsData.length > 0 
        ? logsData.reduce((sum, log) => sum + log.risk_score, 0) / logsData.length 
        : 0;
      
      setMetrics({
        totalAccessAttempts: totalAttempts,
        blockedAttempts: blocked,
        authorizedDevices: devicesData.filter(d => d.is_trusted).length,
        allowlistedIPs: ipData.filter(ip => ip.is_active).length,
        riskScore: avgRisk
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number): { level: string; color: string; icon: React.ReactNode } => {
    if (score < 2) return { 
      level: 'Low', 
      color: 'bg-success', 
      icon: <CheckCircle className="h-4 w-4" /> 
    };
    if (score < 5) return { 
      level: 'Medium', 
      color: 'bg-warning', 
      icon: <AlertTriangle className="h-4 w-4" /> 
    };
    return { 
      level: 'High', 
      color: 'bg-destructive', 
      icon: <XCircle className="h-4 w-4" /> 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const riskInfo = getRiskLevel(metrics.riskScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Data Security Dashboard</h1>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Access Attempts</p>
                <p className="text-2xl font-bold">{metrics.totalAccessAttempts}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Attempts</p>
                <p className="text-2xl font-bold text-destructive">{metrics.blockedAttempts}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Authorized Devices</p>
                <p className="text-2xl font-bold">{metrics.authorizedDevices}</p>
              </div>
              <Shield className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Allowlisted IPs</p>
                <p className="text-2xl font-bold">{metrics.allowlistedIPs}</p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={riskInfo.color}>
                    {riskInfo.icon}
                    {riskInfo.level}
                  </Badge>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Session Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Current Session:</strong> Device ID: {currentDeviceFingerprint.substring(0, 8)}... | 
          IP: {currentIP || 'Unknown'} | 
          Status: {ipAllowlist.some(ip => ip.ip_address === currentIP && ip.is_active) ? 'Allowlisted' : 'Standard'}
        </AlertDescription>
      </Alert>

      {/* Security Management Tabs */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
          <TabsTrigger value="ip-allowlist">IP Allowlist</TabsTrigger>
          <TabsTrigger value="devices">Device Authorization</TabsTrigger>
          <TabsTrigger value="quotas">Access Quotas</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Access Logs</CardTitle>
              <CardDescription>
                Monitor all data access attempts and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessLogsViewer logs={logs} onRefresh={loadSecurityData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip-allowlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP Address Allowlist</CardTitle>
              <CardDescription>
                Manage IP addresses that are allowed to access sensitive data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IPAllowlistManager 
                allowlist={ipAllowlist} 
                onUpdate={loadSecurityData}
                currentIP={currentIP}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Authorization</CardTitle>
              <CardDescription>
                Manage trusted devices for accessing sensitive data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceAuthManager 
                devices={devices} 
                onUpdate={loadSecurityData}
                currentDeviceFingerprint={currentDeviceFingerprint}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Access Quotas</CardTitle>
              <CardDescription>
                Set limits on data access to prevent abuse and ensure compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataAccessQuotaManager 
                quotas={quotas} 
                onUpdate={loadSecurityData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};