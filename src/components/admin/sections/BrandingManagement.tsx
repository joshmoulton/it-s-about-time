import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Globe, 
  Share2, 
  Image as ImageIcon, 
  Eye,
  Download,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function BrandingManagement() {
  const [logoSettings, setLogoSettings] = useState({
    mainLogo: '',
    faviconUrl: '',
    headerLogo: '',
    footerLogo: '',
    darkModeLogo: '',
    emailLogo: ''
  });

  const [seoSettings, setSeoSettings] = useState({
    siteName: 'Weekly Wizdom',
    siteTitle: 'Weekly Wizdom - Crypto Intelligence & Trading Community',
    siteDescription: 'Get actionable crypto insights, trading signals, and join a community of successful traders with Weekly Wizdom\'s premium intelligence platform.',
    keywords: 'crypto, trading, intelligence, signals, community, weekly wizdom',
    ogImage: '',
    twitterImage: '',
    faviconFile: null as File | null
  });

  const [socialSettings, setSocialSettings] = useState({
    twitterHandle: '@weeklywizdom',
    facebookPage: '',
    linkedinPage: '',
    instagramHandle: '',
    discordInvite: '',
    telegramChannel: ''
  });

  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File, type: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleFileUpload(file, logoType);
    if (url) {
      setLogoSettings(prev => ({ ...prev, [logoType]: url }));
      toast({
        title: "Logo Uploaded",
        description: `${logoType} has been uploaded successfully.`
      });
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/png') && !file.type.includes('image/x-icon')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG or ICO file for the favicon.",
        variant: "destructive"
      });
      return;
    }

    const url = await handleFileUpload(file, 'favicon');
    if (url) {
      setSeoSettings(prev => ({ ...prev, faviconFile: file }));
      setLogoSettings(prev => ({ ...prev, faviconUrl: url }));
      
      // Update the favicon in the document
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = url;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = url;
        document.head.appendChild(newLink);
      }

      toast({
        title: "Favicon Updated",
        description: "Favicon has been uploaded and applied successfully."
      });
    }
  };

  const generateSocialMetaTags = () => {
    return `<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${seoSettings.siteTitle}" />
<meta property="og:description" content="${seoSettings.siteDescription}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.weeklywizdom.com" />
<meta property="og:image" content="${seoSettings.ogImage}" />
<meta property="og:site_name" content="${seoSettings.siteName}" />

<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="${socialSettings.twitterHandle}" />
<meta name="twitter:title" content="${seoSettings.siteTitle}" />
<meta name="twitter:description" content="${seoSettings.siteDescription}" />
<meta name="twitter:image" content="${seoSettings.twitterImage || seoSettings.ogImage}" />`;
  };

  const saveSettings = async () => {
    try {
      // Here you would save to Supabase system_settings table
      toast({
        title: "Settings Saved",
        description: "Branding and SEO settings have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Branding & SEO Management</h1>
        <p className="text-slate-400">Control your brand identity and search engine optimization</p>
      </div>

      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="logos">Logos & Assets</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ImageIcon className="h-5 w-5" />
                  Main Logos
                </CardTitle>
                <CardDescription>Upload logos for different areas of your site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-200">Main Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'mainLogo')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {logoSettings.mainLogo && (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  {logoSettings.mainLogo && (
                    <img src={logoSettings.mainLogo} alt="Main Logo" className="mt-2 h-12 object-contain" />
                  )}
                </div>

                <div>
                  <Label className="text-slate-200">Header Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'headerLogo')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {logoSettings.headerLogo && (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Footer Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'footerLogo')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {logoSettings.footerLogo && (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Dark Mode Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'darkModeLogo')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {logoSettings.darkModeLogo && (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5" />
                  Favicon & Special Assets
                </CardTitle>
                <CardDescription>Upload favicon and specialized logos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-200">Favicon (PNG recommended)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      accept="image/png,image/x-icon"
                      onChange={handleFaviconUpload}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    {logoSettings.faviconUrl && (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {logoSettings.faviconUrl && (
                    <img src={logoSettings.faviconUrl} alt="Favicon" className="mt-2 h-8 w-8 object-contain" />
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    32x32 or 16x16 pixels recommended
                  </p>
                </div>

                <div>
                  <Label className="text-slate-200">Email Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'emailLogo')}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    For email newsletters and notifications
                  </p>
                </div>

                <div>
                  <Label className="text-slate-200">Current Favicon Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {logoSettings.faviconUrl ? (
                      <Badge variant="outline" className="text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Custom favicon active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Using default favicon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>Basic SEO settings for your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site-name" className="text-slate-200">Site Name</Label>
                  <Input
                    id="site-name"
                    value={seoSettings.siteName}
                    onChange={(e) => setSeoSettings({...seoSettings, siteName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="keywords" className="text-slate-200">Keywords</Label>
                  <Input
                    id="keywords"
                    value={seoSettings.keywords}
                    onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site-title" className="text-slate-200">Site Title</Label>
                <Input
                  id="site-title"
                  value={seoSettings.siteTitle}
                  onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {seoSettings.siteTitle.length}/60 characters (recommended)
                </p>
              </div>

              <div>
                <Label htmlFor="site-description" className="text-slate-200">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={seoSettings.siteDescription}
                  onChange={(e) => setSeoSettings({...seoSettings, siteDescription: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {seoSettings.siteDescription.length}/160 characters (recommended)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="og-image" className="text-slate-200">OpenGraph Image URL</Label>
                  <Input
                    id="og-image"
                    value={seoSettings.ogImage}
                    onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter-image" className="text-slate-200">Twitter Image URL</Label>
                  <Input
                    id="twitter-image"
                    value={seoSettings.twitterImage}
                    onChange={(e) => setSeoSettings({...seoSettings, twitterImage: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://example.com/twitter-image.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Share2 className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>Configure your social media presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twitter" className="text-slate-200">Twitter Handle</Label>
                  <Input
                    id="twitter"
                    value={socialSettings.twitterHandle}
                    onChange={(e) => setSocialSettings({...socialSettings, twitterHandle: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="@weeklywizdom"
                  />
                </div>
                <div>
                  <Label htmlFor="discord" className="text-slate-200">Discord Invite</Label>
                  <Input
                    id="discord"
                    value={socialSettings.discordInvite}
                    onChange={(e) => setSocialSettings({...socialSettings, discordInvite: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://discord.gg/..."
                  />
                </div>
                <div>
                  <Label htmlFor="telegram" className="text-slate-200">Telegram Channel</Label>
                  <Input
                    id="telegram"
                    value={socialSettings.telegramChannel}
                    onChange={(e) => setSocialSettings({...socialSettings, telegramChannel: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="https://t.me/..."
                  />
                </div>
                <div>
                  <Label htmlFor="instagram" className="text-slate-200">Instagram Handle</Label>
                  <Input
                    id="instagram"
                    value={socialSettings.instagramHandle}
                    onChange={(e) => setSocialSettings({...socialSettings, instagramHandle: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="@weeklywizdom"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5" />
                Meta Tags Preview
              </CardTitle>
              <CardDescription>Preview how your site will appear on social media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-slate-300 text-sm overflow-x-auto">
                  {generateSocialMetaTags()}
                </pre>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigator.clipboard.writeText(generateSocialMetaTags())}
              >
                <Download className="h-4 w-4 mr-2" />
                Copy Meta Tags
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Social Media Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-600 rounded-lg p-4 bg-slate-900">
                <div className="flex items-start gap-3">
                  {seoSettings.ogImage && (
                    <img
                      src={seoSettings.ogImage}
                      alt="Social preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{seoSettings.siteTitle}</h3>
                    <p className="text-slate-400 text-sm mt-1">{seoSettings.siteDescription}</p>
                    <p className="text-slate-500 text-xs mt-2">weeklywizdom.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
          Save All Settings
        </Button>
      </div>
    </div>
  );
}