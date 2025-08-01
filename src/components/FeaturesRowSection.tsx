import { Card, CardContent } from "@/components/ui/card";
import { Mail, Bell, Users, BookOpen } from "lucide-react";
import { useCardHover } from "@/hooks/useCardHover";

const FeaturesRowSection = () => {
  const { getHoverProps, isHovered } = useCardHover();
  
  const features = [{
    icon: Mail,
    label: "Stay in the Loop",
    description: "Our weekly newsletters breakdown complex markets into simple trades"
  }, {
    icon: Bell,
    label: "Never Miss a Trade",
    description: "Our dashboard keeps you notified of any new trade opportunities"
  }, {
    icon: Users,
    label: "Join a Thriving Community",
    description: "Trade alongside real traders and expert analysts in our active community."
  }];

  const getCardStyle = (index: number) => {
    if (isHovered(index)) {
      return {
        transform: `scale(1.05)`,
        transition: 'transform 0.2s ease-out',
        animationDelay: `${index * 0.1}s`
      };
    }
    return {
      animationDelay: `${index * 0.1}s`
    };
  };
  return <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 relative" style={{
    backgroundColor: '#182152'
  }}>
      
      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-merriweather text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4 sm:px-0" style={{
          color: '#F5F7FA'
        }}>What We Offer</h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4 sm:px-0" style={{
          color: '#DDDEE1'
        }}>Everything you need to make informed trading & investment decisions and stay ahead of the market.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-start">
          {/* Features Column */}
          <div className="flex flex-col gap-4 sm:gap-4">
            {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return <Card key={index} className="group transition-all duration-300 hover:shadow-lg border bg-card animate-fade-in rounded-2xl" style={getCardStyle(index)} {...getHoverProps(index)}>
                  <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-brand-primary transition-colors duration-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-bold mb-1 text-foreground transition-colors duration-300">{feature.label}</h3>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>

          {/* Copy Text Block */}
          <div className="lg:pl-8 mt-8 lg:mt-0">
            <div className="prose prose-lg max-w-none px-4 sm:px-0">
              <h3 className="font-merriweather text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{
              color: '#F5F7FA'
            }}>More than just trading signals.</h3>
              <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4" style={{
              color: '#DDDEE1'
            }}>Every week our professional traders send clear, easy-to-follow trade setups for crypto, stocks, and more. You'll get instant alerts whenever we spot new trades, and our 'Wizdom Dashboard' makes it easy to track everything and learn at your own pace.</p>
              
              <p className="text-sm sm:text-base leading-relaxed" style={{
              color: '#DDDEE1'
            }}>You don't need to spend hours researching or staring at charts. We do the heavy lifting so you can focus on taking trades, building your skills and reaching your goals.</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default FeaturesRowSection;