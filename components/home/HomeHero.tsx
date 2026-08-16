"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const rooms = ["Bedroom", "Kitchen", "Bathroom", "Office", "Interior", "Any Room"];
const slides = ["/static/images/room-before.jpg", "/static/images/interior-after.jpg", "/static/images/room-after.jpg", "/static/images/hero-after.jpg"];

export function HomeHero() {
  const [word, setWord] = useState(0);
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = setInterval(() => setWord((value) => (value + 1) % rooms.length), 2500);
    const images = setInterval(() => setSlide((value) => (value + 1) % slides.length), 4200);
    return () => { clearInterval(words); clearInterval(images); };
  }, []);

  const upload = () => router.push("/sign-up?redirect=/design");
  return <section className="hero-section"><div className="hero-split-layout desktop-only"><div className="hero-split-left"><div className="hero-stat-badge hero-stat-badge-dark">A visual starting point for your next space</div><div className="hero-split-title"><div className="hero-split-title-line1">Redesign <span className="hero-rotating-words"><span className="hero-rotating-word active">{rooms[word]}</span></span></div><div className="hero-split-title-line2">with AI, shaped around your space</div><div className="hero-split-title-line3">Furniture from<span className="sr-only"> your own furniture references</span></div></div><p className="hero-supporting-copy">Design ideas shaped around your visual brief.</p><div className="create-input-wrapper"><div className="create-input-container"><textarea className="create-input" rows={1} aria-label="Design prompt" readOnly /><div className="create-input-actions"><button className="input-action-btn" type="button" onClick={upload}>▧ <span className="add-image-btn-label">Start free design</span></button><button className="submit-arrow-btn" type="button" aria-label="Start design" onClick={upload}>↑</button></div></div></div></div><div className="hero-split-right"><div className="hero-desktop-slideshow">{slides.map((src, index) => <Image src={src} alt={index === 0 ? "Room before redesign" : "AI room design concept"} fill sizes="50vw" priority={index === 0} className={`hero-desktop-slide ${slide === index ? "hero-desktop-slide--active" : ""}`} key={src} />)}</div><div className="hero-trust-bar"><div className="hero-trust-text"><span className="hero-trust-number">Your own space, your own direction</span><span className="hero-trust-label">Explore concepts grounded in your photo.</span></div><div className="hero-trust-divider" /><div className="hero-trust-reviews"><span>Built for visual exploration</span><span className="hero-trust-rating">Preview mode</span></div></div></div></div><div className="hero-wallpaper-section mobile-only"><div className="hero-mobile-banner"><div className="hero-stat-badge hero-stat-badge-dark">Bring your ideas to life</div><div className="hero-mobile-title"><span className="hero-mobile-title-line1">Redesign {rooms[word]}</span><span className="hero-mobile-title-line2">with AI, shaped around your space</span><span className="hero-mobile-title-line3">Furniture from your references</span></div><p className="hero-supporting-copy">A calm way to explore your next design direction.</p><button className="btn-primary btn-large" onClick={upload}>START FREE DESIGN</button><div className="hero-mobile-slideshow"><Image src={slides[slide]} alt="AI room design concept" fill sizes="100vw" priority /></div></div></div></section>;
}
