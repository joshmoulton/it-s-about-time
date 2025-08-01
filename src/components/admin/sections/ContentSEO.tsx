
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Link, 
  Image, 
  TrendingUp, 
  Eye,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export function ContentSEO() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentSEO, setContentSEO] = useState({
    title: '',
    metaDescription: '',
    keywords: '',
    slug: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: ''
  });

  const [contentList] = useState([
    {
      id: 1,
      title: "Advanced Trading Strategies for 2024",
      type: "newsletter",
      status: "published",
      seoScore: 85,
      lastUpdated: "2024-01-15",
      views: 1250,
      keywords: ["trading", "strategies", "2024", "investment"]
    },
    {
      id: 2,
      title: "Market Analysis: Tech Stocks Outlook",
      type: "article",
      status: "draft",
      seoScore: 72,
      lastUpdated: "2024-01-14",
      views: 890,
      keywords: ["market analysis", "tech stocks", "outlook"]
    },
    {
      id: 3,
      title: "Risk Management Masterclass",
      type: "video",
      status: "published",
      seoScore: 91,
      lastUpdated: "2024-01-13",
      views: 2100,
      keywords: ["risk management", "trading", "masterclass"]
    }
  ]);

  const [seoAnalysis] = useState({
    titleLength: 45,
    descriptionLength: 148,
    keywordDensity: 2.1,
    readabilityScore: 78,
    internalLinks: 3,
    externalLinks: 2,
    imageOptimization: 85
  });

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getSEOScoreVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="p-8 space-y-6 bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white">Content SEO Management</h1>
        <p className="text-slate-400">Optimize your content for search engines and social sharing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Content Library
            </CardTitle>
            <CardDescription>Select content to optimize</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentList.map((content) => (
                <div 
                  key={content.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedContent?.id === content.id 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white text-sm">{content.title}</h4>
                    <Badge variant={getSEOScoreVariant(content.seoScore)} className="text-xs">
                      {content.seoScore}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <Badge variant="outline" className="capitalize">
                      {content.type}
                    </Badge>
                    <span className="text-slate-400">{content.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Editor */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5" />
              SEO Optimization
              {selectedContent && (
                <Badge variant="outline" className="ml-2">
                  {selectedContent.title}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedContent ? "Optimize the selected content" : "Select content from the library to start optimizing"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedContent ? (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                  <TabsTrigger value="basic">Basic SEO</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="seo-title" className="text-slate-200">SEO Title</Label>
                    <Input
                      id="seo-title"
                      value={contentSEO.title}
                      onChange={(e) => setContentSEO({...contentSEO, title: e.target.value})}
                      placeholder="Enter SEO optimized title..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {contentSEO.title.length}/60 characters
                      {contentSEO.title.length > 60 && (
                        <span className="text-red-400 ml-2">Too long</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta-desc" className="text-slate-200">Meta Description</Label>
                    <Textarea
                      id="meta-desc"
                      value={contentSEO.metaDescription}
                      onChange={(e) => setContentSEO({...contentSEO, metaDescription: e.target.value})}
                      placeholder="Write a compelling meta description..."
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={3}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {contentSEO.metaDescription.length}/160 characters
                      {contentSEO.metaDescription.length > 160 && (
                        <span className="text-red-400 ml-2">Too long</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="keywords" className="text-slate-200">Focus Keywords</Label>
                      <Input
                        id="keywords"
                        value={contentSEO.keywords}
                        onChange={(e) => setContentSEO({...contentSEO, keywords: e.target.value})}
                        placeholder="trading, investment, analysis"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug" className="text-slate-200">URL Slug</Label>
                      <Input
                        id="slug"
                        value={contentSEO.slug}
                        onChange={(e) => setContentSEO({...contentSEO, slug: e.target.value})}
                        placeholder="advanced-trading-strategies-2024"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="canonical" className="text-slate-200">Canonical URL</Label>
                    <Input
                      id="canonical"
                      value={contentSEO.canonicalUrl}
                      onChange={(e) => setContentSEO({...contentSEO, canonicalUrl: e.target.value})}
                      placeholder="https://yourdomain.com/content/..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">OpenGraph (Facebook, LinkedIn)</h4>
                    <div>
                      <Label htmlFor="og-title" className="text-slate-200">OG Title</Label>
                      <Input
                        id="og-title"
                        value={contentSEO.ogTitle}
                        onChange={(e) => setContentSEO({...contentSEO, ogTitle: e.target.value})}
                        placeholder="Social media optimized title"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="og-desc" className="text-slate-200">OG Description</Label>
                      <Textarea
                        id="og-desc"
                        value={contentSEO.ogDescription}
                        onChange={(e) => setContentSEO({...contentSEO, ogDescription: e.target.value})}
                        placeholder="Description for social sharing"
                        className="bg-slate-700 border-slate-600 text-white"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="og-image" className="text-slate-200">OG Image URL</Label>
                      <Input
                        id="og-image"
                        value={contentSEO.ogImage}
                        onChange={(e) => setContentSEO({...contentSEO, ogImage: e.target.value})}
                        placeholder="/images/og-content-image.jpg"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-600">
                    <h4 className="font-medium text-white">Twitter Cards</h4>
                    <div>
                      <Label htmlFor="twitter-title" className="text-slate-200">Twitter Title</Label>
                      <Input
                        id="twitter-title"
                        value={contentSEO.twitterTitle}
                        onChange={(e) => setContentSEO({...contentSEO, twitterTitle: e.target.value})}
                        placeholder="Twitter optimized title"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter-desc" className="text-slate-200">Twitter Description</Label>
                      <Textarea
                        id="twitter-desc"
                        value={contentSEO.twitterDescription}
                        onChange={(e) => setContentSEO({...contentSEO, twitterDescription: e.target.value})}
                        placeholder="Description for Twitter sharing"
                        className="bg-slate-700 border-slate-600 text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Title Length</span>
                          <Badge variant={seoAnalysis.titleLength <= 60 ? "default" : "destructive"}>
                            {seoAnalysis.titleLength}/60
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Meta Description</span>
                          <Badge variant={seoAnalysis.descriptionLength <= 160 ? "default" : "destructive"}>
                            {seoAnalysis.descriptionLength}/160
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Keyword Density</span>
                          <Badge variant={seoAnalysis.keywordDensity <= 3 ? "default" : "secondary"}>
                            {seoAnalysis.keywordDensity}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Readability</span>
                          <Badge variant={seoAnalysis.readabilityScore >= 70 ? "default" : "secondary"}>
                            {seoAnalysis.readabilityScore}/100
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Internal Links</span>
                          <Badge variant={seoAnalysis.internalLinks >= 2 ? "default" : "secondary"}>
                            {seoAnalysis.internalLinks}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200">Image Optimization</span>
                          <Badge variant={seoAnalysis.imageOptimization >= 80 ? "default" : "secondary"}>
                            {seoAnalysis.imageOptimization}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3 pt-4">
                    <h4 className="font-medium text-white">SEO Recommendations</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Title length is optimal</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300">Meta description is within limits</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                        <span className="text-slate-300">Consider adding more internal links</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <Eye className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-2xl font-bold text-white">{selectedContent.views}</div>
                        <div className="text-sm text-slate-400">Total Views</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold text-white">+12%</div>
                        <div className="text-sm text-slate-400">Growth Rate</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                        <div className="text-2xl font-bold text-white">7.2</div>
                        <div className="text-sm text-slate-400">Avg. Position</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-slate-700 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Search Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedContent.keywords.map((keyword, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-slate-600 rounded">
                            <span className="text-slate-200">{keyword}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">#12</Badge>
                              <Badge variant="secondary">+3</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select content from the library to start optimizing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedContent && (
        <div className="flex justify-end gap-4">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button>
            Save SEO Settings
          </Button>
        </div>
      )}
    </div>
  );
}
