import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { blogPosts } from "@/lib/blog-data";

export function generateStaticParams() { return blogPosts.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = blogPosts.find((item) => item.slug === slug); return post ? { title: post.title, description: post.excerpt } : {}; }
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const post = blogPosts.find((item) => item.slug === slug); if (!post) notFound(); return <SiteShell><article className="article-page"><header className="article-header"><span className="section-eyebrow">DESIGN GUIDE</span><h1>{post.title}</h1><p>{post.excerpt}</p></header><div className="article-hero-image"><Image src={post.image} alt="Design concept illustrating the guide" width={1376} height={768} priority /></div><div className="article-content"><h2>Start with the decision you need to make</h2><p>A useful visual concept begins with a specific question. Identify what must remain unchanged, what you want to compare, and which practical constraints matter in the real space.</p><h2>Describe visible choices, not abstract labels</h2><p>Include materials, colors, lighting, proportions, and atmosphere. Keep the brief focused enough that each result can be compared against the same goal.</p><h2>Review the result as a concept</h2><p>AI imagery can change dimensions and construction details. Use it to narrow a direction, then verify measurements, safety, availability, and installation with qualified professionals.</p><Link href="/design" className="btn-primary btn-large">TRY IT ON YOUR SPACE</Link></div></article></SiteShell>; }
