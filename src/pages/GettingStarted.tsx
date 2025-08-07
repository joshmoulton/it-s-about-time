import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Download, Clock, Users, Mail, BarChart3, BookOpen, Video } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const GettingStarted = () => {
  const premiumFeatures = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Full Weekly Newsletter (No Previews)",
      description: "Get complete access to our comprehensive weekly market analysis"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Pro Recap & Education Emails",
      description: "Advanced educational content and market recaps"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Exclusive Monthly Reports",
      description: "In-depth monthly market reports and analysis"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "24/7 Telegram Community Access",
      description: "Round-the-clock access to our premium trading community"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Trade Alerts & Charts",
      description: "Live trading signals with detailed chart analysis"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Live Trading Workshops",
      description: "Interactive workshops with professional traders"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Direct Access to Technical Analysts",
      description: "One-on-one access to our team of expert analysts"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "VIP Notifications Dashboard (Never Miss a Move)",
      description: "Priority alerts and notifications for market opportunities"
    }
  ];

  const weeklyNewsletterFeatures = [
    "Market Sentiment and Portfolio Allocation by Wizard of Soho",
    "Equities News with trade ideas",
    "Technical Analysis on community-selected tickers with entry, stop-loss, and take-profit levels",
    "Web3, NFT and AI News",
    "Cognitive Corner provides tips on being a more successful trader"
  ];

  const monthlyReportFeatures = [
    "Housing Market updates",
    "Fixed Income Market updates",
    "Oil & Commodities updates"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <img 
            src="/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png" 
            alt="Weekly Wizdom" 
            className="h-12"
          />
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </nav>

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-brand-accent/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png" 
              alt="Weekly Wizdom Logo" 
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Getting <span className="text-blue-600">Started</span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8">
            What's included in your premium subscription?
          </h2>
        </div>
      </section>

      {/* Video Download Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <img 
                      src="/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png" 
                      alt="Weekly Wizdom" 
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Weekly Wizdom.mp4</h3>
                <p className="text-gray-600 mb-6">24.10 MB • MP4 File</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Premium Subscription Benefits
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {premiumFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Weekly Newsletter */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Clock className="mr-3 h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Weekly Newsletter</h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Published each Wednesday at 7:30 am EST</strong>
                  </p>
                  <p className="text-gray-700 mb-4">Each Publication Includes:</p>
                </div>
                
                <div className="space-y-3">
                  {weeklyNewsletterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Reports */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <BarChart3 className="mr-3 h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Monthly Reports</h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Published at the end of each month</strong>
                  </p>
                  <p className="text-gray-700 mb-4">Include:</p>
                </div>
                
                <div className="space-y-3">
                  {monthlyReportFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Telegram Channel */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Users className="mr-3 h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Telegram Channel</h3>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Our Super-Channel includes 10 Channels with everything you need! We've got you covered, 
                  from live newsletter updates to a lounge chat for casual banter!
                </p>
                
                <Button asChild className="bg-blue-500 hover:bg-blue-600">
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Join Telegram Channel
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* The Edge Workshops */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Video className="mr-3 h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">The Edge Workshops</h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    <strong>Every Wednesday at 5:00 pm EST</strong>
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      We teach you how to use various tools to set up your trades and give you an advantage in the market
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      We analyze community-selected tickers and provide detailed technical analysis
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GettingStarted;