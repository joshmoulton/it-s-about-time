import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, MessageCircle } from "lucide-react";
import ContactFormModal from './ContactFormModal';
const ContactSection = () => {
  return <section id="contact" className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-merriweather text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            CONTACT US
          </h2>
          <p className="font-montserrat text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Want to reach out to us? Try one of the options below for the best results.
          </p>
        </div>

        {/* Contact Options */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Whop Support */}
            <Card className="p-6 bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="font-merriweather text-xl font-semibold text-foreground mb-2">Subscription Support</h3>
                  <p className="font-montserrat text-muted-foreground mb-4">
                    For inquiries regarding your subscription (billing, Telegram, and affiliate system), contact Whop Support.
                  </p>
                  <Button asChild className="bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] touch-manipulation min-h-[44px]">
                    <a href="https://whop.com/support" target="_blank" rel="noopener noreferrer">
                      Whop Support
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* General Support */}
            <Card className="p-6 bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="font-merriweather text-xl font-semibold text-foreground mb-2">General Support</h3>
                  <p className="font-montserrat text-muted-foreground mb-4">For any non-billing related problems, questions or Inquiries, just send us a message or contact us through telegram.</p>
                  <Button asChild className="w-full bg-brand-primary hover:bg-background hover:text-brand-primary text-white border-2 border-brand-primary transition-all duration-300 hover:scale-105 hover:translate-y-[-2px] touch-manipulation min-h-[44px]">
                    <a href="http://telegram.me/+MBaP1PvP7EMzMjVl" target="_blank" rel="noopener noreferrer">
                      Telegram Support
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>;
};
export default ContactSection;