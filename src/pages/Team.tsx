import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Footer from "@/components/Footer";

const Team = () => {
  const teamMembers = [
    {
      name: "Wizard of Soho",
      role: "Founder of Weekly Wizdom & Evinco",
      image: "/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png",
      twitter: "https://x.com/wizardofsoho",
      handle: "@Wizard",
      featured: true
    },
    {
      name: "Amy",
      role: "CEO of Weekly Wizdom",
      image: "/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png",
      twitter: "https://x.com/Amy_Answers",
      handle: "@Amy_Answers"
    },
    {
      name: "Ness",
      role: "Social Media Content / Admin",
      image: "/lovable-uploads/fbdb7812-98d7-48c6-948a-d552f8c743ed.png",
      twitter: "https://twitter.com/ness_envee",
      handle: "@ness_envee"
    }
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
            <a href="/">Back to Home</a>
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
            Meet the Weekly Wizdom
            <br />
            <span className="text-brand-primary">TEAM</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-4">
            Meet our team of <strong>sophisticated actors</strong> here every week to educate and provide you with 
            the most current information regarding the crypto market! We have developed a{" "}
            <em>one-stop shop</em> for everything you need to become a successful trader and investor in Web3.
          </p>
        </div>
      </section>

      {/* Featured Team Member */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {teamMembers
              .filter(member => member.featured)
              .map((member, index) => (
                <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="text-center py-12">
                      <div className="mb-8">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                          <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
                          {member.handle}
                        </Badge>
                      </div>
                      
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {member.name}
                      </h2>
                      <p className="text-xl text-gray-600 mb-6 font-semibold">
                        {member.role}
                      </p>
                      
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Follow on X
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {teamMembers
                .filter(member => !member.featured)
                .map((member, index) => (
                  <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8 text-center">
                      <div className="mb-6">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-blue-500 shadow-md">
                          <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                          {member.handle}
                        </Badge>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {member.name}
                      </h3>
                      <p className="text-gray-600 mb-4 font-medium">
                        {member.role}
                      </p>
                      
                      <Button asChild variant="outline" size="sm">
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Follow
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Team;