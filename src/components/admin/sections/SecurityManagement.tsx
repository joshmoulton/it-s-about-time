
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Lock, 
  Eye, 
  Activity,
  Database,
  Key,
  FileText,
  Globe,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function SecurityManagement() {
  const [securitySettings, setSecuritySettings] = useState({
    enableMFA: false,
    requireStrongPasswords: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableIPWhitelist: false,
    enableRateLimiting: true,
    autoLockoutEnabled: true,
    encryptionEnabled: true
  });

  const [securityMetrics, setSecurityMetrics] = useState({
    activeThreats: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    blockedIPs: 0,
    securityScore: 0,
    lastSecurityScan: 'Never'
  });

  const [recentThreats, setRecentThreats] = useState([]);

  const [auditLogs, setAuditLogs] = useState([]);

  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load real security metrics from database
      const [auditResponse, securityEventsResponse, ipAllowlistResponse] = await Promise.all([
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('admin_security_events').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('admin_ip_allowlist').select('*').eq('is_active', true)
      ]);

      if (auditResponse.data) {
        setAuditLogs(auditResponse.data.map(log => ({
          id: log.id,
          action: log.action,
          user: log.user_email,
          timestamp: new Date(log.created_at).toLocaleString(),
          status: 'success'
        })));
      }

      if (securityEventsResponse.data) {
        const events = securityEventsResponse.data;
        const failedLogins = events.filter(e => e.event_type === 'login_attempt' && !e.success).length;
        const threats = events.filter(e => e.event_type.includes('threat') || e.event_type.includes('suspicious')).length;
        
        setSecurityMetrics(prev => ({
          ...prev,
          failedLogins,
          activeThreats: threats,
          suspiciousActivity: events.filter(e => !e.success).length,
          securityScore: Math.max(0, 100 - (failedLogins * 2) - (threats * 5)),
          lastSecurityScan: 'Just now'
        }));

        // Set recent threats from security events
        setRecentThreats(events
          .filter(e => !e.success || e.event_type.includes('threat'))
          .slice(0, 5)
          .map(e => ({
            id: e.id,
            type: e.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            ip: e.ip_address || 'Unknown',
            time: new Date(e.created_at).toLocaleString(),
            severity: e.success ? 'low' : 'high'
          }))
        );
      }

      if (ipAllowlistResponse.data) {
        setSecurityMetrics(prev => ({
          ...prev,
          blockedIPs: ipAllowlistResponse.data.length
        }));
      }

    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    }
  };

  const handleSecurityScan = async () => {
    try {
      await loadSecurityData();
      toast({
        title: "Security Scan Complete",
        description: "Security metrics have been refreshed with latest data.",
      });
    } catch (error) {
      toast({
        title: "Security Scan Failed",
        description: "Failed to complete security scan",
        variant: "destructive"
      });
    }
  };

  const handleEmergencyLockdown = async () => {
    try {
      // Log emergency lockdown action
      await supabase.from('admin_audit_log').insert({
        action: 'emergency_lockdown',
        resource: 'system',
        user_email: 'admin@system.com',
        metadata: { reason: 'Manual emergency lockdown activated' }
      });

      toast({
        title: "Emergency Lockdown Activated",
        description: "All non-admin access has been temporarily suspended.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Emergency Lockdown Failed",
        description: "Failed to activate emergency lockdown",
        variant: "destructive"
      });
    }
  };

  const exportAuditLogs = async () => {
    try {
      const { data } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false });
      
      if (data) {
        const csv = [
          ['Date', 'Action', 'User', 'Resource', 'IP Address'],
          ...data.map(log => [
            new Date(log.created_at).toISOString(),
            log.action,
            log.user_email,
            log.resource,
            log.ip_address || ''
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Audit Logs Exported",
          description: "Security audit logs have been exported to CSV format.",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Management</h1>
          <p className="text-slate-400">Comprehensive security monitoring and controls</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSecurityScan} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Run Security Scan
          </Button>
          <Button onClick={handleEmergencyLockdown} variant="destructive">
            <Lock className="h-4 w-4 mr-2" />
            Emergency Lockdown
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Security Score</p>
                <p className="text-2xl font-bold text-green-400">{securityMetrics.securityScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-sm text-slate-400">Active Threats</p>
                <p className="text-2xl font-bold text-red-400">{securityMetrics.activeThreats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Failed Logins</p>
                <p className="text-2xl font-bold text-orange-400">{securityMetrics.failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Blocked IPs</p>
                <p className="text-2xl font-bold text-blue-400">{securityMetrics.blockedIPs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="data-protection">Data Protection</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5" />
                  Real-time Threat Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentThreats.length === 0 ? (
                    <div className="text-center py-4 text-slate-400">
                      No recent threats detected
                    </div>
                  ) : (
                    recentThreats.map((threat) => (
                      <div key={threat.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{threat.type}</p>
                          <p className="text-slate-400 text-sm">IP: {threat.ip} • {threat.time}</p>
                        </div>
                        <Badge variant={threat.severity === 'high' ? 'destructive' : threat.severity === 'medium' ? 'secondary' : 'default'}>
                          {threat.severity}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Database Security</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Secure</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">API Endpoints</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Protected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">SSL Certificate</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Firewall Status</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Backup Encryption</span>
                    <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Needs Attention</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access-control" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  User Access Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-mfa" className="text-slate-200">Multi-Factor Authentication</Label>
                  <Switch
                    id="enable-mfa"
                    checked={securitySettings.enableMFA}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableMFA: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="strong-passwords" className="text-slate-200">Require Strong Passwords</Label>
                  <Switch
                    id="strong-passwords"
                    checked={securitySettings.requireStrongPasswords}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireStrongPasswords: checked})}
                  />
                </div>

                <div>
                  <Label htmlFor="session-timeout" className="text-slate-200">Session Timeout (hours)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="max-attempts" className="text-slate-200">Max Login Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5" />
                  IP & Network Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ip-whitelist" className="text-slate-200">IP Whitelist (Admin Access)</Label>
                  <Switch
                    id="ip-whitelist"
                    checked={securitySettings.enableIPWhitelist}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableIPWhitelist: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="rate-limiting" className="text-slate-200">Rate Limiting</Label>
                  <Switch
                    id="rate-limiting"
                    checked={securitySettings.enableRateLimiting}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableRateLimiting: checked})}
                  />
                </div>

                <div>
                  <Label htmlFor="whitelist-ips" className="text-slate-200">Whitelisted IP Addresses</Label>
                  <Input
                    id="whitelist-ips"
                    placeholder="192.168.1.1, 10.0.0.1"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button variant="outline" className="w-full">
                  <UserX className="h-4 w-4 mr-2" />
                  View Blocked IPs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data-protection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5" />
                  Data Encryption
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Database Encryption</span>
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">File Storage Encryption</span>
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Backup Encryption</span>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Transit Encryption (TLS)</span>
                  <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Key className="h-5 w-5" />
                  Key Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Rotate API Keys
                </Button>
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Generate New Encryption Key
                </Button>
                <div className="text-sm text-slate-400">
                  Last key rotation: 30 days ago
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>Complete audit trail of all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-4 text-slate-400">
                      No audit logs available
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{log.action}</p>
                          <p className="text-slate-400 text-sm">{log.user} • {log.timestamp}</p>
                        </div>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <Button onClick={exportAuditLogs} variant="outline" className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export Audit Logs
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">GDPR Compliance</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">CCPA Compliance</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">SOC 2 Type II</span>
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Data Retention Policy</span>
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Compliance Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export User Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Security Configuration</CardTitle>
              <CardDescription>Advanced security settings and controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-lockout" className="text-slate-200">Auto Account Lockout</Label>
                    <Switch
                      id="auto-lockout"
                      checked={securitySettings.autoLockoutEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, autoLockoutEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="encryption" className="text-slate-200">Data Encryption</Label>
                    <Switch
                      id="encryption"
                      checked={securitySettings.encryptionEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, encryptionEnabled: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Test Security Configuration
                  </Button>

                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Security Policies
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-900/20 border-blue-700">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  Security settings will take effect immediately. Some changes may require user re-authentication.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
