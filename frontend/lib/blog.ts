import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
    slug: string
    title: string
    description: string
    date: string
    author: string
    tags: string[]
    image: string
    content: string
    readTime: string
}

export function getPost(slug: string): BlogPost | null {
    try {
        const filePath = path.join(process.cwd(), 'content', 'blog', 'ko', `${slug}.md`)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContents)

        // Calculate read time (assuming 200 words per minute)
        const wordCount = content.split(/\s+/g).length
        const readTime = Math.ceil(wordCount / 200)

        return {
            slug,
            title: data.title,
            description: data.description,
            date: data.date,
            author: data.author || 'VibeScan Team', // Default author if missing
            tags: data.tags || [],
            image: data.image || '/blog/default.png', // Default image if missing
            content,
            readTime: `${readTime}분`
        }
    } catch (error) {
        return null
    }
}

export function getAllPosts(): BlogPost[] {
    const postsDirectory = path.join(process.cwd(), 'content', 'blog', 'ko')

    if (!fs.existsSync(postsDirectory)) {
        return []
    }

    const filenames = fs.readdirSync(postsDirectory)

    const posts = filenames
        .filter(filename => filename.endsWith('.md'))
        .map(filename => {
            const slug = filename.replace(/\.md$/, '')
            return getPost(slug)
        })
        .filter((post): post is BlogPost => post !== null)
        .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime())) // Sort by date desc

    return posts
}
