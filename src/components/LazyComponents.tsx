import { lazy } from 'react';

// Critical components - loaded immediately
export { default as Index } from '../pages/Index';

// Non-critical components - lazy loaded
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const Newsletters = lazy(() => import('../pages/Newsletters'));
export const Videos = lazy(() => import('../pages/Videos'));
export const Articles = lazy(() => import('../pages/Articles'));
export const SentimentAnalysis = lazy(() => import('../pages/SentimentAnalysis'));
export const Courses = lazy(() => import('../pages/Courses'));
export const ChatHighlights = lazy(() => import('../pages/ChatHighlights'));
export const UpgradePage = lazy(() => import('../pages/UpgradePage'));
export const AuthVerify = lazy(() => import('../pages/AuthVerify'));
export const Admin = lazy(() => import('../pages/Admin'));

// Dashboard components - lazy loaded (removed due to export issues)
// These will be loaded directly in their respective components

// Heavy components - lazy loaded
export const TestimonialsSection = lazy(() => import('./TestimonialsSection'));
export const PremiumPricingModal = lazy(() => import('./pricing/PricingModal').then(module => ({ default: module.PricingModal })));
export const WeeklyWizAlertsWidget = lazy(() => import('./dashboard/widgets/WeeklyWizAlertsWidget'));