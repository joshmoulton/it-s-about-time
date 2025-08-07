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
  
  return (
    <section className="kol-testimonial-section pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-12 relative bg-brand-white">
      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">
                {/* Mobile/Tablet Layout: Stacked design */}
                <div className="block xl:hidden">
                  <div className="flex flex-col space-y-6">
                    {/* Quote */}
                    <blockquote className="font-montserrat text-sm sm:text-base md:text-lg lg:text-xl font-medium text-foreground leading-relaxed">
                      "{data.quote}"
                      {isMonkey && (
                        <>
                          {" "}
                          <span className="font-semibold">Signing up is a no-brainer</span>
                        </>
                      )}
                    </blockquote>

                    {/* Profile section - responsive horizontal layout */}
                    <div className="flex items-start gap-3 sm:gap-4 md:gap-6 bg-gradient-to-r from-brand-primary/5 to-transparent p-3 sm:p-4 md:p-6 rounded-lg">
                      {/* Profile Image */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden border-2 border-brand-primary/20 shadow-md flex-shrink-0">
                        <img 
                          src={data.image} 
                          alt={data.name} 
                          className="w-full h-full object-cover" 
                          style={{
                            objectPosition: data.objectPosition
                          }} 
                        />
                      </div>
                      
                      {/* Profile Info - Flexible text sizing */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-montserrat text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-brand-primary mb-1 break-words">
                          {data.name}
                        </h3>
                        <p className="font-montserrat text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed mb-1 sm:mb-2 break-words">
                          {data.mobileTitle || data.title}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-montserrat text-brand-primary text-xs sm:text-sm md:text-base break-all">
                            {data.handle}
                          </span>
                          <span className="font-montserrat text-muted-foreground text-xs sm:text-sm md:text-base">
                            {data.followers}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout: Side-by-side design */}
                <div className="hidden xl:block">
                  <div className="grid grid-cols-12 gap-8 xl:gap-12 2xl:gap-16 items-start">
                    {/* Left spacer */}
                    <div className="col-span-1"></div>
                    
                    {/* Profile Image - Desktop */}
                    <div className="col-span-3 flex justify-center xl:justify-start">
                      <div className="w-56 h-64 xl:w-64 xl:h-72 2xl:w-72 2xl:h-80 rounded-2xl overflow-hidden border-4 border-brand-primary/20 shadow-2xl">
                        <img 
                          src={data.image} 
                          alt={data.name} 
                          className="w-full h-full object-cover" 
                          style={{
                            objectPosition: data.objectPosition
                          }} 
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-7">
                      <blockquote className="font-montserrat text-lg xl:text-xl 2xl:text-2xl font-medium text-foreground leading-relaxed mb-6">
                        "{data.quote}"
                        {isMonkey && (
                          <>
                            {" "}
                            <span className="font-semibold">Signing up is a no-brainer.</span>
                          </>
                        )}
                      </blockquote>

                      {/* Desktop Profile Info */}
                      <div className="border-l-4 border-brand-primary pl-6">
                        <h3 className="font-montserrat text-xl xl:text-2xl 2xl:text-3xl font-semibold text-brand-primary mb-2">
                          {data.name}
                        </h3>
                        <p className="font-montserrat text-muted-foreground text-base xl:text-lg 2xl:text-xl break-words leading-relaxed mb-2">
                          {data.title}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-montserrat text-brand-primary text-sm xl:text-base 2xl:text-lg">
                            {data.handle}
                          </span>
                          <span className="font-montserrat text-muted-foreground text-sm xl:text-base 2xl:text-lg">
                            {data.followers}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right spacer */}
                    <div className="col-span-1"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default KOLTestimonialSection;