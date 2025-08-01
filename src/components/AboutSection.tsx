import { Card, CardContent } from "@/components/ui/card";
const AboutSection = () => {
  return <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden" style={{
    backgroundColor: '#081426'
  }}>
      <div className="max-w-screen-xl mx-auto">
        {/* Mobile: Stacked layout */}
        <div className="lg:hidden">
          <div className="text-center mb-8">
            <h2 className="font-merriweather text-3xl md:text-5xl font-bold text-white mb-6">What makes us different?</h2>
            <div className="space-y-4 font-montserrat text-base leading-relaxed text-gray-300 max-w-4xl mx-auto">
              <p>Weekly Wizdom has brought together the best analysts in the industry.
From ex-wallstreet traders to the hottest talent among crypto natives.

              </p>
              <p>This is not some read-only signal group with faceless callers who don't care. Our analysts are a core part of the community. They guide our members every day, answering questions, and making sure everyone wins.</p>
            </div>
          </div>
          <div className="flex justify-center">
            <img src="/lovable-uploads/e64c88c4-9e6a-42f0-ad0b-898db7fff778.png" alt="Newsletter, Dashboard, Community" className="rounded-lg w-80 sm:w-96 h-auto" />
          </div>
        </div>

        {/* Desktop: Side by side layout */}
        <div className="hidden lg:flex lg:items-center lg:gap-12">
          {/* Text Content - Left side, right-aligned */}
          <div className="lg:w-1/2 text-right">
            <h2 className="font-merriweather text-5xl font-bold text-white mb-6">What makes us different?</h2>
            <div className="space-y-4 font-montserrat text-lg leading-relaxed text-gray-300">
              <p>Weekly Wizdom has brought together the best analysts in the industry.
From ex-wallstreet traders to the hottest talent among crypto natives.

              </p>
              <p>This is not some read-only signal group with faceless callers who don't care. Our analysts are a core part of the community. They guide our members every day, answering questions, and making sure everyone wins.</p>
            </div>
          </div>

          {/* Image - Right side */}
          <div className="lg:w-1/2 flex justify-end">
            <img src="/lovable-uploads/e64c88c4-9e6a-42f0-ad0b-898db7fff778.png" alt="Newsletter, Dashboard, Community" className="rounded-lg w-[500px] h-auto" />
          </div>
        </div>
      </div>
    </section>;
};
export default AboutSection;