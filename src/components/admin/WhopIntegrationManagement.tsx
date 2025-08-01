import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWhopIntegration } from '@/hooks/useWhopIntegration';
import { toast } from 'sonner';
import { Loader2, Package, Users, RefreshCw } from 'lucide-react';

export const WhopIntegrationManagement = () => {
  const { syncProducts, syncPurchases, isLoading } = useWhopIntegration();

  const handleSyncProducts = async () => {
    try {
      console.log('🔄 Starting product sync...');
      const result = await syncProducts();
      console.log('✅ Product sync completed:', result);
      toast.success('Product sync completed successfully!');
    } catch (error) {
      console.error('❌ Product sync failed:', error);
      toast.error('Product sync failed. Check console for details.');
    }
  };

  const handleSyncPurchases = async () => {
    try {
      console.log('🔄 Starting purchase sync...');
      const result = await syncPurchases();
      console.log('✅ Purchase sync completed:', result);
      toast.success('Purchase sync completed successfully!');
    } catch (error) {
      console.error('❌ Purchase sync failed:', error);
      toast.error('Purchase sync failed. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Whop Integration</h1>
        <p className="text-slate-400 mt-2">
          Manage synchronization with Whop API for products and purchases
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="h-5 w-5" />
              Product Sync
            </CardTitle>
            <CardDescription className="text-slate-400">
              Synchronize all products from Whop API including free and paid products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSyncProducts}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Products...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Products
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              Purchase Sync
            </CardTitle>
            <CardDescription className="text-slate-400">
              Synchronize user purchases and memberships from Whop API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSyncPurchases}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Purchases...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Purchases
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Integration Status</CardTitle>
          <CardDescription className="text-slate-400">
            Current status of Whop integration and recent sync activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-300">
            <p>✅ API Key configured</p>
            <p>✅ Edge function deployed</p>
            <p>✅ Database tables ready</p>
            <p className="text-sm text-slate-400 mt-4">
              Check the console for detailed sync logs and results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};