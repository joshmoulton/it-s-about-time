import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WhopProduct {
  id: string;
  whop_product_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  metadata: any;
}

export const useWhopProducts = () => {
  const [products, setProducts] = useState<WhopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whop_products')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching Whop products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceCents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceCents / 100);
  };

  const getProductsByTier = () => {
    // Group products by their intended tier (based on metadata or price)
    const tiers = {
      free: products.filter(p => p.price_cents === 0),
      basic: products.filter(p => p.price_cents > 0 && p.price_cents < 5000), // < $50
      premium: products.filter(p => p.price_cents >= 5000), // >= $50
    };
    return tiers;
  };

  return {
    products,
    loading,
    error,
    formatPrice,
    getProductsByTier,
    refreshProducts: fetchProducts,
  };
};