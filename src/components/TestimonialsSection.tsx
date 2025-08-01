import React from 'react';

const TestimonialsSection: React.FC = () => {
  return <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-merriweather text-brand-navy mb-6">
            What Our Users Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Hear how we helped our members quit their jobs, find community, and become better traders.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
            
            {/* YouTube Video Container - Responsive */}
            <div className="video-container relative w-full pb-[56.25%] h-0 overflow-hidden bg-black">
              <iframe src="https://www.youtube.com/embed/uQc5bsEnaTI?autoplay=0&rel=0&modestbranding=1&playsinline=1" title="Weekly Wizdom User Testimonial" className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default TestimonialsSection;