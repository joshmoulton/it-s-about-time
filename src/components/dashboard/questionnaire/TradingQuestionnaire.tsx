import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export interface QuestionnaireData {
  tradingConfidence: number;
  timezone: string;
  workStatus: string;
  marketExperienceCategory: string;
  portfolioSizeRange: string;
  learningMotivation: string;
  timeLearningTrading: string;
  biggestHurdle: string;
}

interface TradingQuestionnaireProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: QuestionnaireData) => void;
  initialData?: Partial<QuestionnaireData>;
}

const TOTAL_STEPS = 8;

const WORK_STATUS_OPTIONS = [
  '9-5 / Full time',
  'Self-Employed (Flexible Hours)', 
  'Part time',
  'Student (Part time or Unemployed)',
  'Average Crypto Investor (Unemployed)',
  'Retired',
  'Prefer Not to Say',
  'Other'
];

const MARKET_EXPERIENCE_OPTIONS = [
  'New to the markets <1 year',
  'Experienced 1-3 years', 
  'Veteran 3+ years'
];

const PORTFOLIO_SIZE_OPTIONS = [
  '<$1,000',
  '$1,000-$4,999',
  '$5,000-$24,999', 
  '$25,000-$99,999',
  '$100,000-$499,999',
  '$500,000+'
];

const TIMEZONE_OPTIONS = [
  'UTC-12:00 (Baker Island)',
  'UTC-11:00 (Samoa)',
  'UTC-10:00 (Hawaii)',
  'UTC-09:00 (Alaska)',
  'UTC-08:00 (Pacific)',
  'UTC-07:00 (Mountain)',
  'UTC-06:00 (Central)',
  'UTC-05:00 (Eastern)',
  'UTC-04:00 (Atlantic)',
  'UTC-03:00 (Argentina)',
  'UTC-02:00 (South Georgia)',
  'UTC-01:00 (Azores)',
  'UTC+00:00 (London)',
  'UTC+01:00 (Berlin)',
  'UTC+02:00 (Cairo)',
  'UTC+03:00 (Moscow)',
  'UTC+04:00 (Dubai)',
  'UTC+05:00 (Karachi)',
  'UTC+06:00 (Dhaka)',
  'UTC+07:00 (Bangkok)',
  'UTC+08:00 (Beijing)',
  'UTC+09:00 (Tokyo)',
  'UTC+10:00 (Sydney)',
  'UTC+11:00 (Solomon Islands)',
  'UTC+12:00 (New Zealand)'
];

export const TradingQuestionnaire: React.FC<TradingQuestionnaireProps> = ({
  open,
  onClose,
  onComplete,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireData>({
    tradingConfidence: initialData.tradingConfidence || 5,
    timezone: initialData.timezone || '',
    workStatus: initialData.workStatus || '',
    marketExperienceCategory: initialData.marketExperienceCategory || '',
    portfolioSizeRange: initialData.portfolioSizeRange || '',
    learningMotivation: initialData.learningMotivation || '',
    timeLearningTrading: initialData.timeLearningTrading || '',
    biggestHurdle: initialData.biggestHurdle || ''
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const updateField = (field: keyof QuestionnaireData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.tradingConfidence >= 1 && formData.tradingConfidence <= 10;
      case 2: return formData.timezone.length > 0;
      case 3: return formData.workStatus.length > 0;
      case 4: return formData.marketExperienceCategory.length > 0;
      case 5: return formData.portfolioSizeRange.length > 0;
      case 6: return formData.learningMotivation.trim().length > 0;
      case 7: return formData.timeLearningTrading.trim().length > 0;
      case 8: return formData.biggestHurdle.trim().length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">How confident are you in your trading?</h2>
              <p className="text-muted-foreground">Rate yourself on a scale of 1-10</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>I don't trust a single decision I make</span>
                <span>I decide where the markets go</span>
              </div>
              
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateField('tradingConfidence', num)}
                    className={`w-12 h-12 rounded-full border-2 text-sm font-medium transition-all
                      ${formData.tradingConfidence === num 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <span key={num} className="w-12 text-center">{num}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">What's your timezone?</h2>
              <p className="text-muted-foreground">Search or select your timezone</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => updateField('timezone', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your timezone..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">What's your work status?</h2>
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {WORK_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => updateField('workStatus', status)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all
                    ${formData.workStatus === status 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">How much experience do you have in the markets?</h2>
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {MARKET_EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp}
                  onClick={() => updateField('marketExperienceCategory', exp)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all
                    ${formData.marketExperienceCategory === exp 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">What is your Risk Capital / Portfolio Size?</h2>
              <p className="text-muted-foreground">
                How much money do you have set aside for investments & trading that you're okay with losing.
              </p>
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {PORTFOLIO_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => updateField('portfolioSizeRange', size)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all
                    ${formData.portfolioSizeRange === size 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Why do you want to learn how to trade?</h2>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-left">
                <label className="text-sm font-medium">Your answer</label>
              </div>
              <Textarea
                placeholder="Tell us what motivates you to learn trading..."
                value={formData.learningMotivation}
                onChange={(e) => updateField('learningMotivation', e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">How long have you been trying to learn trading?</h2>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-left">
                <label className="text-sm font-medium">Your answer</label>
              </div>
              <Textarea
                placeholder="Tell us about your trading learning journey..."
                value={formData.timeLearningTrading}
                onChange={(e) => updateField('timeLearningTrading', e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">What would you say has been your biggest hurdle so far?</h2>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-left">
                <label className="text-sm font-medium">Your answer</label>
              </div>
              <Textarea
                placeholder="Share your biggest challenge in learning trading..."
                value={formData.biggestHurdle}
                onChange={(e) => updateField('biggestHurdle', e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Complete Your Trading Profile</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <Progress value={progress} className="w-full" />
        </DialogHeader>

        <div className="flex-1 py-8 overflow-y-auto">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className={currentStep === TOTAL_STEPS ? "bg-primary" : ""}
          >
            {currentStep === TOTAL_STEPS ? 'Complete Profile' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};