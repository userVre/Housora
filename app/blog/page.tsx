import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = { title: "AI Design Guides", description: "Practical guides for clearer room, exterior, garden, and architectural design decisions." };
export default function BlogPage() { return <SiteShell><section className="blog-hero"><div className="blog-hero-inner"><span className="section-eyebrow">HOUSORA JOURNAL</span><h1>Practical ideas for visual design decisions</h1><p>Clear guides for turning your space, constraints, and references into a more useful design direction.</p></div></section><section className="blog-grid-section"><div className="blog-grid">{blogPosts.map((post) => <article className="blog-card" key={post.slug}><Link href={`/blog/${post.slug}`}><div className="blog-card-image"><Image src={post.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" /></div><div className="blog-card-content"><span className="blog-card-category">DESIGN GUIDE</span><h2>{post.title}</h2><p>{post.excerpt}</p><span className="blog-card-link">Read guide →</span></div></Link></article>)}</div></section></SiteShell>; }
