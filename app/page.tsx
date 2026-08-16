import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { HomeHero } from "@/components/home/HomeHero";

export const metadata: Metadata = { title: "AI Room Design | Upload a Photo & Redesign", description: "Explore practical AI design concepts for your home from a photo." };

const categories = [
  ["Interior design", "/interior-design", "/static/images/interior-after.jpg"],
  ["Exterior design", "/exterior-design", "/static/images/exterior-after.jpg"],
  ["Garden design", "/garden-design", "/static/images/garden-after.jpg"],
  ["Kitchen design", "/ai-kitchen-design", "/static/images/kitchen-after.jpg"],
] as const;

export default function HomePage() {
  return <SiteShell bodyClass="marketing-home"><div className="create-main layout-initial"><h1 className="sr-only">AI room design concepts from your own photo</h1><HomeHero /><section className="feature-showcase-section"><div className="section-header"><span className="section-eyebrow">EXPLORE HOUSORA</span><h2>One photo, more ways to see your space</h2><p>Choose a focused design tool, keep the original room as your reference, and compare ideas before committing.</p></div><div className="feature-cards-grid">{categories.map(([name, href, image]) => <Link className="feature-card" href={href} key={href}><div className="feature-card-image"><Image src={image} alt={`${name} example`} fill sizes="(max-width: 700px) 100vw, 25vw" /></div><div className="feature-card-content"><h3>{name}</h3><span>Explore tool →</span></div></Link>)}</div></section><section className="how-it-works-section"><div className="section-header"><span className="section-eyebrow">HOW IT WORKS</span><h2>From your photo to a clearer design direction</h2></div><div className="steps-grid">{[["01", "Upload your space", "Choose a clear photo of the room or area you want to explore."], ["02", "Set the direction", "Pick a style and add a concise visual brief."], ["03", "Compare the concept", "Review the generated result alongside your original image."]].map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><div className="section-cta"><Link href="/sign-up?redirect=/design" className="btn-primary btn-large">CREATE YOUR FIRST DESIGN</Link></div></section></div></SiteShell>;
}
