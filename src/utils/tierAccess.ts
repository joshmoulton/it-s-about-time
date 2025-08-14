
interface Subscriber {
  subscription_tier: 'free' | 'paid' | 'premium';
}

export class TierAccessManager {
  private static getTierLevel(tier: string): number {
    const levels = { free: 0, paid: 1, premium: 2 };
    return levels[tier as keyof typeof levels] || 0;
  }

  static canAccess(subscriber: Subscriber | null, requiredTier: 'free' | 'paid' | 'premium'): boolean {
    // If no subscriber, default to free tier (no access to paid features)
    if (!subscriber) {
      return requiredTier === 'free';
    }

    const userLevel = this.getTierLevel(subscriber.subscription_tier || 'free');
    const requiredLevel = this.getTierLevel(requiredTier);
    
    return userLevel >= requiredLevel;
  }

  static shouldShowFreemiumOverlay(subscriber: Subscriber | null, widgetType?: string): boolean {
    // Newsletter is always free - no overlay
    if (widgetType === 'newsletter') {
      return false;
    }

    // Premium users get full access like admins (no overlay)
    if (subscriber?.subscription_tier === 'premium') {
      return false;
    }

    // Check magic link premium access
    const authMethod = localStorage.getItem('auth_method');
    const authTier = localStorage.getItem('auth_tier');
    
    if (authMethod === 'magic_link' && (authTier === 'premium' || authTier === 'paid')) {
      return false;
    }

    // Show overlay for free users or no subscriber
    return !subscriber || 
           !subscriber.subscription_tier || 
           subscriber.subscription_tier === 'free';
  }

  static getChatLimits(subscriber: Subscriber) {
    switch (subscriber.subscription_tier) {
      case 'premium':
        return {
          messageHistory: 1000,
          canSendMessages: true,
          canExport: true,
          realTimeUpdates: true,
          highlightAccess: 'full'
        };
      case 'paid':
        return {
          messageHistory: 100,
          canSendMessages: true,
          canExport: false,
          realTimeUpdates: true,
          highlightAccess: 'limited'
        };
      default:
        return {
          messageHistory: 10,
          canSendMessages: false,
          canExport: false,
          realTimeUpdates: false,
          highlightAccess: 'preview'
        };
    }
  }

  static getFeatureAccess(subscriber: Subscriber) {
    const tier = subscriber.subscription_tier;
    return {
      // Newsletter is always accessible
      newsletter: true,
      fullChatHistory: tier === 'premium',
      advancedFiltering: tier !== 'free',
      topicSelection: tier !== 'free',
      sentimentAnalysis: tier === 'premium',
      alertSystem: tier !== 'free',
      exportCapabilities: tier === 'premium',
      prioritySupport: tier === 'premium'
    };
  }

  static getWidgetAccess(subscriber: Subscriber) {
    const tier = subscriber.subscription_tier;
    return {
      // Newsletter is always fully accessible
      newsletter: { access: true, showBlurred: false },
      
      // Widgets that free users can see but blurred
      chatHighlights: { access: tier !== 'free', showBlurred: tier === 'free' },
      sentiment: { access: tier !== 'free', showBlurred: tier === 'free' },
      alerts: { access: tier !== 'free', showBlurred: tier === 'free' },
      edge: { access: tier !== 'free', showBlurred: tier === 'free' },
      degenCalls: { access: tier !== 'free', showBlurred: tier === 'free' },
      chat: { access: tier !== 'free', showBlurred: tier === 'free' },
      
      // Premium-only features
      exportData: tier === 'premium',
      advancedAnalytics: tier === 'premium',
      priorityAlerts: tier === 'premium'
    };
  }

  static shouldBlurWidget(subscriber: Subscriber, widgetType: string): boolean {
    // Newsletter is never blurred
    if (widgetType === 'newsletter') return false;
    
    const widgetAccess = this.getWidgetAccess(subscriber);
    const widget = widgetAccess[widgetType as keyof typeof widgetAccess];
    return typeof widget === 'object' && widget.showBlurred && !widget.access;
  }
}
