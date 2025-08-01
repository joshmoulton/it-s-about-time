import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPreferencesHelpers } from '@/utils/userPreferencesSync';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { TradingQuestionnaire, QuestionnaireData } from '../../questionnaire/TradingQuestionnaire';
import { supabase } from '@/integrations/supabase/client';
import { Bitcoin, TrendingUp, DollarSign, BarChart3, Zap } from 'lucide-react';

// Enhanced types for trading profile
interface TradingProfile {
  riskTolerance: 'low' | 'medium' | 'high';
  tradingExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredMarkets: string[];
  maxPositionSize: number;
  riskManagementStyle: 'conservative' | 'moderate' | 'aggressive';
  tradingStyle: 'scalping' | 'day' | 'swing' | 'position';
  notifications: {
    signals: boolean;
    marketAlerts: boolean;
    portfolioUpdates: boolean;
  };
  // New comprehensive questionnaire fields
  tradingConfidence?: number;
  timezone?: string;
  workStatus?: string;
  marketExperienceCategory?: string;
  portfolioSizeRange?: string;
  learningMotivation?: string;
  timeLearningTrading?: string;
  biggestHurdle?: string;
  primaryTradingGoal?: string;
  tradingFrequency?: string;
  maxLossPerTrade?: number;
  cryptoAllocation?: number;
}

interface TradingProfileFormProps {
  profile: TradingProfile;
  onChange: (updates: Partial<TradingProfile>) => void;
}

const TradingProfileForm: React.FC<TradingProfileFormProps> = ({ profile, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Risk Tolerance */}
      <div>
        <label className="text-sm font-medium mb-2 block">Risk Tolerance</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <Button
              key={level}
              variant={profile.riskTolerance === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ riskTolerance: level })}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Trading Experience */}
      <div>
        <label className="text-sm font-medium mb-2 block">Trading Experience</label>
        <div className="grid grid-cols-2 gap-2">
          {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((level) => (
            <Button
              key={level}
              variant={profile.tradingExperience === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ tradingExperience: level })}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Preferred Markets */}
      <div>
        <label className="text-sm font-medium mb-2 block">Preferred Markets</label>
        <div className="grid grid-cols-2 gap-2">
          {['crypto', 'stocks', 'forex', 'commodities'].map((market) => (
            <Button
              key={market}
              variant={profile.preferredMarkets.includes(market) ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newMarkets = profile.preferredMarkets.includes(market)
                  ? profile.preferredMarkets.filter(m => m !== market)
                  : [...profile.preferredMarkets, market];
                onChange({ preferredMarkets: newMarkets });
              }}
              className="capitalize"
            >
              {market}
            </Button>
          ))}
        </div>
      </div>

      {/* Max Position Size */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Max Position Size: {profile.maxPositionSize}%
        </label>
        <input
          type="range"
          min="1"
          max="25"
          value={profile.maxPositionSize}
          onChange={(e) => onChange({ maxPositionSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1%</span>
          <span>25%</span>
        </div>
      </div>

      {/* Risk Management Style */}
      <div>
        <label className="text-sm font-medium mb-2 block">Risk Management Style</label>
        <div className="grid grid-cols-3 gap-2">
          {(['conservative', 'moderate', 'aggressive'] as const).map((style) => (
            <Button
              key={style}
              variant={profile.riskManagementStyle === style ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ riskManagementStyle: style })}
              className="capitalize"
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      {/* Trading Style */}
      <div>
        <label className="text-sm font-medium mb-2 block">Trading Style</label>
        <div className="grid grid-cols-2 gap-2">
          {(['scalping', 'day', 'swing', 'position'] as const).map((style) => (
            <Button
              key={style}
              variant={profile.tradingStyle === style ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ tradingStyle: style })}
              className="capitalize"
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <label className="text-sm font-medium mb-2 block">Notification Preferences</label>
        <div className="space-y-2">
          {Object.entries(profile.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange({
                  notifications: {
                    ...profile.notifications,
                    [key]: e.target.checked
                  }
                })}
                className="rounded"
              />
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ClientSideTradingProfile = () => {
  const { currentUser } = useEnhancedAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Load profile from user preferences sync
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const loadedProfile = await UserPreferencesHelpers.getTradingProfile();
        setProfile(loadedProfile);
      } catch (error) {
        console.error('Failed to load trading profile:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load your trading profile",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await UserPreferencesHelpers.setTradingProfile(profile);
      
      toast({
        title: "Profile Saved",
        description: currentUser ? 
          "Your trading profile has been saved and synced to your account" :
          "Your trading profile has been saved locally"
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save trading profile:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your trading profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (updates: Partial<TradingProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const handleQuestionnaireComplete = async (questionnaireData: QuestionnaireData) => {
    if (!currentUser?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your questionnaire responses",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // For now, just update local state since table doesn't exist yet
      // This will be updated after the migration is approved
      const newProfile: TradingProfile = {
        ...profile!,
        tradingConfidence: questionnaireData.tradingConfidence,
        timezone: questionnaireData.timezone,
        workStatus: questionnaireData.workStatus,
        marketExperienceCategory: questionnaireData.marketExperienceCategory,
        learningMotivation: questionnaireData.learningMotivation,
        timeLearningTrading: questionnaireData.timeLearningTrading,
        biggestHurdle: questionnaireData.biggestHurdle,
        portfolioSizeRange: questionnaireData.portfolioSizeRange,
      };

      setProfile(newProfile);
      await UserPreferencesHelpers.setTradingProfile(newProfile);

      toast({
        title: "Questionnaire Complete!",
        description: "Your trading profile has been updated with your questionnaire responses"
      });

      setShowQuestionnaire(false);
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your questionnaire responses",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isProfileComplete = profile && 
    profile.tradingConfidence && 
    profile.timezone && 
    profile.workStatus && 
    profile.marketExperienceCategory;

  if (isLoading || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Profile</CardTitle>
          <CardDescription>Loading your trading preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketIcons = {
    cryptocurrency: Bitcoin,
    stocks: TrendingUp,
    forex: DollarSign,
    options: BarChart3,
    futures: Zap
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Complete Your Trading Profile
            {currentUser && (
              <Badge variant="outline" className="text-xs">
                Synced to Account
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Take our comprehensive questionnaire to get personalized recommendations
            {!currentUser && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400">
                Sign in to sync across devices
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isProfileComplete && (
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Complete Your Trading Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Take our comprehensive questionnaire to get personalized recommendations
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowQuestionnaire(true)} disabled={!currentUser}>
                Start Questionnaire
              </Button>
            </div>
          )}

          {isEditing ? (
            <>
              <TradingProfileForm profile={profile} onChange={updateProfile} />
              <div className="flex gap-2 pt-6">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* Experience & Background */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Experience & Background</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-muted-foreground">Experience Level</label>
                    <p className="font-medium capitalize">{profile.tradingExperience}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Portfolio Size Range</label>
                    <p className="font-medium">{profile.portfolioSizeRange || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Risk & Strategy */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-5 h-5 bg-amber-500 rounded-sm flex items-center justify-center">
                    <span className="text-xs text-white font-bold">⚠</span>
                  </div>
                  <h3 className="text-lg font-semibold">Risk & Strategy</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-muted-foreground">Risk Tolerance</label>
                    <p className="font-medium capitalize">{profile.riskTolerance}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Max Loss Per Trade (%)</label>
                    <p className="font-medium">{profile.maxLossPerTrade || profile.maxPositionSize}%</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground">Crypto Allocation (%)</label>
                    <p className="font-medium">{profile.cryptoAllocation || 20}%</p>
                  </div>
                </div>
              </div>

              {/* Preferred Markets */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">◯</span>
                  </div>
                  <h3 className="text-lg font-semibold">Preferred Markets</h3>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {['cryptocurrency', 'stocks', 'forex', 'options', 'futures'].map((market) => {
                    const Icon = marketIcons[market as keyof typeof marketIcons];
                    const isSelected = profile.preferredMarkets.includes(market);
                    return (
                      <div
                        key={market}
                        className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                          }`}
                      >
                        <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium capitalize ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {market}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Goals & Frequency */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Goals & Frequency</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-muted-foreground">Primary Trading Goal</label>
                    <p className="font-medium">{profile.primaryTradingGoal || 'Long-term Wealth Building'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Trading Frequency</label>
                    <p className="font-medium">{profile.tradingFrequency || 'Weekly'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuestionnaire(true)}
                  disabled={!currentUser}
                >
                  Update Questionnaire
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TradingQuestionnaire
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onComplete={handleQuestionnaireComplete}
        initialData={{
          tradingConfidence: profile?.tradingConfidence,
          timezone: profile?.timezone,
          workStatus: profile?.workStatus,
          marketExperienceCategory: profile?.marketExperienceCategory,
          portfolioSizeRange: profile?.portfolioSizeRange,
          learningMotivation: profile?.learningMotivation,
          timeLearningTrading: profile?.timeLearningTrading,
          biggestHurdle: profile?.biggestHurdle
        }}
      />
    </>
  );
};