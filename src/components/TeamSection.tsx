import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, Mail, ExternalLink } from "lucide-react";
import { useCardHover } from "@/hooks/useCardHover";

const TeamSection = () => {
  const { getHoverProps, isHovered } = useCardHover();

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Lead Trading Analyst",
      expertise: "Options & Crypto",
      experience: "8+ years",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: "Former Wall Street analyst with expertise in algorithmic trading and risk management. Specializes in high-frequency crypto strategies.",
      achievements: ["CMT Certified", "Top 1% Returns 2023", "Featured in Forbes"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "alex@weeklywizdom.com"
      }
    },
    {
      name: "Sarah Rodriguez",
      role: "Senior Research Director",
      expertise: "Fundamental Analysis",
      experience: "12+ years",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face",
      bio: "PhD in Economics with deep experience in market microstructure and behavioral finance. Leads our research initiatives.",
      achievements: ["PhD Economics", "CFA Charter", "Published Researcher"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "sarah@weeklywizdom.com"
      }
    },
    {
      name: "Marcus Thompson",
      role: "Technology & Strategy",
      expertise: "FinTech Innovation",
      experience: "10+ years",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      bio: "Former Google engineer turned trader. Builds the tech infrastructure that powers our analysis and automated systems.",
      achievements: ["Ex-Google", "Machine Learning Expert", "Patent Holder"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "marcus@weeklywizdom.com"
      }
    },
    {
      name: "Elena Vasquez",
      role: "Risk Management Lead",
      expertise: "Portfolio Optimization",
      experience: "9+ years",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      bio: "Expert in quantitative risk modeling and portfolio construction. Ensures all our strategies maintain optimal risk-adjusted returns.",
      achievements: ["FRM Certified", "Quant Background", "Risk Expert"],
      social: {
        linkedin: "#",
        twitter: "#",
        email: "elena@weeklywizdom.com"
      }
    }
  ];

  return (
    <section id="team" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-brand-white/80 text-primary border-primary/20">
            Our Team
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-navy mb-6">
            Meet the Experts Behind
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Success
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our team combines decades of Wall Street experience with cutting-edge technology to deliver 
            unparalleled trading insights and strategies.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
          {teamMembers.map((member, index) => (
            <Card 
              key={index}
              className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-brand-white/80 backdrop-blur-sm ${
                isHovered(index) ? 'scale-105 z-10' : ''
              }`}
              {...getHoverProps(index)}
            >
              <CardContent className="p-0">
                 {/* Image Container */}
                 <div className="relative overflow-hidden">
                   <img 
                     src={member.image}
                     alt={member.name}
                     className="w-full h-64 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                   />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Social Links */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-brand-white/90 hover:bg-brand-white">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-brand-white/90 hover:bg-brand-white">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-brand-white/90 hover:bg-brand-white">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                 {/* Content */}
                 <div className="p-4 sm:p-6">
                   <h3 className="text-lg sm:text-xl font-bold text-brand-navy mb-1">{member.name}</h3>
                   <p className="text-primary font-medium mb-2 text-sm sm:text-base">{member.role}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {member.expertise}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {member.experience}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {member.bio}
                  </p>

                  {/* Achievements */}
                  <div className="space-y-1">
                    {member.achievements.map((achievement, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {achievement}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-brand-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-brand-navy mb-4">
              Want to Work With Our Team?
            </h3>
            <p className="text-gray-600 mb-6">
              Get direct access to our experts through our premium consultation services.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              Schedule a Consultation
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;