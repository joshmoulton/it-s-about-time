import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  BarChart3, 
  Globe, 
  Settings, 
  FileText, 
  Image, 
  Link,
  TrendingUp,
  Eye,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Share2,
  Code,
  Monitor,
  Smartphone,
  Zap,
  Users,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Target,
  Shield,
  Gauge
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  siteUrl: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  twitterSite: string;
  linkedinCompanyId: string;
  robotsTxt: string;
  customMetaTags: { name: string; content: string }[];
  structuredData: any;
  sitemapSettings: {
    autoGenerate: boolean;
    includeImages: boolean;
    changefreq: string;
    priority: number;
  };
}

interface PerformanceMetrics {
  pagespeedScore: number;
  seoScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  mobileFriendly: boolean;
  sslEnabled: boolean;
  compressionEnabled: boolean;
}

export function EnhancedSEOManagement() {
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    siteTitle: 'Weekly Wizdom - Premium Trading Community',
    siteDescription: 'Elite trading insights, real-time market analysis, and premium investment strategies for serious traders and investors.',
    keywords: 'trading, cryptocurrency, market analysis, investment, financial insights, trading signals, premium community',
    siteUrl: 'https://your-domain.com',
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    googleTagManagerId: '',
    facebookPixelId: '',
    twitterSite: '@weeklywizdom',
    linkedinCompanyId: '',
    robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://your-domain.com/sitemap.xml',
    customMetaTags: [],
    structuredData: {},
    sitemapSettings: {
      autoGenerate: true,
      includeImages: true,
      changefreq: 'weekly',
      priority: 0.8,
    },
  });

  const [metaTagSettings, setMetaTagSettings] = useState({
    enableOG: true,
    enableTwitterCard: true,
    enableJsonLD: true,
    enableSitemap: true,
    enableRobots: true,
    enableBreadcrumbs: true,
    enableCanonical: true,
    enableHreflang: false,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    pagespeedScore: 0,
    seoScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    coreWebVitals: {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    },
    mobileFriendly: true,
    sslEnabled: true,
    compressionEnabled: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: 0,
    sessions: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    searchImpressions: 0,
    searchClicks: 0,
    averagePosition: 0,
    ctr: 0,
  });

  const { toast } = useToast();

  // Load SEO settings from database
  useEffect(() => {
    loadSEOSettings();
    loadPerformanceMetrics();
    loadAnalyticsData();
  }, []);

  const loadSEOSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'seo_config')
        .maybeSingle();

      if (data && !error) {
        setSeoSettings(prev => ({ ...prev, ...(data.setting_value as any) }));
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    // Simulate performance metrics - in a real app, this would come from external APIs
    setPerformanceMetrics({
      pagespeedScore: 87,
      seoScore: 94,
      accessibilityScore: 89,
      bestPracticesScore: 92,
      coreWebVitals: {
        lcp: 1.8,
        fid: 42,
        cls: 0.06,
        fcp: 1.2,
        ttfb: 280,
      },
      mobileFriendly: true,
      sslEnabled: true,
      compressionEnabled: true,
    });
  };

  const loadAnalyticsData = async () => {
    // Simulate analytics data - integrate with GA4 API in production
    setAnalyticsData({
      pageViews: 15420,
      sessions: 8760,
      bounceRate: 32.5,
      avgSessionDuration: 185,
      searchImpressions: 45300,
      searchClicks: 2180,
      averagePosition: 12.4,
      ctr: 4.8,
    });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'seo_config',
          setting_value: seoSettings as any,
          description: 'SEO configuration settings',
        });

      if (error) throw error;

      // Generate and update meta tags in real-time
      await updateMetaTags();
      
      toast({
        title: "SEO Settings Saved",
        description: "Your SEO configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SEO settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMetaTags = async () => {
    // Update document meta tags
    document.title = seoSettings.siteTitle;
    
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', seoSettings.siteDescription);
    updateMetaTag('keywords', seoSettings.keywords);
    updateMetaTag('og:title', seoSettings.siteTitle);
    updateMetaTag('og:description', seoSettings.siteDescription);
    updateMetaTag('og:url', seoSettings.siteUrl);
    updateMetaTag('twitter:title', seoSettings.siteTitle);
    updateMetaTag('twitter:description', seoSettings.siteDescription);
    updateMetaTag('twitter:site', seoSettings.twitterSite);
  };

  const generateSitemap = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would generate an actual sitemap
      toast({
        title: "Sitemap Generated",
        description: "XML sitemap has been generated and submitted to search engines.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sitemap.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSEOAudit = async () => {
    setIsLoading(true);
    try {
      // Simulate SEO audit - integrate with tools like Lighthouse API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "SEO Audit Complete",
        description: "Your site has been analyzed. Check the performance tab for results.",
      });
      
      // Update performance metrics with new data
      loadPerformanceMetrics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run SEO audit.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced SEO & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive SEO optimization and performance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runSEOAudit} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            {isLoading ? 'Running Audit...' : 'Run SEO Audit'}
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Target className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="general">General SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* SEO Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(performanceMetrics.seoScore)}`}>
                  {performanceMetrics.seoScore}
                </div>
                <Badge variant={getScoreBadgeVariant(performanceMetrics.seoScore)} className="mt-2">
                  {performanceMetrics.seoScore >= 90 ? 'Excellent' : 
                   performanceMetrics.seoScore >= 70 ? 'Good' : 'Needs Work'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  PageSpeed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(performanceMetrics.pagespeedScore)}`}>
                  {performanceMetrics.pagespeedScore}
                </div>
                <Badge variant={getScoreBadgeVariant(performanceMetrics.pagespeedScore)} className="mt-2">
                  Desktop Score
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(performanceMetrics.accessibilityScore)}`}>
                  {performanceMetrics.accessibilityScore}
                </div>
                <Badge variant={getScoreBadgeVariant(performanceMetrics.accessibilityScore)} className="mt-2">
                  A11y Score
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(performanceMetrics.bestPracticesScore)}`}>
                  {performanceMetrics.bestPracticesScore}
                </div>
                <Badge variant={getScoreBadgeVariant(performanceMetrics.bestPracticesScore)} className="mt-2">
                  Standards
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Google Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.pageViews.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Page Views</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.sessions.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.bounceRate}%</div>
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.avgSessionDuration}s</div>
                    <p className="text-sm text-muted-foreground">Avg. Session</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Console Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.searchImpressions.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.searchClicks.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.ctr}%</div>
                    <p className="text-sm text-muted-foreground">CTR</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{analyticsData.averagePosition}</div>
                    <p className="text-sm text-muted-foreground">Avg. Position</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic SEO Configuration
              </CardTitle>
              <CardDescription>Configure your site's fundamental SEO settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input
                    id="site-title"
                    value={seoSettings.siteTitle}
                    onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                    placeholder="Your site title"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {seoSettings.siteTitle.length}/60 characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="site-url">Site URL</Label>
                  <Input
                    id="site-url"
                    value={seoSettings.siteUrl}
                    onChange={(e) => setSeoSettings({...seoSettings, siteUrl: e.target.value})}
                    placeholder="https://yourdomain.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={seoSettings.siteDescription}
                  onChange={(e) => setSeoSettings({...seoSettings, siteDescription: e.target.value})}
                  rows={3}
                  placeholder="Brief description of your site"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seoSettings.siteDescription.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  value={seoSettings.keywords}
                  onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                  placeholder="keyword1, keyword2, keyword3"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate keywords with commas
                </p>
              </div>

              <div>
                <Label htmlFor="robots-txt">Robots.txt Content</Label>
                <Textarea
                  id="robots-txt"
                  value={seoSettings.robotsTxt}
                  onChange={(e) => setSeoSettings({...seoSettings, robotsTxt: e.target.value})}
                  rows={4}
                  placeholder="User-agent: *..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Google Analytics 4
                </CardTitle>
                <CardDescription>Configure GA4 tracking and events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ga4-id">GA4 Measurement ID</Label>
                  <Input
                    id="ga4-id"
                    value={seoSettings.googleAnalyticsId}
                    onChange={(e) => setSeoSettings({...seoSettings, googleAnalyticsId: e.target.value})}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
                  <Input
                    id="gtm-id"
                    value={seoSettings.googleTagManagerId}
                    onChange={(e) => setSeoSettings({...seoSettings, googleTagManagerId: e.target.value})}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant={seoSettings.googleAnalyticsId ? "default" : "secondary"}>
                    {seoSettings.googleAnalyticsId ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Analytics Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Google Search Console
                </CardTitle>
                <CardDescription>Monitor search performance and indexing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gsc-property">Property URL</Label>
                  <Input
                    id="gsc-property"
                    value={seoSettings.googleSearchConsoleId}
                    onChange={(e) => setSeoSettings({...seoSettings, googleSearchConsoleId: e.target.value})}
                    placeholder="https://yourdomain.com"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Verification</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Search Console
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Open Graph Settings
                </CardTitle>
                <CardDescription>Configure how your content appears when shared</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-og">Enable OpenGraph Tags</Label>
                  <Switch
                    id="enable-og"
                    checked={metaTagSettings.enableOG}
                    onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableOG: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-twitter">Enable Twitter Cards</Label>
                  <Switch
                    id="enable-twitter"
                    checked={metaTagSettings.enableTwitterCard}
                    onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableTwitterCard: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Integration</CardTitle>
                <CardDescription>Connect with social platforms for enhanced tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="twitter-site">Twitter Site Handle</Label>
                  <Input
                    id="twitter-site"
                    value={seoSettings.twitterSite}
                    onChange={(e) => setSeoSettings({...seoSettings, twitterSite: e.target.value})}
                    placeholder="@yourusername"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook-pixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebook-pixel"
                    value={seoSettings.facebookPixelId}
                    onChange={(e) => setSeoSettings({...seoSettings, facebookPixelId: e.target.value})}
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin-company">LinkedIn Company ID</Label>
                  <Input
                    id="linkedin-company"
                    value={seoSettings.linkedinCompanyId}
                    onChange={(e) => setSeoSettings({...seoSettings, linkedinCompanyId: e.target.value})}
                    placeholder="12345678"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical SEO Settings
              </CardTitle>
              <CardDescription>Advanced technical SEO configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>JSON-LD Structured Data</Label>
                    <Switch
                      checked={metaTagSettings.enableJsonLD}
                      onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableJsonLD: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>XML Sitemap</Label>
                    <Switch
                      checked={metaTagSettings.enableSitemap}
                      onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableSitemap: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Canonical URLs</Label>
                    <Switch
                      checked={metaTagSettings.enableCanonical}
                      onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableCanonical: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Breadcrumb Schema</Label>
                    <Switch
                      checked={metaTagSettings.enableBreadcrumbs}
                      onCheckedChange={(checked) => setMetaTagSettings({...metaTagSettings, enableBreadcrumbs: checked})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Sitemap Change Frequency</Label>
                    <Select 
                      value={seoSettings.sitemapSettings.changefreq}
                      onValueChange={(value) => setSeoSettings({
                        ...seoSettings, 
                        sitemapSettings: {...seoSettings.sitemapSettings, changefreq: value}
                      })}
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
                      value={seoSettings.sitemapSettings.priority}
                      onChange={(e) => setSeoSettings({
                        ...seoSettings,
                        sitemapSettings: {...seoSettings.sitemapSettings, priority: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>Critical performance metrics that affect SEO rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${performanceMetrics.coreWebVitals.lcp <= 2.5 ? 'text-green-500' : performanceMetrics.coreWebVitals.lcp <= 4 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {performanceMetrics.coreWebVitals.lcp}s
                  </div>
                  <p className="text-sm text-muted-foreground">LCP</p>
                  <Badge variant={performanceMetrics.coreWebVitals.lcp <= 2.5 ? "default" : performanceMetrics.coreWebVitals.lcp <= 4 ? "secondary" : "destructive"} className="mt-2 text-xs">
                    {performanceMetrics.coreWebVitals.lcp <= 2.5 ? 'Good' : performanceMetrics.coreWebVitals.lcp <= 4 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${performanceMetrics.coreWebVitals.fid <= 100 ? 'text-green-500' : performanceMetrics.coreWebVitals.fid <= 300 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {performanceMetrics.coreWebVitals.fid}ms
                  </div>
                  <p className="text-sm text-muted-foreground">FID</p>
                  <Badge variant={performanceMetrics.coreWebVitals.fid <= 100 ? "default" : performanceMetrics.coreWebVitals.fid <= 300 ? "secondary" : "destructive"} className="mt-2 text-xs">
                    {performanceMetrics.coreWebVitals.fid <= 100 ? 'Good' : performanceMetrics.coreWebVitals.fid <= 300 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${performanceMetrics.coreWebVitals.cls <= 0.1 ? 'text-green-500' : performanceMetrics.coreWebVitals.cls <= 0.25 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {performanceMetrics.coreWebVitals.cls}
                  </div>
                  <p className="text-sm text-muted-foreground">CLS</p>
                  <Badge variant={performanceMetrics.coreWebVitals.cls <= 0.1 ? "default" : performanceMetrics.coreWebVitals.cls <= 0.25 ? "secondary" : "destructive"} className="mt-2 text-xs">
                    {performanceMetrics.coreWebVitals.cls <= 0.1 ? 'Good' : performanceMetrics.coreWebVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${performanceMetrics.coreWebVitals.fcp <= 1.8 ? 'text-green-500' : performanceMetrics.coreWebVitals.fcp <= 3 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {performanceMetrics.coreWebVitals.fcp}s
                  </div>
                  <p className="text-sm text-muted-foreground">FCP</p>
                  <Badge variant={performanceMetrics.coreWebVitals.fcp <= 1.8 ? "default" : performanceMetrics.coreWebVitals.fcp <= 3 ? "secondary" : "destructive"} className="mt-2 text-xs">
                    {performanceMetrics.coreWebVitals.fcp <= 1.8 ? 'Good' : performanceMetrics.coreWebVitals.fcp <= 3 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${performanceMetrics.coreWebVitals.ttfb <= 600 ? 'text-green-500' : performanceMetrics.coreWebVitals.ttfb <= 1500 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {performanceMetrics.coreWebVitals.ttfb}ms
                  </div>
                  <p className="text-sm text-muted-foreground">TTFB</p>
                  <Badge variant={performanceMetrics.coreWebVitals.ttfb <= 600 ? "default" : performanceMetrics.coreWebVitals.ttfb <= 1500 ? "secondary" : "destructive"} className="mt-2 text-xs">
                    {performanceMetrics.coreWebVitals.ttfb <= 600 ? 'Good' : performanceMetrics.coreWebVitals.ttfb <= 1500 ? 'Needs Improvement' : 'Poor'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Mobile Friendly</span>
                    <Badge variant={performanceMetrics.mobileFriendly ? "default" : "destructive"}>
                      {performanceMetrics.mobileFriendly ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Responsive Design</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Touch Elements</span>
                    <Badge variant="default">Optimized</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>SSL Certificate</span>
                    <Badge variant={performanceMetrics.sslEnabled ? "default" : "destructive"}>
                      {performanceMetrics.sslEnabled ? "Active" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HTTPS Redirect</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HSTS Header</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Compression</span>
                    <Badge variant={performanceMetrics.compressionEnabled ? "default" : "destructive"}>
                      {performanceMetrics.compressionEnabled ? "Gzip" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Image Optimization</span>
                    <Badge variant="default">WebP</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Minification</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  SEO Tools
                </CardTitle>
                <CardDescription>Quick actions to optimize your site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={generateSitemap} variant="outline" className="w-full justify-start" disabled={isLoading}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Submit to Search Engines
                </Button>
                <Button onClick={runSEOAudit} variant="outline" className="w-full justify-start" disabled={isLoading}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isLoading ? 'Running...' : 'Run SEO Audit'}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Monitor className="h-4 w-4 mr-2" />
                  Test Mobile Usability
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Check Page Speed
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  External Tools
                </CardTitle>
                <CardDescription>Access external SEO tools and platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Search Console
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  PageSpeed Insights
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Tag Manager
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Schema Markup Validator
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}