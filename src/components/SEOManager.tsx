
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: any;
}

export function SEOManager({
  title = "Weekly Wizdom - Premium Trading Community",
  description = "Join the #1 cross-asset Newsletter & Community. Get notified as soon as our analysts share new ideas, get market analysis and updates every week, and track everything in our proprietary dashboard.",
  keywords = "trading, cryptocurrency, market analysis, investment, financial insights, trading signals, premium community",
  image = "/lovable-uploads/41a57ccc-0a24-4abd-89b1-3c41c3cc3d08.png",
  url,
  type = "website",
  structuredData
}: SEOProps) {
  const location = useLocation();
  const currentUrl = url || `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, useProperty = false) => {
      const selector = useProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (useProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Weekly Wizdom');
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Weekly Wizdom', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:site', '@weeklywizdom', true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Structured Data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Clean up function
    return () => {
      // We don't clean up meta tags as they should persist
      // until the next page load or component update
    };
  }, [title, description, keywords, image, currentUrl, type, structuredData]);

  return null; // This component doesn't render anything
}

// Helper function to generate structured data for different page types
export const generateStructuredData = (type: string, data: any) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type,
    "name": data.name || "Weekly Wizdom",
    "description": data.description || "Join the #1 cross-asset Newsletter & Community",
    "url": data.url || window.location.origin,
    "logo": {
      "@type": "ImageObject",
      "url": "/lovable-uploads/41a57ccc-0a24-4abd-89b1-3c41c3cc3d08.png"
    }
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseData,
        "sameAs": [
          "https://twitter.com/weeklywizdom",
          "https://linkedin.com/company/weeklywizdom"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "English"
        }
      };

    case 'Article':
      return {
        ...baseData,
        "@type": "Article",
        "headline": data.title,
        "author": {
          "@type": "Organization",
          "name": "Weekly Wizdom"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Weekly Wizdom",
          "logo": {
            "@type": "ImageObject",
            "url": "/lovable-uploads/41a57ccc-0a24-4abd-89b1-3c41c3cc3d08.png"
          }
        },
        "datePublished": data.datePublished,
        "dateModified": data.dateModified || data.datePublished,
        "image": data.image,
        "articleSection": data.category || "Trading"
      };

    case 'Course':
      return {
        ...baseData,
        "@type": "Course",
        "provider": {
          "@type": "Organization",
          "name": "Weekly Wizdom"
        },
        "educationalLevel": data.level || "Beginner",
        "courseCode": data.code,
        "hasCourseInstance": {
          "@type": "CourseInstance",
          "courseMode": "online",
          "instructor": {
            "@type": "Person",
            "name": data.instructor || "Weekly Wizdom Team"
          }
        }
      };

    case 'FAQPage':
      return {
        ...baseData,
        "@type": "FAQPage",
        "mainEntity": data.faqs?.map((faq: any) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        })) || []
      };

    case 'BreadcrumbList':
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": data.breadcrumbs?.map((item: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        })) || []
      };

    default:
      return baseData;
  }
};
