import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
import ContactFormModal from './ContactFormModal';
import { useToggleHover } from "@/hooks/useToggleHover";

const FAQSection = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Getting Started");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const { getToggleHoverProps } = useToggleHover();

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I subscribe to Weekly Wizdom?",
          answer: "Just click on 'Get Started' then select the premium plan. Choose your payment method and term and go through the payment process. We accept Credit Card as well as Crypto payments. Once paid you'll get a welcome email and you'll be able to login using your email to access everything we have to offer!"
        },
        {
          question: "How do I pay with crypto?",
          answer: (
            <span>
              We accept crypto for monthly, quarterly, and yearly subscriptions! Click the link{" "}
              <a 
                href="https://whop.com/weeklywizdom?pass=prod_67ydSm4LSQFQ9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline font-medium"
              >
                HERE
              </a>
              . Select your subscription and pay. Receive immediate access to all the perks of our community!
            </span>
          )
        },
        {
          question: "Are you having trouble finding/receiving emails?",
          answer: "Ensure your subscription is current, check your spam, and ensure your inbox has space to receive emails. If you have trouble, contact our Support Chat on Telegram for help. Allow 24 hours for a response."
        }
      ]
    },
    {
      category: "Features & Services",
      questions: [
        {
          question: "What types of trading signals do you provide?",
          answer: "We provide signals for stocks, options, cryptocurrency, forex, and futures. Our signals include entry points, stop losses, take profit levels, and detailed market analysis. We also offer swing trading and day trading opportunities across different timeframes."
        },
        {
          question: "How often do you send trading alerts?",
          answer: "The exact number changes depending on market conditions. Our analysts work to make each trade a winner in the long run, but that also means that in poor or uncertain market conditions, being on the sidelines can be the best bet. You can expect at least 5 trade ideas each week, but often times it's a lot more!"
        },
        {
          question: "Do you provide educational content?",
          answer: "Absolutely! Education is a core part of our mission. We offer weekly market analysis, trading tutorials, risk management guides, and live trading sessions. Premium members get access to our exclusive webinar series."
        }
      ]
    },
    {
      category: "Billing & Support",
      questions: [
        {
          question: "Billing issues?",
          answer: "If you have been charged twice or have any payment queries, visit https://whop.com/support."
        },
        {
          question: "I keep getting the \"Subscribe\" page and can't log in. What do I do?",
          answer: "If your account takes you for a loop, try clearing your cache and cookies and logging in again. If the issue persists, you can follow the instructions on the following website to whitelist Weekly Wizdom in your web browser: https://blog.beehiiv.com/p/whitelist-newsletter-senders-popular-email-services"
        },
        {
          question: "Need help with something else?",
          answer: (
            <div className="space-y-4">
              <p>For all non-subscription related questions, email us at support@wizardofsoho.com or reach us through the options below.</p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open("https://telegram.me/+MBaP1PvP7EMzMjVl", "_blank")}
                  className="bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 touch-manipulation min-h-[44px]"
                >
                  Telegram Support
                </Button>
                <ContactFormModal 
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 touch-manipulation min-h-[44px]"
                    >
                      Contact Us
                    </Button>
                  }
                />
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const selectedCategoryData = faqs.find(cat => cat.category === selectedCategory);
  const currentQuestions = selectedCategoryData?.questions || [];

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden" style={{ backgroundColor: '#182152' }}>

      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-merriweather text-4xl md:text-5xl font-bold mb-6" style={{ color: '#F5F7FA' }}>
            Frequently Asked Questions
          </h2>
          <p className="font-montserrat text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#DDDEE1' }}>
            Everything you need to know about Weekly Wizdom. Can't find the answer you're looking for? 
            Feel free to reach out to our support team.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
           {/* FAQ Categories - Responsive Stack Layout */}
           <div className="flex justify-center mb-12 px-2">
              <div className="flex flex-col sm:flex-row sm:inline-flex rounded-full bg-gray-200 w-full sm:w-auto max-w-full overflow-hidden">
                {faqs.map((category, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`transition-all duration-300 rounded-none sm:rounded-full px-3 sm:px-4 py-2 h-auto relative text-sm sm:text-base w-full sm:w-auto flex-1 ${
                      selectedCategory === category.category 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedCategory(category.category);
                      setOpenFAQ(0); // Reset to first question when switching categories
                    }}
                  >
                    {category.category}
                  </Button>
                ))}
             </div>
          </div>

          {/* FAQ Accordion for Selected Category */}
          <div className="space-y-4">
            {currentQuestions.map((faq, index) => (
              <Card 
                key={index}
                className="group border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden bg-white rounded-2xl"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 touch-manipulation min-h-[44px]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-primary/20 transition-colors duration-300">
                          {selectedCategory}
                        </Badge>
                      </div>
                      <h3 className="font-montserrat font-semibold text-foreground text-lg leading-relaxed transition-colors duration-300">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-muted-foreground transition-all duration-300 ml-4 ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {openFAQ === index && (
                    <div className="px-6 pb-6 animate-fade-in">
                      <div className="border-t border-border pt-2">
                        <div className="font-montserrat text-foreground leading-relaxed">
                          {typeof faq.answer === 'string' ? faq.answer : faq.answer}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQSection;
