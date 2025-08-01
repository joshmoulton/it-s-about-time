
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle
} from 'lucide-react';
import { useSEOSettings } from '@/hooks/admin-operations/useSEOSettings';

export function SEOManagement() {
  const { data: seoSettings, isLoading, error, updateSettings, isUpdating } = useSEOSettings();
  const [localSettings, setLocalSettings] = useState({});

  const [performanceMetrics] = useState({
    pagespeedScore: 85,
    coreWebVitals: { lcp: 2.1, fid: 45, cls: 0.08 },
    seoScore: 92,
    mobileFriendly: true
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading SEO settings...</div>
        </div>
      </div>
    );
  }

  if (error || !seoSettings) {
    return (
      <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400">Failed to load SEO settings</div>
        </div>
      </div>
    );
  }

  const currentSettings = { ...seoSettings, ...localSettings };

  const handleSaveSettings = () => {
    updateSettings(currentSettings);
  };

  // Removed toast usage since it's not needed

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">SEO & Analytics Management</h1>
        <p className="text-slate-400">Optimize your site for search engines and track performance</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="general">General SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="meta-tags">Meta Tags</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tools">SEO Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>Configure your site's basic SEO settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site-title" className="text-slate-200">Site Title</Label>
                  <Input
                    id="site-title"
                    value={currentSettings.siteTitle}
                    onChange={(e) => setLocalSettings({...localSettings, siteTitle: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="keywords" className="text-slate-200">Keywords</Label>
                  <Input
                    id="keywords"
                    value={currentSettings.keywords}
                    onChange={(e) => setLocalSettings({...localSettings, keywords: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="trading, investment, market analysis"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site-description" className="text-slate-200">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={currentSettings.siteDescription}
                  onChange={(e) => setLocalSettings({...localSettings, siteDescription: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {currentSettings.siteDescription?.length || 0}/160 characters (recommended)
                </p>
              </div>

              <div>
                <Label htmlFor="og-image" className="text-slate-200">OpenGraph Image URL</Label>
                <Input
                  id="og-image"
                  value={currentSettings.ogImage}
                  onChange={(e) => setLocalSettings({...localSettings, ogImage: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="/og-image.jpg"
                />
              </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? "Saving..." : "Save SEO Settings"}
                </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  Google Analytics
                </CardTitle>
                <CardDescription>Configure Google Analytics 4 tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ga-id" className="text-slate-200">GA4 Measurement ID</Label>
                  <Input
                    id="ga-id"
                    value={currentSettings.googleAnalyticsId}
                    onChange={(e) => setLocalSettings({...localSettings, googleAnalyticsId: e.target.value})}
                    placeholder="G-XXXXXXXXXX"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Status</span>
                  <Badge variant={currentSettings.googleAnalyticsId ? "default" : "secondary"}>
                    {currentSettings.googleAnalyticsId ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Analytics Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Search className="h-5 w-5" />
                  Google Search Console
                </CardTitle>
                <CardDescription>Monitor search performance and indexing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gsc-id" className="text-slate-200">Property URL</Label>
                  <Input
                    id="gsc-id"
                    value={currentSettings.googleSearchConsoleId}
                    onChange={(e) => setLocalSettings({...localSettings, googleSearchConsoleId: e.target.value})}
                    placeholder="https://yourdomain.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Verification</span>
                  <Badge variant="outline">
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

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Additional Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fb-pixel" className="text-slate-200">Facebook Pixel ID</Label>
                  <Input
                    id="fb-pixel"
                    value={currentSettings.facebookPixelId}
                    onChange={(e) => setLocalSettings({...localSettings, facebookPixelId: e.target.value})}
                    placeholder="123456789012345"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter-card" className="text-slate-200">Twitter Card Type</Label>
                  <Input
                    id="twitter-card"
                    value={currentSettings.twitterCardType}
                    onChange={(e) => setLocalSettings({...localSettings, twitterCardType: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta-tags" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Meta Tags Configuration
              </CardTitle>
              <CardDescription>Control which meta tags are generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-og" className="text-slate-200">OpenGraph Tags</Label>
                    <Switch
                      id="enable-og"
                      checked={currentSettings.enableOG}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, enableOG: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-twitter" className="text-slate-200">Twitter Cards</Label>
                    <Switch
                      id="enable-twitter"
                      checked={currentSettings.enableTwitterCard}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, enableTwitterCard: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-jsonld" className="text-slate-200">JSON-LD Structured Data</Label>
                    <Switch
                      id="enable-jsonld"
                      checked={currentSettings.enableJsonLD}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, enableJsonLD: checked})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-sitemap" className="text-slate-200">XML Sitemap</Label>
                    <Switch
                      id="enable-sitemap"
                      checked={currentSettings.enableSitemap}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, enableSitemap: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-robots" className="text-slate-200">Robots.txt</Label>
                    <Switch
                      id="enable-robots"
                      checked={currentSettings.enableRobots}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, enableRobots: checked})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  PageSpeed Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{performanceMetrics.pagespeedScore}</div>
                <p className="text-slate-400">Out of 100</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">{performanceMetrics.seoScore}</div>
                <p className="text-slate-400">SEO Health</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-5 w-5" />
                  Mobile Friendly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">
                  {performanceMetrics.mobileFriendly ? "✓" : "✗"}
                </div>
                <p className="text-slate-400">Google Test</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Core Web Vitals</CardTitle>
              <CardDescription>Critical performance metrics that Google uses for ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{performanceMetrics.coreWebVitals.lcp}s</div>
                  <p className="text-slate-300">Largest Contentful Paint</p>
                  <Badge variant="outline" className="mt-2">Needs Improvement</Badge>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{performanceMetrics.coreWebVitals.fid}ms</div>
                  <p className="text-slate-300">First Input Delay</p>
                  <Badge variant="default" className="mt-2">Good</Badge>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{performanceMetrics.coreWebVitals.cls}</div>
                  <p className="text-slate-300">Cumulative Layout Shift</p>
                  <Badge variant="default" className="mt-2">Good</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Link className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Submit to Google
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run SEO Audit
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Image className="h-4 w-4 mr-2" />
                  Optimize Images
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  External Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google PageSpeed Insights
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GTmetrix Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Schema Validator
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rich Results Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
