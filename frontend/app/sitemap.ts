import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vibescan.co.kr'
  const currentDate = new Date().toISOString()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1,
      alternates: {
        languages: {
          ko: baseUrl,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/en`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1,
      alternates: {
        languages: {
          ko: baseUrl,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          ko: `${baseUrl}/pricing`,
          en: `${baseUrl}/en/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/en/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          ko: `${baseUrl}/pricing`,
          en: `${baseUrl}/en/pricing`,
        },
      },
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/en/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Blog posts
  const posts = getAllPosts()
  const blogPages = posts.flatMap((post) => [
    {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          ko: `${baseUrl}/blog/${post.slug}`,
          en: `${baseUrl}/en/blog/${post.slug}`, // Assuming en content exists or fallback
        },
      },
    },
    {
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          ko: `${baseUrl}/blog/${post.slug}`,
          en: `${baseUrl}/en/blog/${post.slug}`,
        },
      },
    },
  ])

  return [...staticPages, ...blogPages]
}
