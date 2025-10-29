export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "Corporation"],
    "name": "silverithm",
    "legalName": "silverithm",
    "url": "https://vibescan.co.kr",
    "logo": "https://vibescan.co.kr/logo2.png",
    "description": "Web security vulnerability scanning service for developers",
    "email": "ggprgrkjh2@gmail.com",
    "telephone": "+82-10-4549-2094",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1547-10 Sillim-dong",
      "addressLocality": "Gwanak-gu",
      "addressRegion": "Seoul",
      "addressCountry": "KR"
    },
    "founder": {
      "@type": "Person",
      "name": "김준형",
      "jobTitle": "CEO"
    },
    "taxID": "107-21-26475"
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "VibeScan",
    "url": "https://vibescan.co.kr",
    "description": "개발자를 위한 자동화된 보안 취약점 스캔 및 AI 분석 서비스",
    "publisher": {
      "@type": "Organization",
      "name": "silverithm"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://vibescan.co.kr/dashboard?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["ko", "en"]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "VibeScan",
    "operatingSystem": "Web",
    "applicationCategory": "SecurityApplication",
    "image": "https://vibescan.co.kr/logo2.png",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "KRW",
        "description": "월 1회 스캔, 리포트 미리보기",
        "image": "https://vibescan.co.kr/logo2.png",
        "availability": "https://schema.org/InStock",
        "url": "https://vibescan.co.kr/pricing",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "KR",
          "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
          "merchantReturnDays": 0,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "KRW"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "KR"
          }
        }
      },
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "9900",
        "priceCurrency": "KRW",
        "description": "월 5회 스캔, 전체 리포트, AI 분석",
        "image": "https://vibescan.co.kr/logo2.png",
        "availability": "https://schema.org/InStock",
        "url": "https://vibescan.co.kr/pricing",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "KR",
          "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
          "merchantReturnDays": 0,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "KRW"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "KR"
          }
        }
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "29900",
        "priceCurrency": "KRW",
        "description": "월 10회 스캔, 전체 리포트, AI 분석, 우선 지원",
        "image": "https://vibescan.co.kr/logo2.png",
        "availability": "https://schema.org/InStock",
        "url": "https://vibescan.co.kr/pricing",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "KR",
          "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
          "merchantReturnDays": 0,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "KRW"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "KR"
          }
        }
      },
      {
        "@type": "Offer",
        "name": "Business Plan",
        "price": "99900",
        "priceCurrency": "KRW",
        "description": "월 50회 스캔, 전체 리포트, AI 분석, 전담 지원",
        "image": "https://vibescan.co.kr/logo2.png",
        "availability": "https://schema.org/InStock",
        "url": "https://vibescan.co.kr/pricing",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "KR",
          "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
          "merchantReturnDays": 0,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "KRW"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 0,
              "unitCode": "DAY"
            }
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "KR"
          }
        }
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "47",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "12,000+ 취약점 패턴",
      "실시간 웹 취약점 스캐닝",
      "500+ 시크릿 키 노출 탐지",
      "AI 기반 우선순위 분석",
      "OWASP Top 10 탐지",
      "Nuclei & ZAP 통합"
    ],
    "screenshot": "https://vibescan.co.kr/background.png",
    "softwareVersion": "1.0",
    "author": {
      "@type": "Organization",
      "name": "silverithm"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
