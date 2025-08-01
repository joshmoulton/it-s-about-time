
import React from 'react';
import { AnalyticsOverview } from '../analytics/AnalyticsOverview';
import { RealUserSegmentationChart } from '../analytics/RealUserSegmentationChart';
import { EnhancedConversionFunnel } from '../analytics/EnhancedConversionFunnel';

export function Analytics() {
  return (
    <div className="space-y-8 p-6 bg-slate-900 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h1>
        <p className="text-slate-400">Comprehensive platform analytics and user insights</p>
      </div>

      {/* Analytics Overview */}
      <AnalyticsOverview />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealUserSegmentationChart />
        <EnhancedConversionFunnel />
      </div>
    </div>
  );
}
