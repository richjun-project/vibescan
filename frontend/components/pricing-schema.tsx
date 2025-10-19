'use client'

import { useEffect } from 'react'

interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  scans: number
  description: string
  features: string[]
}

interface PricingSchemaProps {
  plans: PricingPlan[]
  language: 'ko' | 'en'
}

export function PricingSchema({ plans, language }: PricingSchemaProps) {
  useEffect(() => {
    // Product schema for each plan
    const productSchemas = plans.map(plan => ({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `VibeScan ${plan.name} Plan`,
      "description": plan.description,
      "brand": {
        "@type": "Brand",
        "name": "VibeScan"
      },
      "offers": {
        "@type": "Offer",
        "price": plan.price,
        "priceCurrency": "KRW",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "url": `https://vibescan.co.kr/${language === 'en' ? 'en/' : ''}pricing`,
        "seller": {
          "@type": "Organization",
          "name": "silverithm"
        },
        "itemCondition": "https://schema.org/NewCondition"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      },
      "category": "Web Security Software"
    }))

    // SaaS Product schema
    const saasSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "VibeScan",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Web",
      "offers": plans.map(plan => ({
        "@type": "Offer",
        "name": `${plan.name} Plan`,
        "price": plan.price,
        "priceCurrency": "KRW",
        "billingIncrement": "P1M",
        "priceValidUntil": "2025-12-31"
      })),
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    }

    // BreadcrumbList schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": language === 'en' ? "Home" : "홈",
          "item": `https://vibescan.co.kr/${language === 'en' ? 'en' : ''}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": language === 'en' ? "Pricing" : "요금제",
          "item": `https://vibescan.co.kr/${language === 'en' ? 'en/' : ''}pricing`
        }
      ]
    }

    // WebPage schema
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": language === 'en'
        ? "VibeScan Pricing - Web Security Scanner Plans"
        : "VibeScan 요금제 - 웹 보안 스캔 가격",
      "description": language === 'en'
        ? "Compare VibeScan web security vulnerability scanner pricing plans"
        : "웹 보안 취약점 스캔 서비스 VibeScan의 요금제를 확인하세요",
      "url": `https://vibescan.co.kr/${language === 'en' ? 'en/' : ''}pricing`,
      "inLanguage": language === 'en' ? "en-US" : "ko-KR",
      "isPartOf": {
        "@type": "WebSite",
        "name": "VibeScan",
        "url": "https://vibescan.co.kr"
      }
    }

    // Combine all schemas
    const allSchemas = [
      ...productSchemas,
      saasSchema,
      breadcrumbSchema,
      webPageSchema
    ]

    // Insert into DOM
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(allSchemas)
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [plans, language])

  return null
}