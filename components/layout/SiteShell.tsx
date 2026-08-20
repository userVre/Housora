"use client";

import { Show, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const tools = [
  ["/interior-design", "AI Interior Design"], ["/layout-boost", "AI Layout Boost"],
  ["/exterior-design", "AI Exterior Design"], ["/garden-design", "AI Garden Design"],
  ["/wall-texture", "AI Walls Texture"], ["/floor-restyle", "AI Floor Restyle"],
  ["/ai-stairs-design", "AI Stairs Design"], ["/ai-doors-design", "AI Doors Design"],
  ["/ai-windows-design", "AI Windows Design"], ["/ai-kitchen-design", "AI Kitchen Design"],
  ["/ai-bathroom-design", "AI Bathroom Design"], ["/video-walkthrough", "AI Video Walkthrough"],
  ["/floorplan-to-3d", "AI Floorplan to 3D"], ["/photo-to-render", "AI Photo to Render"],
  ["/reference-style", "Reference Style"],
] as const;

const Arrow = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>;

export function SiteShell({ children, bodyClass = "", workspace = false }: { children: React.ReactNode; bodyClass?: string; workspace?: boolean }) {
  const [sidebar, setSidebar] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const { user } = useUser();

  useEffect(() => {
    document.body.className = bodyClass;
    return () => { document.body.className = ""; };
  }, [bodyClass]);

  useEffect(() => {
    if (sidebar) sidebarRef.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSidebar(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [sidebar]);

  return <>
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <div className={`create-page ${workspace ? "workspace-shell" : ""}`}>
      <header className="create-header">
        <div className="header-left">
          <button className="menu-hamburger" aria-label="Open menu" aria-expanded={sidebar} onClick={() => setSidebar(true)}><span /><span /><span /></button>
          <Link href="/" className="create-logo"><span className="brand-mark"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 5v22M25 5v22M7 16c5-6 13-6 18 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span><span>HOUSORA</span></Link>
        </div>
        <div className="create-header-actions"><div className="desktop-header-nav">
          <Link href="/examples" className="desktop-nav-link">Examples</Link><Link href="/pricing" className="desktop-nav-link">Pricing</Link>
          <Show when="signed-out"><Link href="/sign-in" className="desktop-nav-link">Sign in</Link></Show>
          <Show when="signed-in"><UserButton /></Show>
          <div className="ai-tools-dropdown-wrapper">
            <button className="desktop-nav-link ai-tools-trigger" type="button" aria-expanded={toolsOpen} onClick={() => setToolsOpen((open) => !open)}>AI Tools<Arrow /></button>
            <div className={`ai-tools-dropdown ${toolsOpen ? "open" : ""}`}>{tools.map(([href, label]) => <Link href={href} className="ai-tool-link" key={href}>{label}</Link>)}</div>
          </div>
          <Link className="browse-catalog-btn start-free-btn" href={user ? "/app/home" : "/sign-up?redirect=/app/home"}>CREATE DESIGN</Link>
        </div><Link className="header-search-icon-mobile" href="/design" aria-label="New design"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg></Link></div>
      </header>
      <button className={`sidebar-overlay ${sidebar ? "active" : ""}`} aria-label="Close menu" onClick={() => setSidebar(false)} />
      <nav className={`sidebar-nav ${sidebar ? "open" : ""}`} aria-label="Main navigation" tabIndex={-1} ref={sidebarRef}>
        <div className="sidebar-header"><span className="sidebar-logo">HOUSORA</span><button className="sidebar-close-btn" aria-label="Close menu" onClick={() => setSidebar(false)}>×</button></div>
        {user && <div className="sidebar-user-info" style={{ display: "flex" }}><div className="sidebar-user-avatar">{user.imageUrl ? <img src={user.imageUrl} alt="" width="36" height="36" /> : user.firstName?.[0]}</div><div className="sidebar-user-details"><span className="sidebar-user-name">{user.firstName || "User"}</span><span className="sidebar-user-email">{user.primaryEmailAddress?.emailAddress}</span></div></div>}
        <div className="sidebar-section"><Link href="/design" className="sidebar-link">New Design</Link><Link href="/projects" className="sidebar-link">My Projects</Link></div>
        <div className="sidebar-section"><div className="sidebar-section-header"><span>AI Tools</span><Arrow /></div><div className="sidebar-links">{tools.slice(0, 6).map(([href, label]) => <Link href={href} className="sidebar-link" key={href}>{label}</Link>)}</div></div>
        <div className="sidebar-section"><Link href="/pricing" className="sidebar-link">Pricing</Link><Link href="/faq" className="sidebar-link">FAQ</Link><Link href="/blog" className="sidebar-link">Blog</Link><Link href="/examples" className="sidebar-link">Examples</Link></div>
        <div className="sidebar-section sidebar-auth-section"><Show when="signed-out"><Link href="/sign-in" className="sidebar-link sidebar-signin-link">Sign In</Link><Link href="/sign-up" className="sidebar-link sidebar-signup-link">Create Account</Link></Show><Show when="signed-in"><Link href="/app/plan" className="sidebar-link">Manage plan</Link><Link href="/delete-account" className="sidebar-link">Delete account</Link></Show></div>
      </nav>
      <div className="content-wrapper"><main id="main-content" tabIndex={-1}>{children}</main><Footer /></div>
    </div>
  </>;
}

function Footer() {
  const openCookies = () => window.dispatchEvent(new Event("housora:open-cookie-settings"));
  const group = (title: string, links: readonly (readonly [string, string])[]) => <details className="footer-group"><summary>{title}</summary><div className="footer-group-links">{links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</div></details>;
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><span className="footer-brand-name">HOUSORA</span><p>Ideas for real homes, shaped around your space.</p></div><div className="footer-columns">{group("AI Tools", [["/interior-design", "Interior design"], ["/exterior-design", "Exterior design"], ["/garden-design", "Garden design"], ["/reference-style", "Reference style"]])}{group("Information", [["/examples", "Examples"], ["/faq", "FAQ"], ["/blog", "Blog"]])}{group("Support", [["/contact", "Contact"], ["/pricing", "Pricing"], ["/enterprise", "Enterprise"]])}</div></div><div className="footer-bottom-bar"><span className="footer-logo-bottom">HOUSORA</span><div className="footer-bottom-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link><Link href="/refund-policy">Refunds</Link><button type="button" className="footer-cookie-settings" onClick={openCookies}>Cookie settings</button></div><span className="footer-copy">© 2026 Housora</span></div></footer>;
}
