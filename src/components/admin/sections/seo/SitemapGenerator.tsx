import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, RefreshCw, Download, CheckCircle, AlertTriangle, Calendar, Gauge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SitemapPage {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
  included: boolean;
  type: 'page' | 'article' | 'course' | 'video';
}

interface SitemapSettings {
  includeImages: boolean;
  includeVideos: boolean;
  includeLastMod: boolean;
  includePriority: boolean;
  includeChangefreq: boolean;
  maxUrls: number;
  excludePatterns: string[];
  defaultChangefreq: string;
  defaultPriority: number;
}

export function SitemapGenerator() {
  const [sitemapSettings, setSitemapSettings] = useState<SitemapSettings>({
    includeImages: true,
    includeVideos: true,
    includeLastMod: true,
    includePriority: true,
    includeChangefreq: true,
    maxUrls: 50000,
    excludePatterns: ['/admin/*', '/api/*', '/auth/*'],
    defaultChangefreq: 'weekly',
    defaultPriority: 0.7,
  });

  const [sitemapPages, setSitemapPages] = useState<SitemapPage[]>([
    {
      url: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 1.0,
      included: true,
      type: 'page'
    },
    {
      url: '/dashboard',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.9,
      included: true,
      type: 'page'
    },
    {
      url: '/articles',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8,
      included: true,
      type: 'page'
    },
    {
      url: '/courses',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
      included: true,
      type: 'page'
    },
    {
      url: '/videos',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
      included: true,
      type: 'page'
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [sitemapSize, setSitemapSize] = useState(0);

  const { toast } = useToast();

  const discoverPages = async () => {
    setIsGenerating(true);
    try {
      // Discover pages from different content types
      const [articles, courses, videos] = await Promise.all([
        supabase.from('articles').select('id, title, updated_at, status').eq('status', 'published'),
        supabase.from('courses').select('id, title, updated_at, status').eq('status', 'published'),
        supabase.from('video_tutorials').select('id, title, updated_at, status').eq('status', 'published')
      ]);

      const discoveredPages: SitemapPage[] = [...sitemapPages];

      // Add articles
      if (articles.data) {
        articles.data.forEach(article => {
          discoveredPages.push({
            url: `/articles/${article.id}`,
            lastmod: article.updated_at,
            changefreq: 'monthly',
            priority: 0.7,
            included: true,
            type: 'article'
          });
        });
      }

      // Add courses
      if (courses.data) {
        courses.data.forEach(course => {
          discoveredPages.push({
            url: `/courses/${course.id}`,
            lastmod: course.updated_at,
            changefreq: 'monthly',
            priority: 0.8,
            included: true,
            type: 'course'
          });
        });
      }

      // Add videos
      if (videos.data) {
        videos.data.forEach(video => {
          discoveredPages.push({
            url: `/videos/${video.id}`,
            lastmod: video.updated_at,
            changefreq: 'monthly',
            priority: 0.6,
            included: true,
            type: 'video'
          });
        });
      }

      setSitemapPages(discoveredPages);
      toast({
        title: "Pages Discovered",
        description: `Found ${discoveredPages.length} pages for your sitemap.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discover pages.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSitemap = async () => {
    setIsGenerating(true);
    try {
      const includedPages = sitemapPages.filter(page => page.included);
      
      // Generate XML sitemap
      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${sitemapSettings.includeImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}${sitemapSettings.includeVideos ? ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : ''}>
`;

      includedPages.forEach(page => {
        sitemapXml += `  <url>
    <loc>${window.location.origin}${page.url}</loc>`;
        
        if (sitemapSettings.includeLastMod) {
          sitemapXml += `
    <lastmod>${page.lastmod}</lastmod>`;
        }
        
        if (sitemapSettings.includeChangefreq) {
          sitemapXml += `
    <changefreq>${page.changefreq}</changefreq>`;
        }
        
        if (sitemapSettings.includePriority) {
          sitemapXml += `
    <priority>${page.priority}</priority>`;
        }
        
        sitemapXml += `
  </url>
`;
      });

      sitemapXml += `</urlset>`;

      // Calculate sitemap size
      const sizeInBytes = new Blob([sitemapXml]).size;
      setSitemapSize(sizeInBytes);

      // In a real implementation, you would save this to your server
      // For demo purposes, we'll just show success
      setLastGenerated(new Date());
      
      toast({
        title: "Sitemap Generated",
        description: `Generated sitemap with ${includedPages.length} URLs (${(sizeInBytes / 1024).toFixed(2)} KB).`,
      });

      // Save sitemap settings to database
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'sitemap_settings',
          setting_value: sitemapSettings as any,
          description: 'Sitemap generation settings',
        });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sitemap.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSitemap = () => {
    const includedPages = sitemapPages.filter(page => page.included);
    
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    includedPages.forEach(page => {
      sitemapXml += `  <url>
    <loc>${window.location.origin}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    sitemapXml += `</urlset>`;

    const blob = new Blob([sitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePageInclusion = (index: number) => {
    const updatedPages = [...sitemapPages];
    updatedPages[index].included = !updatedPages[index].included;
    setSitemapPages(updatedPages);
  };

  const updatePageSetting = (index: number, field: keyof SitemapPage, value: any) => {
    const updatedPages = [...sitemapPages];
    (updatedPages[index] as any)[field] = value;
    setSitemapPages(updatedPages);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'course': return '📚';
      case 'video': return '🎥';
      default: return '🌐';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'course': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sitemap Generator</h2>
          <p className="text-muted-foreground">Generate and manage your XML sitemap</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={discoverPages} variant="outline" disabled={isGenerating}>
            <Globe className="h-4 w-4 mr-2" />
            Discover Pages
          </Button>
          <Button onClick={generateSitemap} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate Sitemap
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sitemap Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-images">Include Images</Label>
                <Switch
                  id="include-images"
                  checked={sitemapSettings.includeImages}
                  onCheckedChange={(checked) => setSitemapSettings({...sitemapSettings, includeImages: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-videos">Include Videos</Label>
                <Switch
                  id="include-videos"
                  checked={sitemapSettings.includeVideos}
                  onCheckedChange={(checked) => setSitemapSettings({...sitemapSettings, includeVideos: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-lastmod">Include Last Modified</Label>
                <Switch
                  id="include-lastmod"
                  checked={sitemapSettings.includeLastMod}
                  onCheckedChange={(checked) => setSitemapSettings({...sitemapSettings, includeLastMod: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-priority">Include Priority</Label>
                <Switch
                  id="include-priority"
                  checked={sitemapSettings.includePriority}
                  onCheckedChange={(checked) => setSitemapSettings({...sitemapSettings, includePriority: checked})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Default Change Frequency</Label>
                <Select 
                  value={sitemapSettings.defaultChangefreq}
                  onValueChange={(value) => setSitemapSettings({...sitemapSettings, defaultChangefreq: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Priority (0.0 - 1.0)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={sitemapSettings.defaultPriority}
                  onChange={(e) => setSitemapSettings({...sitemapSettings, defaultPriority: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Max URLs</Label>
                <Input
                  type="number"
                  value={sitemapSettings.maxUrls}
                  onChange={(e) => setSitemapSettings({...sitemapSettings, maxUrls: parseInt(e.target.value)})}
                />
              </div>
            </div>

            {lastGenerated && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last generated: {lastGenerated.toLocaleString()}
                </div>
                {sitemapSize > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Gauge className="h-4 w-4" />
                    Size: {(sitemapSize / 1024).toFixed(2)} KB
                  </div>
                )}
                <Button onClick={downloadSitemap} variant="outline" size="sm" className="w-full mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sitemap
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pages List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pages ({sitemapPages.filter(p => p.included).length}/{sitemapPages.length})</CardTitle>
            <CardDescription>Configure which pages to include in your sitemap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sitemapPages.map((page, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Switch
                    checked={page.included}
                    onCheckedChange={() => togglePageInclusion(index)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getTypeIcon(page.type)}</span>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{page.url}</code>
                      <Badge variant="outline" className={getTypeColor(page.type)}>
                        {page.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Priority:</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={page.priority}
                          onChange={(e) => updatePageSetting(index, 'priority', parseFloat(e.target.value))}
                          className="w-16 h-6 text-xs"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Change:</Label>
                        <Select 
                          value={page.changefreq}
                          onValueChange={(value) => updatePageSetting(index, 'changefreq', value)}
                        >
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}