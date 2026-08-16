import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = { title: "Interior Design Examples", description: "Explore 18 popular interior design styles and try a direction on your own room." };

const styles = [
  ["Scandinavian", "/static/images/room-after.jpg", "Light woods, soft neutrals, and clutter-free calm."],
  ["Modern", "/static/images/interior-after.jpg", "Clean lines, neutral colors, and functional furniture."],
  ["Minimalist", "/static/images/layout-after.jpg", "Less is more with essential furniture only."],
  ["Industrial", "/static/images/interior-industrial.jpg", "Exposed brick, metal accents, and raw textures."],
  ["Mid-Century Modern", "/static/images/interior-after.jpg", "Retro furniture with organic forms and bold colors."],
  ["Bohemian", "/static/images/room-after.jpg", "Eclectic layers of colors, patterns, and textures."],
  ["Coastal", "/static/images/interior-coastal.jpg", "Light blues, whites, and natural materials."],
  ["Farmhouse", "/static/images/kitchen-after.jpg", "Rustic charm balanced with modern comforts."],
  ["Japandi", "/static/images/interior-after.jpg", "Japanese minimalism meets Scandinavian warmth."],
  ["Traditional", "/static/images/interior-after.jpg", "Classic furniture with considered details."],
  ["Transitional", "/static/images/layout-after.jpg", "A balanced blend of traditional and modern elements."],
  ["Art Deco", "/static/images/s-art-deco.jpg", "Bold geometric patterns and luxurious materials."],
  ["Mediterranean", "/static/images/s-mediterranean.jpg", "Warm plaster, natural stone, and sun-washed colors."],
  ["Rustic", "/static/images/s-rustic-bath.jpg", "Honest materials, tactile finishes, and relaxed character."],
  ["Contemporary", "/static/images/gallery-modern.jpg", "Current silhouettes with comfortable, practical details."],
  ["Luxury", "/static/images/s-luxury-render.jpg", "Refined materials, layered lighting, and statement pieces."],
  ["French Country", "/static/images/gallery-cottage.jpg", "Soft colors, traditional forms, and an inviting lived-in finish."],
  ["Eclectic", "/static/images/gallery-tropical.jpg", "A collected mix of eras, colors, and personal focal points."],
] as const;

const slug = (name: string) => `style-${name.toLowerCase().replaceAll(" ", "-")}`;

export default function ExamplesPage() {
  return <SiteShell><section className="examples-hero"><div className="examples-hero-inner"><h1 className="examples-hero-title">Interior Design Examples for 18 Popular Styles</h1><p className="examples-hero-sub">Explore original Housora concepts across popular styles, then try a direction on your own room photo.</p><Link href="/interior-design" className="btn-primary btn-large">START INTERIOR DESIGN →</Link></div></section><section className="examples-layout"><div className="examples-inner"><aside className="examples-sidebar"><h2 className="sidebar-styles-label">STYLES</h2><ul className="styles-list">{styles.map(([name], index) => <li className={`style-item ${index === 0 ? "active" : ""}`} key={name}><a href={`#${slug(name)}`}>{name}</a></li>)}</ul></aside><div className="examples-content">{styles.map(([name, image, description]) => <section className="style-detail-section" id={slug(name)} key={name}><div className="style-detail-content"><div className="style-detail-image"><Image src={image} alt={`${name} interior design`} width={600} height={400} /></div><div className="style-detail-text"><h2 className="style-detail-title">{name.toUpperCase()} INTERIOR DESIGN</h2><p className="style-detail-subtitle">{description}</p><Link href={`/reference-style?reference=${encodeURIComponent(image)}`} className="style-detail-link">Try {name} on your room</Link></div></div></section>)}</div></div></section></SiteShell>;
}
