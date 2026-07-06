import React, { useEffect } from 'react';
import { Game, AppSettings } from '../lib/store';

interface SEOHeadProps {
  game: Game | null;
  settings: AppSettings | null;
}

export function SEOHead({ game, settings }: SEOHeadProps) {
  useEffect(() => {
    // 1. Determine base properties
    const siteName = settings?.siteName || "Play Zone 777";
    const baseTitle = settings?.seoWebsiteTitle || "Play Zone 777 - Premium APK Download Portal & Welcome Bonus";
    const baseDesc = settings?.seoMetaDescription || "Get the latest high-rated Rummy, Slots, and Casino APK game downloads with exclusive signup bonuses, instant withdraw support, and safe secure links.";
    const baseKeywords = settings?.seoMetaKeywords || "play zone 777, rummy bonus, slots apk, free signup bonus, cash rummy app, play777, top rummy games";
    const canonicalBase = settings?.seoCanonicalUrl || window.location.origin;
    const author = settings?.seoAuthor || "Play Zone 777 Team";
    const robots = settings?.seoRobotsMeta || "index, follow";
    const themeColor = settings?.seoThemeColor || "#05130b";
    const lang = settings?.seoLanguage || "en";

    let title = baseTitle;
    let description = baseDesc;
    let canonical = canonicalBase;
    let keywords = baseKeywords;
    let ogTitle = settings?.seoOgTitle || baseTitle;
    let ogDesc = settings?.seoOgDescription || baseDesc;
    let ogImage = settings?.seoOgImage || settings?.logoUrl || `${window.location.origin}/logo.png`;
    const twitterCard = settings?.seoTwitterCard || "summary_large_image";

    // 2. Override if on Details page
    if (game) {
      const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      title = `${game.title} - Download APK & Claim ${game.bonus} Bonus | ${siteName}`;
      description = `Get the official ${game.title} APK download. Claim your exclusive ${game.bonus} Signup Welcome Bonus. Rated ${game.rating || '4.9'}/5 stars. Safe, secure, and fast direct installation.`;
      keywords = `${game.title.toLowerCase()}, ${game.title.toLowerCase()} apk, download ${game.title.toLowerCase()}, ${game.title.toLowerCase()} bonus, ${game.category.toLowerCase()} games, verified rummy app`;
      canonical = `${canonicalBase}?app=${slug}`;
      ogTitle = `${game.title} APK Download - Welcome Bonus ${game.bonus}`;
      ogDesc = `Install ${game.title} directly using Play Zone 777's verified link and claim an instant ${game.bonus} Welcome Reward on registration. Scan cleared safe app.`;
      if (game.logoUrl) {
        ogImage = game.logoUrl;
      }
    }

    // 3. Update standard head tags
    document.title = title;
    
    // Set html lang attribute
    document.documentElement.lang = lang;

    // Helper to create or update meta tag
    const setMetaTag = (nameAttr: 'name' | 'property', value: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${value}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to create or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Standard SEO Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', author);
    setMetaTag('name', 'robots', robots);
    setMetaTag('name', 'theme-color', themeColor);
    setLinkTag('canonical', canonical);

    // Favicon override if configured
    if (settings?.faviconUrl) {
      setLinkTag('icon', settings.faviconUrl);
      setLinkTag('shortcut icon', settings.faviconUrl);
    }

    // Search Console Verification Tags
    if (settings?.seoVerificationGoogle) {
      setMetaTag('name', 'google-site-verification', settings.seoVerificationGoogle);
    }
    if (settings?.seoVerificationBing) {
      setMetaTag('name', 'msvalidate.01', settings.seoVerificationBing);
    }
    if (settings?.seoVerificationYandex) {
      setMetaTag('name', 'yandex-verification', settings.seoVerificationYandex);
    }

    // Open Graph Social Tags
    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDesc);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag('property', 'og:site_name', siteName);
    setMetaTag('property', 'og:type', game ? 'software' : 'website');

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', ogTitle);
    setMetaTag('name', 'twitter:description', ogDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // 4. Structured JSON-LD Schema generation
    const schemas: any[] = [];

    // General Organization & Website Schemas (Always present for crawl depth)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${canonicalBase}/#organization`,
      "name": siteName,
      "url": canonicalBase,
      "logo": settings?.logoUrl || `${window.location.origin}/logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": settings?.adminEmail || "support@play777.in"
      }
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${canonicalBase}/#website`,
      "url": canonicalBase,
      "name": siteName,
      "description": baseDesc,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${canonicalBase}?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    });

    // Dynamic Breadcrumb Schema
    const breadcrumbList: any = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": canonicalBase
        }
      ]
    };

    if (game) {
      const categorySlug = `/?category=${game.category}`;
      const gameSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      breadcrumbList.itemListElement.push(
        {
          "@type": "ListItem",
          "position": 2,
          "name": game.category,
          "item": `${canonicalBase}${categorySlug}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": game.title,
          "item": `${canonicalBase}?app=${gameSlug}`
        }
      );
    }
    schemas.push(breadcrumbList);

    // SoftwareApplication and Rich Snippet Schema
    if (game) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": game.title,
        "operatingSystem": "Android",
        "applicationCategory": "GameApplication",
        "downloadUrl": game.apkUrl || game.link || canonicalBase,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": game.rating || "4.9",
          "reviewCount": "2450"
        },
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "INR",
          "description": `Get ${game.bonus} Welcome Registration Bonus`
        }
      });

      // FAQ Schema (Details view)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How to secure download ${game.title} APK?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `To download ${game.title} safely, click the yellow 'DOWNLOAD' button on Play Zone 777. The secure, checked APK installer link will launch automatically to your device.`
            }
          },
          {
            "@type": "Question",
            "name": `What is the signup bonus for ${game.title}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `When you register a new account on ${game.title} today, you receive an exclusive welcome bonus of ${game.bonus}.`
            }
          },
          {
            "@type": "Question",
            "name": `Is the ${game.title} APK download file safe?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes, our administrators have thoroughly scanned and tested the ${game.title} file. It contains zero malicious files and is safe to install on all Android devices.`
            }
          }
        ]
      });
    } else {
      // FAQ Schema (Homepage view)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Play Zone 777?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Play Zone 777 is India's leading APK download catalog for high-rated Rummy, Slots, and VIP casino apps. Every listed app is safe and features verified welcome signup bonuses.`
            }
          },
          {
            "@type": "Question",
            "name": "How do I claim a Welcome Bonus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Simply choose any game card on our list, download and install the app using our verified button link, register your phone number, and the bonus will be credited automatically!"
            }
          },
          {
            "@type": "Question",
            "name": "Are downloads from Play Zone 777 safe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! We run comprehensive anti-virus and security analysis checks on every single APK application before updating our direct referral links."
            }
          }
        ]
      });
    }

    // Dynamic JSON-LD insertion/update
    let scriptTag = document.getElementById('playzone-jsonld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('id', 'playzone-jsonld-schema');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.innerHTML = JSON.stringify(schemas);

  }, [game, settings]);

  return null; // Side-effect only component
}
