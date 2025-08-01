import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  facebookPixelId: string;
  twitterCardType: string;
  ogImage: string;
  enableOG: boolean;
  enableTwitterCard: boolean;
  enableJsonLD: boolean;
  enableSitemap: boolean;
  enableRobots: boolean;
}

export function useSEOSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['seo-settings'],
    queryFn: async (): Promise<SEOSettings> => {
      console.log('📊 Fetching SEO settings...');
      
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'seo_configuration')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const settings = (data?.setting_value as any) || {};
        
        const seoSettings: SEOSettings = {
          siteTitle: settings.siteTitle || 'Premium Trading Community',
          siteDescription: settings.siteDescription || 'Elite trading insights, real-time market analysis, and premium investment strategies for serious traders.',
          keywords: settings.keywords || 'trading, investment, market analysis, premium trading community, financial insights',
          googleAnalyticsId: settings.googleAnalyticsId || '',
          googleSearchConsoleId: settings.googleSearchConsoleId || '',
          facebookPixelId: settings.facebookPixelId || '',
          twitterCardType: settings.twitterCardType || 'summary_large_image',
          ogImage: settings.ogImage || '/og-image.jpg',
          enableOG: settings.enableOG !== false,
          enableTwitterCard: settings.enableTwitterCard !== false,
          enableJsonLD: settings.enableJsonLD !== false,
          enableSitemap: settings.enableSitemap !== false,
          enableRobots: settings.enableRobots !== false,
        };

        console.log('✅ SEO settings loaded:', seoSettings);
        return seoSettings;
        
      } catch (error) {
        console.error('❌ SEO settings fetch error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<SEOSettings>) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'seo_configuration',
          setting_value: settings,
          description: 'SEO and site configuration settings'
        });

      if (error) throw error;
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast({
        title: "SEO Settings Saved",
        description: "Your SEO configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('❌ Failed to save SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    ...query,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
}