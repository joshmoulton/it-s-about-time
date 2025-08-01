
import { TourStep } from './TourTooltip';
import { TourPlacement } from '@/hooks/useTourPositioning';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

export const getDashboardTourSteps = (subscriber: Subscriber | null): TourStep[] => {
  // Return empty array if no subscriber (user signed out)
  if (!subscriber) return [];
  
  const steps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Weekly Wizdom!',
    content: "Here you'll find everything you need for the optimal Weekly Wizdom experience. Let's take a look shall we? Just click next.",
    target: '[data-tour="main-navigation"]',
    placement: 'bottom' as TourPlacement,
    feature: '',
    benefit: 'Everything you need for successful trading is right at your fingertips - from real-time alerts to educational content.',
  },
  {
    id: 'newsletter-widget',
    title: 'Newsletters & Articles',
    content: "Each wednesday you'll receive our Newsletter, and throughout the week you'll get various valuable writeups. If you want to read them back, you can find them here.",
    target: '[data-tour="newsletter-widget"]',
    placement: 'left',
    feature: '📈 Expert Analysis',
    benefit: 'Make informed decisions with professional market research delivered weekly.',
  },
  {
    id: 'edge-widget',
    title: 'The Edge - Live Workshops',
    content: 'Every Wednesday at 2300 CEST / 5 PM ET our analysts hold a live workshop over on Telegram; covering live market analysis, trade ideas, and education',
    target: '[data-tour="edge-widget"]',
    placement: 'left',
    feature: '🎓 Trading Education',
    benefit: subscriber.subscription_tier === 'free'
      ? 'Upgrade to transform your trading knowledge with professional-grade education.'
      : 'Continuously improve your trading skills with structured learning paths.',
  },
  {
    id: 'degen-calls-widget',
    title: 'Degen Call Alerts',
    content: 'COMING SOON: Get instant notifications for short term, high-risk, high-reward calls from our market analysts',
    target: '[data-tour="degen-calls-widget"]',
    placement: 'left',
    feature: '🔥 Premium Calls',
    benefit: subscriber.subscription_tier === 'free'
      ? 'Unlock access to our most profitable trading opportunities.'
      : 'Diversify your portfolio with calculated high-reward positions.',
  },
  {
    id: 'alerts-widget',
    title: 'Wizdom Call Tracker',
    content: 'COMING SOON: Get notified of new trade ideas. You\'ll know in real-time what is going on with each trade. When it\'s updated, when it\'s invalidated and of course, when it\'s smashing targets',
    target: '[data-tour="alerts-widget"]',
    placement: 'left',
    feature: '⚡ Real-Time Signals',
    benefit: subscriber.subscription_tier === 'free'
      ? 'Never miss profitable opportunities - upgrade for instant alerts.'
      : 'Act on opportunities immediately with professional timing and analysis.',
  },
  {
    id: 'live-chat',
    title: 'Community Chats',
    content: 'Read messages from our telegram chats right here on the website. Get involved in the conversation by joining the Telegram. (link can be found on whop)',
    target: '[data-tour="live-chat"]',
    placement: 'left',
    feature: '🌐 Live Discussions',
    benefit: 'Get immediate feedback on trades, market conditions, and trading strategies from the community.',
    proTip: "You can join the conversation on telegram by clicking the 'Join Telegram' button",
  },
  {
    id: 'chat-highlights-sentiment',
    title: 'Highlights & Sentiment',
    content: 'Get a high-level overview on what\'s happening in the markets and the chats using our Chat Highlights and AI Sentiment tools.',
    target: '[data-tour="chat-highlights"],[data-tour="sentiment-tracker"]',
    placement: 'right',
    feature: '💡 Smart Filtering & Analysis',
    benefit: 'Focus on high-value conversations that can directly impact your trading decisions with AI-powered insights.',
  },
  {
    id: 'profile-menu',
    title: 'Your Profile',
    content: 'Here you\'ll find everything you need to manage your account',
    target: '[data-tour="profile-dropdown"]',
    placement: 'bottom',
    feature: '⚙️ Account Management',
    benefit: 'Everything is customizable to fit your trading style and preferences.',
  },
  {
    id: 'feedback-button',
    title: 'Share Your Feedback',
    content: 'IMPORTANT: The Wizdom Dashboard is currently in Beta. Expect bugs or missing features. If you run into any problems or have ideas for WW please use the Feedback button to share it!',
    target: '[data-tour="feedback-button"]',
    placement: 'bottom',
    feature: '💬 Your Voice Matters',
    benefit: 'Direct line to our team - your feedback shapes the future of the platform.',
  },
  ];
  
  return steps;
};

export const getContentTourSteps = (setActiveSection: (section: string) => void): TourStep[] => [
  {
    id: 'content-overview',
    title: 'Your Content Library',
    content: 'Welcome to your comprehensive content hub! Access newsletters, videos, courses, and articles all designed to accelerate your trading success.',
    target: '[data-tour="content-section"]',
    placement: 'bottom',
    action: () => setActiveSection('content'),
    feature: '📚 Complete Library',
    benefit: 'Everything you need to learn and grow as a trader in one organized location.',
  },
  {
    id: 'newsletter-content',
    title: 'Newsletter Archive',
    content: 'Browse our complete collection of weekly market analysis newsletters. Search by date, topic, or keyword to find specific insights.',
    target: '[data-tour="newsletter-content"]',
    placement: 'bottom',
    feature: '📄 Searchable Archive',
    benefit: 'Never lose track of important market insights - everything is searchable and organized.',
  },
  {
    id: 'edge-content',
    title: 'The Edge Video Library',
    content: 'Watch exclusive weekly live sessions, recorded market analysis, and educational content from our professional trading team.',
    target: '[data-tour="edge-content"]',
    placement: 'bottom',
    feature: '🎥 Premium Videos',
    benefit: 'Learn from real trading scenarios and market analysis from experienced professionals.',
  },
  {
    id: 'courses-content',
    title: 'Interactive Learning Courses',
    content: 'Take structured, step-by-step courses designed to build your trading skills progressively from beginner to advanced levels.',
    target: '[data-tour="courses-content"]',
    placement: 'bottom',
    feature: '🎓 Structured Learning',
    benefit: 'Build trading skills systematically with hands-on exercises and real-world applications.',
  },
  {
    id: 'articles-content',
    title: 'Expert Market Analysis',
    content: 'Read in-depth articles covering market trends, trading strategies, and educational content written by our expert analysis team.',
    target: '[data-tour="articles-content"]',
    placement: 'bottom',
    feature: '📈 Deep Insights',
    benefit: 'Stay informed with professional-grade market analysis and trading education.',
  },
];
