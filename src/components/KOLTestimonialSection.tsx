import { Card, CardContent } from "@/components/ui/card";
interface KOLTestimonialSectionProps {
  variant?: 'luca' | 'monkey' | 'custom';
}
const KOLTestimonialSection = ({
  variant = 'luca'
}: KOLTestimonialSectionProps) => {
  const isMonkey = variant === 'monkey';
  const testimonialData = {
    luca: {
      image: "/lovable-uploads/473aed7c-96ca-4f8c-a333-ae6069ad51a7.png",
      name: "Luca Netz",
      title: "CEO @PudgyPenguins & Co-founder @AbstractChain",
      mobileTitle: undefined,
      handle: "@LucaNetz",
      followers: "218K+ Followers",
      quote: "Weekly Wizdom keeps me informed of what goes on in all markets. It helps me make smarter decisions both for my personal finances as well as for my businesses.",
      objectPosition: '30% top'
    },
    monkey: {
      image: "/lovable-uploads/35f767ca-d900-4553-a3b6-7c61ece08643.png",
      name: "Keyboard Monkey",
      title: "Yeet.com Co-founder & Rekt Radio Co-host",
      mobileTitle: undefined,
      handle: "@KeyboardMonkey3",
      followers: "176K+",
      quote: "I've subscribed to Weekly Wizdom since launch. There genuinely isn't a better finance newsletter out there. They have a proven track record, and a community that's actually fun to be apart of.",
      objectPosition: 'center'
    },
    custom: {
      image: "/lovable-uploads/dfd23972-3459-43af-a027-33540a413222.png",
      name: "Farokh Sarmad",
      title: "President of DASTAN: @MyriadMarkets + @RugRadio + @DecryptMedia",
      mobileTitle: "President of DASTAN: Myriad, RugRadio & Decrypt",
      handle: "@farokh",
      followers: "445K+ Followers",
      quote: "Weekly Wizdom is the only subscription I've ever paid for in my life. One of the highest-signal groups out there. Try it for a month and judge for yourself!",
      objectPosition: 'center'
    }
  };
  const data = testimonialData[variant];
  return <section className="kol-testimonial-section pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-12 relative bg-brand-white flex items-center">
      
      <div className="max-w-screen-xl mx-auto relative z-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-4 sm:p-6 lg:p-8 flex justify-center">
              <div className="max-w-5xl">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                  {/* Invisible spacer for centering */}
                  <div className="hidden lg:block lg:col-span-1"></div>
                
                {/* Profile Image - Desktop */}
                <div className="hidden lg:block lg:col-span-3 flex justify-center lg:justify-start">
                  <div className="w-64 h-72 rounded-2xl overflow-hidden border-4 border-brand-primary/20 shadow-2xl">
                    <img src={data.image} alt={data.name} className="w-full h-full object-cover" style={{
                      objectPosition: data.objectPosition
                    }} />
                  </div>
                </div>

                {/* Content - Mobile Optimized */}
                <div className="lg:col-span-7">
                  {/* Mobile Layout: Compact horizontal design */}
                  <div className="lg:hidden">
                    {/* Quote positioned above profile for better flow */}
                    <blockquote className="font-montserrat text-base sm:text-lg font-medium text-foreground leading-relaxed mb-4">
                      "{data.quote}"
                      {isMonkey && <>
                          {" "}
                          <span className="font-semibold">Signing up is a no-brainer</span>
                        </>}
                    </blockquote>

                    {/* Profile section - horizontal layout */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-brand-primary/5 to-transparent p-3 rounded-lg">
                      {/* Profile Image - Mobile */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-brand-primary/20 shadow-md flex-shrink-0">
                        <img src={data.image} alt={data.name} className="w-full h-full object-cover" style={{
                          objectPosition: data.objectPosition
                        }} />
                      </div>
                      
                      {/* Profile Info - Compact */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-montserrat text-base font-semibold text-brand-primary truncate">{data.name}</h3>
                        <p className="font-montserrat text-muted-foreground text-xs leading-tight line-clamp-2">{data.mobileTitle || data.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-montserrat text-brand-primary text-xs">{data.handle}</span>
                          <span className="font-montserrat text-muted-foreground text-xs">{data.followers}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout - Original */}
                  <div className="hidden lg:block">
                    <blockquote className="font-montserrat text-lg sm:text-xl lg:text-2xl font-medium text-foreground leading-relaxed mb-4">
                      {data.quote}
                      {isMonkey && <>
                          {" "}
                          <span className="font-semibold">Signing up is a no-brainer.</span>
                        </>}
                    </blockquote>

                    {/* Desktop Profile Info */}
                    <div className="border-l-4 border-brand-primary pl-6">
                      <h3 className="font-montserrat text-xl lg:text-2xl font-semibold text-brand-primary mb-1">{data.name}</h3>
                      <p className="font-montserrat text-muted-foreground text-lg">{data.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-montserrat text-brand-primary text-base">{data.handle}</span>
                        <span className="font-montserrat text-muted-foreground text-base">{data.followers}</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default KOLTestimonialSection;