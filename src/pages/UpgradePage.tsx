import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown } from 'lucide-react';
import PremiumPricingModal from '@/components/PremiumPricingModal';
import { useIsMobile } from '@/hooks/use-mobile';
export default function UpgradePage() {
  const navigate = useNavigate();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  // Open modal only when ?open=1 is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isOpen = params.get('open') === '1' || params.get('open') === 'true';
    setShowPricingModal(isOpen && !isMobile);
  }, [location.search, isMobile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
            <h1 className="text-xl font-bold text-white">Upgrade to Premium</h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full mb-6 shadow-2xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Unlock the Full Power of
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Weekly Wizdom
              </span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Join thousands of traders who've upgraded to premium for exclusive trading signals, 
              real-time alerts, and advanced market insights that give them the edge in every trade.
            </p>

            <Button
              onClick={() => { if (isMobile) { setShowPricingModal(true); } else { navigate('/pricing?open=1'); } }}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold rounded-2xl h-16 px-12 text-lg shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-yellow-500/25 border border-yellow-400/30"
            >
              <Crown className="w-6 h-6 mr-3" />
              View Pricing Plans
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: "Real-Time Alerts",
                description: "Never miss a profitable trade with instant notifications and signals.",
                icon: "🚨",
                gradient: "from-green-500 to-emerald-600"
              },
              {
                title: "Premium Newsletter",
                description: "Full access to weekly market analysis and exclusive reports.",
                icon: "📧",
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                title: "Community Access",
                description: "24/7 access to our private Telegram community of traders.",
                icon: "💬",
                gradient: "from-purple-500 to-violet-600"
              },
              {
                title: "Live Workshops",
                description: "Exclusive access to live trading education sessions.",
                icon: "📹",
                gradient: "from-teal-500 to-cyan-600"
              },
              {
                title: "AI Sentiment Analysis",
                description: "Advanced market sentiment tracking and analysis tools.",
                icon: "🧠",
                gradient: "from-pink-500 to-rose-600"
              },
              {
                title: "Expert Support",
                description: "Direct access to our team of professional analysts.",
                icon: "👥",
                gradient: "from-orange-500 to-red-600"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-2xl mb-4 mx-auto shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Winning?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Don't let another profitable opportunity slip away. Join the ranks of successful traders 
              who rely on Weekly Wizdom for their edge in the markets.
            </p>
            <Button
              onClick={() => { if (isMobile) { setShowPricingModal(true); } else { navigate('/pricing?open=1'); } }}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold rounded-2xl h-14 px-10 text-lg shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Crown className="w-5 h-5 mr-3" />
              Choose Your Plan
            </Button>
          </div>
        </div>
      </main>

      {/* Pricing Modal */}
      <PremiumPricingModal 
        open={showPricingModal} 
        onOpenChange={(open) => {
          setShowPricingModal(open);
          if (!open) {
            navigate('/pricing', { replace: true });
          }
        }} 
      />
    </div>
  );
}