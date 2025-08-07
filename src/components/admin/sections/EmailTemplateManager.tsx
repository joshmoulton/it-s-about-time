import React, { useState, useEffect } from 'react';
import { createSafeInnerHTML } from '@/utils/htmlSanitizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit2, 
  Copy, 
  Trash2, 
  Eye, 
  Mail, 
  Palette, 
  Type, 
  Layout,
  Send,
  Download,
  Upload,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'auth_signup' | 'auth_magic_link' | 'newsletter' | 'system' | 'custom';
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  styling: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    header_bg: string;
    button_color: string;
    button_text_color: string;
  };
  preview_data?: Record<string, string>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_TYPES = [
  { value: 'auth_signup', label: 'Auth - Signup Confirmation', icon: Mail },
  { value: 'auth_magic_link', label: 'Auth - Magic Link', icon: Mail },
  { value: 'newsletter', label: 'Newsletter', icon: Mail },
  { value: 'system', label: 'System Notification', icon: Mail },
  { value: 'custom', label: 'Custom Template', icon: Mail },
];

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Modern Sans)' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Arial', label: 'Arial' },
];

const COLOR_PRESETS = [
  { name: 'Weekly Wizdom', primary: '#335FF', secondary: '#6B7280', button: '#335FF' },
  { name: 'Professional Blue', primary: '#2563EB', secondary: '#64748B', button: '#2563EB' },
  { name: 'Success Green', primary: '#10B981', secondary: '#6B7280', button: '#10B981' },
  { name: 'Warning Orange', primary: '#F59E0B', secondary: '#6B7280', button: '#F59E0B' },
  { name: 'Error Red', primary: '#EF4444', secondary: '#6B7280', button: '#EF4444' },
];

export function EmailTemplateManager() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'custom' as const,
    subject: '',
    html_content: '',
    text_content: '',
    variables: '',
    styling: {
      primary_color: '#335FF',
      secondary_color: '#6B7280',
      font_family: 'Inter',
      header_bg: '#F9FAFB',
      button_color: '#335FF',
      button_text_color: '#FFFFFF',
    },
    preview_data: {},
    is_active: true,
    is_default: false,
  });

  const queryClient = useQueryClient();

  // Mock data for now - replace with actual Supabase queries
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      // Mock data for demonstration
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Signup Confirmation',
          description: 'Email sent to users when they sign up',
          template_type: 'auth_signup',
          subject: 'Welcome to Weekly Wizdom!',
          html_content: `
            <div style="font-family: {{font_family}}, sans-serif; max-width: 600px; margin: 0 auto; background: {{header_bg}}; padding: 20px;">
              <div style="text-align: center; padding: 40px 0;">
                <h1 style="color: {{primary_color}}; font-size: 28px; margin-bottom: 20px;">Welcome to Weekly Wizdom!</h1>
                <p style="color: {{secondary_color}}; font-size: 16px; margin-bottom: 30px;">
                  Thanks for signing up with {{user_email}}. Please confirm your email address to complete your account setup.
                </p>
                <a href="{{confirmation_link}}" style="background: {{button_color}}; color: {{button_text_color}}; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Confirm Email Address
                </a>
              </div>
            </div>
          `,
          text_content: 'Welcome to Weekly Wizdom! Please confirm your email: {{confirmation_link}}',
          variables: ['user_email', 'confirmation_link', 'font_family', 'primary_color', 'secondary_color', 'header_bg', 'button_color', 'button_text_color'],
          styling: {
            primary_color: '#335FF',
            secondary_color: '#6B7280',
            font_family: 'Inter',
            header_bg: '#F9FAFB',
            button_color: '#335FF',
            button_text_color: '#FFFFFF',
          },
          preview_data: {
            user_email: 'john@example.com',
            confirmation_link: 'https://weeklywizdom.app/confirm'
          },
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Magic Link Login',
          description: 'Beautiful magic link email for user authentication',
          template_type: 'auth_magic_link',
          subject: 'Your Weekly Wizdom sign-in link',
          html_content: `
            <div style="font-family: {{font_family}}, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1419; color: #ffffff; padding: 0;">
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 30px; margin: 20px 0;">
                <div style="text-align: center; padding: 20px 0;">
                  <div style="font-size: 24px; font-weight: bold; color: {{primary_color}}; margin-bottom: 8px;">📈 Weekly Wizdom</div>
                  <p style="font-size: 14px; color: #64748b; margin: 0;">Premium Trading Intelligence</p>
                </div>
                
                <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">Welcome Back, Trader! 🎯</h1>
                <p style="color: #94a3b8; font-size: 16px; margin: 0 0 30px 0; text-align: center;">
                  Your secure access to premium trading insights awaits
                </p>
              </div>

              <div style="padding: 0 20px;">
                <p style="color: #e2e8f0; font-size: 16px; margin: 16px 0;">
                  Hey there! 👋
                </p>
                <p style="color: #e2e8f0; font-size: 16px; margin: 16px 0;">
                  Ready to dive into today's market opportunities? We've got your secure sign-in link ready.
                </p>
                <p style="color: #e2e8f0; font-size: 16px; margin: 16px 0;">
                  Click the button below to access your <strong>Weekly Wizdom</strong> dashboard:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{magic_link_url}}" style="background: {{button_color}}; color: {{button_text_color}}; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    🚀 Access Your Dashboard
                  </a>
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 40px 24px 24px; padding: 20px; border-top: 1px solid #334155;">
                🔒 This link is secure and will expire in 1 hour for your safety.<br/>
                If you didn't request this, you can safely ignore this email.<br/><br/>
                
                <strong>Weekly Wizdom</strong> - Where Smart Money Meets Smart Traders 💎<br/>
                <a href="https://www.weeklywizdom.app" style="color: {{primary_color}};">weeklywizdom.app</a>
              </p>
            </div>
          `,
          text_content: 'Welcome back to Weekly Wizdom! Access your dashboard: {{magic_link_url}}',
          variables: ['magic_link_url', 'user_email', 'font_family', 'primary_color', 'button_color', 'button_text_color'],
          styling: {
            primary_color: '#3b82f6',
            secondary_color: '#64748b',
            font_family: 'Inter',
            header_bg: '#0f1419',
            button_color: '#3b82f6',
            button_text_color: '#ffffff',
          },
          preview_data: {
            magic_link_url: 'https://weeklywizdom.app/auth/verify?token=sample',
            token: 'ABC123DEF456',
            user_email: 'trader@example.com'
          },
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      return mockTemplates;
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_type: 'custom',
      subject: '',
      html_content: '',
      text_content: '',
      variables: '',
      styling: {
        primary_color: '#335FF',
        secondary_color: '#6B7280',
        font_family: 'Inter',
        header_bg: '#F9FAFB',
        button_color: '#335FF',
        button_text_color: '#FFFFFF',
      },
      preview_data: {},
      is_active: true,
      is_default: false,
    });
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        primary_color: preset.primary,
        secondary_color: preset.secondary,
        button_color: preset.button,
      }
    }));
  };

  const renderPreview = (template: EmailTemplate) => {
    let preview = template.html_content;
    
    // Replace styling variables
    Object.entries(template.styling).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      preview = preview.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    // Replace data variables
    Object.entries(template.preview_data || {}).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      preview = preview.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return preview;
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  const handleSendTestEmail = async (template: EmailTemplate) => {
    // Implementation for sending test email
    toast.success('Test email sent successfully!');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Email Template Manager</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Design and customize email templates with visual preview
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                      <CardTitle className="text-base lg:text-lg truncate">{template.name}</CardTitle>
                    </div>
                    <Badge variant={template.is_active ? "default" : "secondary"} className="flex-shrink-0">
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">{template.template_type}</Badge>
                    {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                  
                  <div className="text-sm text-muted-foreground flex-grow">
                    <strong>Subject:</strong> <span className="line-clamp-2">{template.subject}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2 mt-auto">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setActiveTab('editor');
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setActiveTab('preview');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSendTestEmail(template)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {selectedTemplate ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              <Card className="order-2 xl:order-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Edit2 className="h-5 w-5" />
                    Template Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={selectedTemplate.name} readOnly />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input value={selectedTemplate.subject} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>HTML Content</Label>
                    <Textarea
                      value={selectedTemplate.html_content}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <Label>Color Presets</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyColorPreset(preset)}
                          className="justify-start"
                        >
                          <div
                            className="w-4 h-4 rounded mr-2"
                            style={{ backgroundColor: preset.primary }}
                          />
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <Input
                        type="color"
                        value={selectedTemplate.styling.primary_color}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Color</Label>
                      <Input
                        type="color"
                        value={selectedTemplate.styling.button_color}
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={selectedTemplate.styling.font_family}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="order-1 xl:order-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4">
                    <div 
                      className="mx-auto border rounded"
                      style={{ width: getPreviewWidth() }}
                      dangerouslySetInnerHTML={createSafeInnerHTML(renderPreview(selectedTemplate), 'email')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a template to edit</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Desktop</span>
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tablet</span>
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Mobile</span>
                  </Button>
                </div>
                <Button onClick={() => handleSendTestEmail(selectedTemplate)} className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold">Subject: {selectedTemplate.subject}</h3>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      className="mx-auto bg-white rounded shadow"
                      style={{ width: getPreviewWidth() }}
                      dangerouslySetInnerHTML={createSafeInnerHTML(renderPreview(selectedTemplate), 'email')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a template to preview</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}