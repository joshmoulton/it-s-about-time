
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  author_name: string;
  read_time_minutes: number;
}

interface ArticlesViewProps {
  articles: Article[] | undefined;
}

export function ArticlesView({ articles }: ArticlesViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Articles</h1>
        <p className="text-muted-foreground">In-depth market analysis articles</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles?.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{article.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {article.excerpt || 'Comprehensive market analysis and trading insights...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">By {article.author_name}</span>
                <span className="text-sm text-muted-foreground">{article.read_time_minutes} min read</span>
              </div>
              <Button size="sm" className="w-full">Read Article</Button>
            </CardContent>
          </Card>
        )) || (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No articles available for your subscription tier.</p>
          </div>
        )}
      </div>
    </div>
  );
}
