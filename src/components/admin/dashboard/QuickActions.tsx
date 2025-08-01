
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Mail, 
  Video, 
  BookOpen, 
  Users, 
  Settings,
  Download,
  Zap,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function QuickActions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      toast({
        title: "Export Data",
        description: "Personal data is not stored locally for security. Export features are limited to system logs only.",
      });

      // Export only system logs, not personal data
      const { data: logs, error: logsError } = await supabase
        .from('authentication_audit_log')
        .select('auth_method, action_type, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      // Create and download CSV
      const csvContent = logs.map(log => 
        `${log.created_at},${log.auth_method},${log.action_type},${JSON.stringify(log.metadata)}`
      ).join('\n');
      
      const blob = new Blob([`Date,Auth Method,Action,Metadata\n${csvContent}`], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "System logs exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      });
    }
  };

  const quickActions = [
    {
      label: 'Create Article',
      icon: FileText,
      action: () => navigate('/admin/articles'),
      variant: 'default' as const,
      description: 'Write a new article',
      color: 'bg-blue-500'
    },
    {
      label: 'Create Newsletter',
      icon: Mail,
      action: () => navigate('/admin/newsletters'),
      variant: 'outline' as const,
      description: 'Draft a new newsletter',
      color: 'bg-green-500'
    },
    {
      label: 'Add Video',
      icon: Video,
      action: () => navigate('/admin/videos'),
      variant: 'outline' as const,
      description: 'Upload video content',
      color: 'bg-purple-500'
    },
    {
      label: 'New Course',
      icon: BookOpen,
      action: () => navigate('/admin/courses'),
      variant: 'outline' as const,
      description: 'Create course material',
      color: 'bg-orange-500'
    },
    {
      label: 'Telegram Sync',
      icon: Zap,
      action: () => navigate('/admin/telegram'),
      variant: 'outline' as const,
      description: 'Sync Telegram data',
      color: 'bg-cyan-500'
    },
    {
      label: 'User Management',
      icon: Users,
      action: () => navigate('/admin/users'),
      variant: 'outline' as const,
      description: 'Manage subscribers',
      color: 'bg-pink-500'
    },
    {
      label: 'Export Data',
      icon: Download,
      action: handleExportData,
      variant: 'outline' as const,
      description: 'Download reports',
      color: 'bg-yellow-500'
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      variant: 'outline' as const,
      description: 'System configuration',
      color: 'bg-gray-500'
    },
  ];

  return (
    <Card className="border border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Plus className="h-5 w-5 text-cyan-400" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-slate-400">
          Common admin tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              className="w-full justify-start h-auto p-4 bg-slate-700/30 hover:bg-slate-600/40 border-slate-600/50 text-white transition-all duration-200 hover:scale-[1.02]"
            >
              <div className={`p-2 rounded-lg ${action.color} bg-opacity-20 mr-3`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{action.label}</div>
                <div className="text-xs text-slate-400">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
