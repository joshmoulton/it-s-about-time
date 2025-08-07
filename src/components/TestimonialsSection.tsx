import React from "react";
import { YouTubeLite } from "./YouTubeLite";

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
            
            {/* YouTube Video Container - Optimized Lazy Loading */}
            <YouTubeLite 
              videoId="uQc5bsEnaTI"
              title="Weekly Wizdom User Testimonial - See What Our Community Says"
              className="bg-black rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>;
};
export default TestimonialsSection;