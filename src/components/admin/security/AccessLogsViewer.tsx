import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, Search, Eye, EyeOff, ChevronDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { type DataAccessLog } from '@/utils/securityUtils';

interface AccessLogsViewerProps {
  logs: DataAccessLog[];
  onRefresh: () => void;
}

export const AccessLogsViewer: React.FC<AccessLogsViewerProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm);

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'granted' && log.access_granted) ||
      (filterStatus === 'denied' && !log.access_granted);

    const matchesResourceType = 
      filterResourceType === 'all' || 
      log.resource_type === filterResourceType;

    return matchesSearch && matchesStatus && matchesResourceType;
  });

  const getResourceTypes = () => {
    const types = Array.from(new Set(logs.map(log => log.resource_type)));
    return types.sort();
  };

  const getAccessStatusBadge = (log: DataAccessLog) => {
    if (log.access_granted) {
      return (
        <Badge variant="outline" className="bg-success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Granted
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      );
    }
  };

  const getRiskLevelBadge = (riskScore: number) => {
    if (riskScore < 2) {
      return <Badge variant="outline" className="bg-success">Low</Badge>;
    } else if (riskScore < 5) {
      return <Badge variant="outline" className="bg-warning">Medium</Badge>;
    } else {
      return (
        <Badge variant="outline" className="bg-destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          High
        </Badge>
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatResourceType = (resourceType: string) => {
    return resourceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs by email, IP, resource, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="granted">Granted</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterResourceType} onValueChange={setFilterResourceType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {getResourceTypes().map((type) => (
              <SelectItem key={type} value={type}>
                {formatResourceType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {filteredLogs.filter(log => log.access_granted).length}
            </div>
            <div className="text-sm text-muted-foreground">Access Granted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {filteredLogs.filter(log => !log.access_granted).length}
            </div>
            <div className="text-sm text-muted-foreground">Access Denied</div>
          </CardContent>
        </Card>
      </div>

      {/* Access Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Access Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No access logs found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.created_at)}
                      </TableCell>
                      <TableCell>{log.admin_email || '-'}</TableCell>
                      <TableCell>{formatResourceType(log.resource_type)}</TableCell>
                      <TableCell className="capitalize">
                        {log.action_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{getAccessStatusBadge(log)}</TableCell>
                      <TableCell>{getRiskLevelBadge(log.risk_score)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            >
                              {expandedRow === log.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Collapsible open={expandedRow === log.id}>
                            <CollapsibleContent>
                              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">User Agent:</span>
                                    <p className="text-muted-foreground mt-1">
                                      {log.user_agent || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Device Fingerprint:</span>
                                    <p className="text-muted-foreground mt-1 font-mono">
                                      {log.device_fingerprint || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Resource ID:</span>
                                    <p className="text-muted-foreground mt-1">
                                      {log.resource_id || 'Not specified'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Risk Score:</span>
                                    <p className="text-muted-foreground mt-1">
                                      {log.risk_score.toFixed(2)}
                                    </p>
                                  </div>
                                  {log.geo_location && (
                                    <div>
                                      <span className="font-medium">Location:</span>
                                      <p className="text-muted-foreground mt-1">
                                        {JSON.stringify(log.geo_location)}
                                      </p>
                                    </div>
                                  )}
                                  {log.denial_reason && (
                                    <div>
                                      <span className="font-medium text-destructive">Denial Reason:</span>
                                      <p className="text-destructive mt-1">
                                        {log.denial_reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};