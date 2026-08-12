package com.housora.templates

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.EnvConfig
import com.housora.ClerkConfig
import com.housora.ConvexConfig
import com.housora.WebsiteConfig
import com.housora.PostHogConfig

data class AITool(val name: String, val path: String)

private data class SeoDefaults(
    val description: String,
    val image: String = "/og-image.png",
    val indexable: Boolean = true,
    val organizationSchema: Boolean = false,
    val softwareSchema: Boolean = false
)

private fun inferredPath(title: String): String = when {
    title.startsWith("Housora - AI Room Design") -> "/"
    title.startsWith("FAQ") -> "/faq"
    title.startsWith("Contact") -> "/contact"
    title.contains("AI Interior Design") && !title.contains("Examples") -> "/interior-design"
    title.contains("AI Layout Boost") -> "/layout-boost"
    title.contains("AI Exterior Design") -> "/exterior-design"
    title.contains("AI Garden Design") -> "/garden-design"
    title.contains("AI Wall Texture") -> "/wall-texture"
    title.contains("AI Floor Restyle") -> "/floor-restyle"
    title.contains("AI Stairs Design") -> "/ai-stairs-design"
    title.contains("AI Doors Design") -> "/ai-doors-design"
    title.contains("AI Windows Design") -> "/ai-windows-design"
    title.contains("AI Kitchen Design") -> "/ai-kitchen-design"
    title.contains("AI Bathroom Design") -> "/ai-bathroom-design"
    title.contains("AI Video Walkthrough") -> "/video-walkthrough"
    title.contains("AI Floorplan to 3D") -> "/floorplan-to-3d"
    title.contains("AI Photo to Render") -> "/photo-to-render"
    title.contains("Reference Style") -> "/reference-style"
    title.contains("Examples") -> "/examples"
    title.startsWith("Growth,") -> "/enterprise"
    title.startsWith("Housora App") -> "/app/home"
    title.startsWith("Housora - Sign In") -> "/sign-in"
    title.startsWith("Housora - Sign Up") -> "/sign-up"
    title.startsWith("Housora - Signing Out") -> "/sign-out"
    title.startsWith("Article Not Found") -> "/404"
    title.startsWith("Blog |") -> "/blog"
    title.startsWith("My Projects") -> "/projects"
    else -> "/"
}

private fun seoFor(path: String): SeoDefaults = when (path) {
    "/" -> SeoDefaults("Explore practical AI design concepts for your home from a photo.", organizationSchema = true, softwareSchema = true)
    "/pricing" -> SeoDefaults("See Housora plans, included image allowances, billing periods, and current checkout terms.", softwareSchema = true)
    "/app/home", "/design", "/projects", "/sign-in", "/sign-up", "/sign-out", "/delete-account" -> SeoDefaults("Use Housora to explore and manage AI-assisted home design concepts.", indexable = false)
    "/blog" -> SeoDefaults("Practical ideas for planning rooms, materials, colour, layouts, and AI-assisted home design.")
    in setOf("/interior-design", "/layout-boost", "/exterior-design", "/garden-design", "/floor-restyle", "/wall-texture", "/video-walkthrough", "/floorplan-to-3d", "/photo-to-render", "/ai-stairs-design", "/ai-doors-design", "/ai-windows-design", "/ai-kitchen-design", "/ai-bathroom-design", "/reference-style") -> SeoDefaults("Explore an AI-assisted home design workflow using your own room, exterior, or garden photo.", softwareSchema = true)
    "/enterprise" -> SeoDefaults("Higher image allowances and support options for teams exploring home design concepts.", softwareSchema = true)
    "/contact" -> SeoDefaults("Contact Housora for product, billing, privacy, and account support.", organizationSchema = true)
    "/privacy", "/terms", "/refund-policy", "/cookies" -> SeoDefaults("Housora's current policy and account information.", indexable = false)
    else -> SeoDefaults("Explore an AI-assisted home design workflow using your own room, exterior, or garden photo.")
}

private val aiTools = listOf(
    AITool("AI Interior Design", "/interior-design"),
    AITool("AI Layout Boost", "/layout-boost"),
    AITool("AI Exterior Design", "/exterior-design"),
    AITool("AI Garden Design", "/garden-design"),
    AITool("AI Walls Texture", "/wall-texture"),
    AITool("AI Floor Restyle", "/floor-restyle"),
    AITool("AI Stairs Design", "/ai-stairs-design"),
    AITool("AI Doors Design", "/ai-doors-design"),
    AITool("AI Windows Design", "/ai-windows-design"),
    AITool("AI Kitchen Design", "/ai-kitchen-design"),
    AITool("AI Bathroom Design", "/ai-bathroom-design"),
    AITool("AI Video Walkthrough", "/video-walkthrough"),
    AITool("AI Floorplan to 3D", "/floorplan-to-3d"),
    AITool("AI Photo to Render", "/photo-to-render"),
    AITool("Reference Style", "/reference-style")
)

fun HTML.baseLayout(title: String, bodyClass: String = "", path: String = "", structuredData: String? = null, content: DIV.() -> Unit) {
    val canonicalPath = if (path.isBlank()) inferredPath(title) else path
    val seo = seoFor(canonicalPath)
    val canonicalUrl = WebsiteConfig.resolveUrl(canonicalPath)
    attributes["lang"] = "en"
    head {
        meta(charset = "utf-8")
        meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
        title { +title }
        meta(name = "description", content = seo.description)
        meta(name = "keywords", content = "Housora, AI home design, AI room makeover, interior design ideas, virtual staging, exterior design, garden design")
        if (!seo.indexable) meta(name = "robots", content = "noindex, nofollow")
        link(rel = "canonical", href = canonicalUrl)
        link(rel = "icon", type = "image/svg+xml", href = "/favicon.svg")
        link(rel = "icon", type = "image/x-icon", href = "/favicon.ico")
        link(rel = "apple-touch-icon", href = "/apple-touch-icon.png")
        meta { attributes["property"] = "og:title"; attributes["content"] = title }
        meta { attributes["property"] = "og:description"; attributes["content"] = seo.description }
        meta { attributes["property"] = "og:url"; attributes["content"] = canonicalUrl }
        meta { attributes["property"] = "og:image"; attributes["content"] = WebsiteConfig.resolveUrl(seo.image) }
        meta { attributes["property"] = "og:image:alt"; attributes["content"] = "Housora home design concepts" }
        unsafe { +"""<meta property="og:type" content="website">""" }
        unsafe { +"""<meta property="og:site_name" content="Housora">""" }
        meta(name = "twitter:card", content = "summary_large_image")
        meta(name = "twitter:title", content = title)
        meta(name = "twitter:description", content = seo.description)
        meta(name = "twitter:image", content = WebsiteConfig.resolveUrl(seo.image))
        meta(name = "twitter:image:alt", content = "Housora home design concepts")
        meta(name = "theme-color", content = "#000000")
        meta(name = "clerk-publishable-key", content = ClerkConfig.publishableKey)
        meta(name = "convex-url", content = ConvexConfig.url)
        if (seo.organizationSchema) script(type = "application/ld+json") {
            unsafe { +"""{"@context":"https://schema.org","@type":"Organization","name":"Housora","url":"${WebsiteConfig.resolveUrl()}","logo":"${WebsiteConfig.resolveUrl("/og-image.png")}"}""" }
        }
        if (seo.softwareSchema) script(type = "application/ld+json") {
            unsafe { +"""{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Housora AI Home Design","applicationCategory":"DesignApplication","operatingSystem":"Web","url":"$canonicalUrl"}""" }
        }
        structuredData?.let { schema -> script(type = "application/ld+json") { unsafe { +schema } } }
        script {
            unsafe {
                +"""
                (function () {
                    try {
                        var savedTheme = localStorage.getItem('housora-theme');
                        var preferredTheme = savedTheme === 'dark' || savedTheme === 'light'
                            ? savedTheme
                            : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                        document.documentElement.setAttribute('data-theme', preferredTheme);
                    } catch (_) {
                        document.documentElement.setAttribute('data-theme', 'light');
                    }
                })();
                """
            }
        }
        link(rel = "stylesheet", href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap")
        link(rel = "stylesheet", href = "/static/css/style.css")
        script(src = "https://unpkg.com/lucide@latest") { attributes["defer"] = "defer" }
        script {
            unsafe {
                +"""
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                window.gtag = window.gtag || gtag;
                gtag("consent", "default", {
                    ad_personalization: "denied",
                    ad_storage: "denied",
                    ad_user_data: "denied",
                    analytics_storage: "denied",
                    functionality_storage: "denied",
                    personalization_storage: "denied",
                    security_storage: "granted",
                    wait_for_update: 500,
                });
                gtag("set", "ads_data_redaction", true);
                gtag("set", "url_passthrough", false);
                """
            }
        }
        script {
            unsafe {
                +"""
                document.addEventListener('DOMContentLoaded', function() {
                    // Keep meaningful alternative text when media is unavailable.
                    // The visible fallback is styled as a neutral media placeholder.
                    document.querySelectorAll('img').forEach(function(img) {
                        function markMissing() {
                            img.classList.add('media-unavailable');
                            img.dataset.mediaUnavailable = 'true';
                            if (!img.hasAttribute('alt')) img.alt = 'Image unavailable';
                            const slideshow = img.closest('.hero-desktop-slideshow');
                            if (slideshow) {
                                const slides = Array.from(slideshow.querySelectorAll('.hero-desktop-slide'));
                                if (slides.length && slides.every(function(slide) { return slide.classList.contains('media-unavailable'); })) {
                                    slideshow.closest('.hero-split-layout')?.classList.add('hero-media-unavailable');
                                }
                            }
                        }
                        if (img.complete && img.naturalWidth === 0) markMissing();
                        img.addEventListener('error', markMissing, { once: true });
                    });
                    const aiToolsBtn = document.getElementById('ai-tools-btn');
                    const aiToolsDropdown = document.getElementById('ai-tools-dropdown');
                    aiToolsBtn?.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const isOpen = aiToolsDropdown?.classList.toggle('open') === true;
                        aiToolsBtn.setAttribute('aria-expanded', String(isOpen));
                    });
                    document.addEventListener('click', function(e) {
                        if (!aiToolsBtn?.contains(e.target) && !aiToolsDropdown?.contains(e.target)) {
                            aiToolsDropdown?.classList.remove('open');
                            aiToolsBtn?.setAttribute('aria-expanded', 'false');
                        }
                    });
                    aiToolsBtn?.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            aiToolsDropdown?.classList.remove('open');
                            aiToolsBtn.setAttribute('aria-expanded', 'false');
                            aiToolsBtn.focus();
                        }
                    });
                    // Mobile header + icon navigates to /design
                    document.querySelector('.header-search-icon-mobile')?.addEventListener('click', function() {
                        window.location.href = '/design';
                    });
                    // Lucide icons loaded but not used in header (inline SVGs used instead)
                    // Expose Convex URL to client JS
                    window.CONVEX_URL = '${EnvConfig.get("EXPO_PUBLIC_CONVEX_URL")}';
                    // AI generation status â€” disabled because no AI provider is configured
                    window.__HOUSORA_AI_CONFIGURED = false;
                    // Cycle the existing rotating-word spans without replacing
                    // their markup. Replacing textContent here used to produce
                    // â€œRedesign Redesign Bedroomâ€ and broke the reference layout.
                    ['heroLine1', 'heroLine1Mobile'].forEach(function(id) {
                        const heroLine = document.getElementById(id);
                        if (!heroLine) return;
                        const words = heroLine.querySelectorAll('.hero-rotating-word');
                        if (words.length < 2) return;
                        // Keep the heading stable while the active word changes.
                        let maxWidth = 0;
                        words.forEach(function(word) {
                            const previousDisplay = word.style.display;
                            word.style.display = 'inline';
                            maxWidth = Math.max(maxWidth, word.getBoundingClientRect().width);
                            word.style.display = previousDisplay;
                        });
                        if (maxWidth > 0) {
                            heroLine.style.width = Math.ceil(maxWidth) + 'px';
                            heroLine.style.display = 'inline-block';
                        }
                        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                        let wordIdx = 0;
                        setInterval(function() {
                            words[wordIdx].classList.remove('active');
                            wordIdx = (wordIdx + 1) % words.length;
                            words[wordIdx].classList.add('active');
                        }, 2500);
                    });
                });
                """
            }
        }
    }
    body(classes = bodyClass) {
        a(href = "#main-content", classes = "skip-link") { +"Skip to main content" }
        // Clerk loading overlay (hidden by default, shown by JS during init)
        if (ClerkConfig.isConfigured) {
            div(classes = "clerk-loading-overlay") {
                attributes["id"] = "clerk-loading"
                attributes["style"] = "display:none;"
                div("clerk-loading-content") {
                    div("loading-spinner") {}
                    p { +"Loading authentication..." }
                }
            }
        }

        // Page wrapper
        div(classes = if (path == "/projects") "projects-shell" else "create-page") {

        // Header
        header(classes = "create-header") {
            div(classes = "header-left") {
                button(classes = "menu-hamburger") {
                    attributes["id"] = "sidebar-toggle"
                    attributes["aria-label"] = "Open menu"
                    span {}
                    span {}
                    span {}
                }
                a(href = "/", classes = "create-logo") {
                    span(classes = "brand-mark") { unsafe { +"""<svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 5v22M25 5v22M7 16c5-6 13-6 18 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>""" } }
                    span { +"HOUSORA" }
                }
            }
            div(classes = "create-header-actions") {
                div(classes = "desktop-header-nav") {
                    a(href = "/examples", classes = "desktop-nav-link") { +"Examples" }
                    a(href = "/pricing", classes = "desktop-nav-link") { +"Pricing" }
                    a(href = "/sign-in", classes = "desktop-nav-link") { +"Sign in" }
                    div(classes = "ai-tools-dropdown-wrapper") {
                        button(classes = "desktop-nav-link ai-tools-trigger") {
                            attributes["id"] = "ai-tools-btn"
                            attributes["type"] = "button"
                            attributes["aria-expanded"] = "false"
                            attributes["aria-controls"] = "ai-tools-dropdown"
                            +"AI Tools"
                            unsafe { +"""<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>""" }
                        }
                        div(classes = "ai-tools-dropdown") {
                            attributes["id"] = "ai-tools-dropdown"
                            aiTools.forEach { tool ->
                                a(href = tool.path, classes = "ai-tool-link") { +tool.name }
                            }
                        }
                    }
                    button(classes = "browse-catalog-btn start-free-btn") {
                        attributes["onclick"] = "window.location.href=(window.Clerk && window.Clerk.user ? '/app/home' : '/#first-design')"
                        +"START FREE DESIGN"
                    }
                }
                button(classes = "header-search-icon-mobile") {
                    attributes["aria-label"] = "New design"
                    unsafe { +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>""" }
                }
            }
        }

        // Sidebar Overlay
        div(classes = "sidebar-overlay") {
            attributes["id"] = "sidebar-overlay"
        }

        // Sidebar Navigation
        nav(classes = "sidebar-nav") {
            attributes["id"] = "sidebar"
            attributes["aria-label"] = "Main navigation"
            attributes["tabindex"] = "-1"
            div(classes = "sidebar-header") {
                span(classes = "sidebar-logo") { +"HOUSORA" }
                button(classes = "sidebar-close-btn") {
                    attributes["id"] = "sidebar-close"
                    attributes["aria-label"] = "Close menu"
                    unsafe { +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>""" }
                }
            }
            // User info (hidden by default, shown by JS when signed in)
            div(classes = "sidebar-user-info") {
                attributes["id"] = "sidebar-user-info"
                attributes["style"] = "display:none"
                div(classes = "sidebar-user-avatar") {
                    attributes["id"] = "sidebar-user-avatar"
                }
                div(classes = "sidebar-user-details") {
                    span(classes = "sidebar-user-name") { attributes["id"] = "sidebar-user-name"; +"" }
                    span(classes = "sidebar-user-email") { attributes["id"] = "sidebar-user-email"; +"" }
                }
            }
            div(classes = "sidebar-section") {
                a(href = "/design", classes = "sidebar-link") { +"New Design" }
                a(href = "/projects", classes = "sidebar-link") { +"My Projects" }
            }
            div(classes = "sidebar-section") {
                div(classes = "sidebar-section-header") {
                    span { +"AI Tools" }
                    span(classes = "chevron") { unsafe { +"""<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>""" } }
                }
                div(classes = "sidebar-links") {
                    aiTools.take(6).forEach { tool ->
                        a(href = tool.path, classes = "sidebar-link") { +tool.name }
                    }
                }
            }
            div(classes = "sidebar-section") {
                a(href = "/pricing", classes = "sidebar-link") { +"Pricing" }
                a(href = "/faq", classes = "sidebar-link") { +"FAQ" }
                a(href = "/blog", classes = "sidebar-link") { +"Blog" }
                a(href = "/examples", classes = "sidebar-link") { +"Examples" }
            }
            div(classes = "sidebar-section sidebar-auth-section") {
                attributes["id"] = "sidebar-auth-section"
                a(href = "/sign-in", classes = "sidebar-link sidebar-signin-link") { +"Sign In" }
                a(href = "/sign-up", classes = "sidebar-link sidebar-signup-link") { +"Create Account" }
            }
        }

        // Main Content
        div(classes = "content-wrapper") {
            main(classes = if (path == "/projects") "brand-kits-main layout-initial" else "create-main layout-initial") {
                attributes["id"] = "main-content"
                attributes["tabindex"] = "-1"
                div {
                    content()
                }
            }
        }

        // Footer
        footer(classes = "site-footer") {
            div(classes = "footer-inner") {
                div(classes = "footer-columns") {
                    // Column 1: AI Tools
                    div(classes = "footer-col") {
                        h2(classes = "footer-col-title") { +"AI Tools" }
                        ul(classes = "footer-links") {
                            aiTools.take(6).forEach { tool ->
                                li { a(href = tool.path) { +tool.name } }
                            }
                            // Developer tools are intentionally omitted until their documentation is ready.
                        }
                    }
                    // Column 2: Business
                    div(classes = "footer-col") {
                        h2(classes = "footer-col-title") { +"Business" }
                        ul(classes = "footer-links") {
                            li { a(href = "/enterprise") { +"Enterprise plans" } }
                            li { a(href = "/contact") { +"Work with Housora" } }
                        }
                    }
                    // Column 3: Information
                    div(classes = "footer-col") {
                        h2(classes = "footer-col-title") { +"Information" }
                        ul(classes = "footer-links") {
                            li { a(href = "/blog") { +"Blog" } }
                            li { a(href = "/examples") { +"Design Examples" } }
                            li { a(href = "/faq") { +"Answers & FAQ" } }
                            li {
                                a(href = "/llms.txt", target = "_blank") {
                                    attributes["rel"] = "noopener noreferrer"
                                    +"AI Information"
                                }
                            }
                        }
                    }
                    // Column 4: Support
                    div(classes = "footer-col") {
                        h2(classes = "footer-col-title") { +"Support" }
                        ul(classes = "footer-links") {
                            li { a(href = "/contact") { +"Contact" } }
                            li { a(href = "/faq") { +"FAQ" } }
                        }
                    }
                    // Column 5: Design Your Room with Furniture From + Social
                    div(classes = "footer-col footer-col-right") {
                        p(classes = "footer-retailers-title") { +"Ideas for real homes, shaped around your space." }
                        div(classes = "footer-social-text") {
                            a(href = "https://www.instagram.com/housora_ai/", target = "_blank", classes = "footer-social-link") { attributes["rel"] = "noopener noreferrer"; attributes["aria-label"] = "Instagram"; unsafe { +"""<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>""" }; span { +"Instagram" } }
                            a(href = "https://www.facebook.com/profile.php?id=61590655134529", target = "_blank", classes = "footer-social-link") { attributes["rel"] = "noopener noreferrer"; attributes["aria-label"] = "Facebook"; unsafe { +"""<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z"/></svg>""" }; span { +"Facebook" } }
                            a(href = "https://www.youtube.com/@Housora_AI", target = "_blank", classes = "footer-social-link") { attributes["rel"] = "noopener noreferrer"; attributes["aria-label"] = "YouTube"; unsafe { +"""<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1.9 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.8 29 29 0 0 0-.5-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/></svg>""" }; span { +"YouTube" } }
                        }
                        if (false) {
                            p(classes = "footer-ask-ai") { +"Ask AI about Housora AI" }
                        div(classes = "footer-ask-ai-buttons") {
                            a(href = "https://chatgpt.com/?prompt=I%27m%20researching%20interior%20design%20and%203D%20visualization%20tools...", target = "_blank", classes = "footer-ask-ai__btn") {
                                attributes["rel"] = "noopener noreferrer"
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>""" }
                                span { +"ChatGPT" }
                            }
                            a(href = "https://claude.ai/new?q=I%27m%20researching%20interior%20design%20and%203D%20visualization%20tools...", target = "_blank", classes = "footer-ask-ai__btn") {
                                attributes["rel"] = "noopener noreferrer"
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24" fill="#D97757"><path d="M4.709 15.955l4.72-2.756.08-.046 2.803-1.636a.206.206 0 0 0 0-.357l-2.963-1.73-4.716-2.752a.206.206 0 0 0-.309.178v8.921a.206.206 0 0 0 .309.178h.076zm7.582-4.574l2.802 1.637a.206.206 0 0 1 0 .357l-2.802 1.636-2.545 1.484-2.29 1.334a.206.206 0 0 1-.309-.178V7.463a.206.206 0 0 1 .309-.178l2.29 1.334 2.545 1.484z"/></svg>""" }
                                span { +"Claude" }
                            }
                            a(href = "https://gemini.google.com/app?prompt=I%27m%20researching%20interior%20design%20and%203D%20visualization%20tools...", target = "_blank", classes = "footer-ask-ai__btn") {
                                attributes["rel"] = "noopener noreferrer"
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#3186FF" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path fill="#08B962" d="M12 2a10 10 0 0 1 10 10h-10z"/><path fill="#F94543" d="M12 12a10 10 0 0 1-10-10h10z"/><path fill="#FABC12" d="M12 12a10 10 0 0 0 10-10v10z"/></svg>""" }
                                span { +"Gemini" }
                            }
                            a(href = "https://perplexity.ai/search/new?q=I%27m%20researching%20interior%20design%20and%203D%20visualization%20tools...", target = "_blank", classes = "footer-ask-ai__btn") {
                                attributes["rel"] = "noopener noreferrer"
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>""" }
                                span { +"Perplexity" }
                            }
                            a(href = "https://x.com/i/grok?text=I%27m%20researching%20interior%20design%20and%203D%20visualization%20tools...", target = "_blank", classes = "footer-ask-ai__btn") {
                                attributes["rel"] = "noopener noreferrer"
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>""" }
                                span { +"Grok" }
                            }
                            }
                        }
                    }
                }
                div(classes = "footer-bottom-bar") {
                    span(classes = "footer-logo-bottom") { +"HOUSORA" }
                    div(classes = "footer-bottom-links") {
                        a(href = "/privacy") { +"Privacy Policy" }
                        a(href = "/terms") { +"Terms & Conditions" }
                        a(href = "/cookies") { +"Cookie Policy" }
                        a(href = "/refund-policy") { +"Refund Policy" }
                        button(classes = "footer-cookie-settings") {
                            attributes["id"] = "cookie-settings-btn"
                            attributes["type"] = "button"
                            +"Cookie settings"
                        }
                    }
                    span(classes = "footer-copy") { +"© 2026 Housora" }
                }
            }
        }
        } // end create-page

        // Serve Clerk locally so authentication is reliable even when a browser
        // blocks third-party CDNs or the Clerk custom domain is unavailable.
        script(src = "/static/vendor/clerk-ui/ui.browser.js") {
            attributes["defer"] = "true"
        }
        script(src = "/static/vendor/clerk-js/clerk.browser.js") {
            attributes["defer"] = "true"
            if (ClerkConfig.publishableKey.isNotBlank()) {
                attributes["data-clerk-publishable-key"] = ClerkConfig.publishableKey
            }
        }
        script(src = "/static/js/clerk-bootstrap.js") {
            attributes["defer"] = "true"
        }
        script(src = "/static/vendor/posthog/posthog.js") {}
        script {
            unsafe {
                +"""
                window.HousoraPostHog = {
                    key: '${PostHogConfig.projectKey.replace("'", "\\'")}',
                    host: '${PostHogConfig.host.replace("'", "\\'")}'
                };
                """
            }
        }
        // Convex SDK
        script(src = "https://js.convex.dev") {}
        script {
            unsafe {
                +"""
                (function() {
                    var clerkPubKey = '${ClerkConfig.publishableKey}';
                    var convexUrl = '${ConvexConfig.url}';
                    var isDev = window.location.hostname === 'localhost';
                    var loadingEl = document.getElementById('clerk-loading');

                    function showLoading() { if (loadingEl) loadingEl.style.display = 'flex'; }
                    function hideLoading() { if (loadingEl) loadingEl.style.display = 'none'; }

                    function showError(msg) {
                        hideLoading();
                        if (!isDev) return;
                        var existing = document.getElementById('clerk-error');
                        if (existing) existing.remove();
                        var el = document.createElement('div');
                        el.id = 'clerk-error';
                        el.className = 'clerk-error-message';
                        var errorText = document.createElement('span');
                        errorText.className = 'clerk-error-text';
                        errorText.textContent = String(msg || 'Authentication could not be loaded.');
                        var retry = document.createElement('button');
                        retry.className = 'clerk-error-retry';
                        retry.type = 'button';
                        retry.textContent = 'Retry';
                        retry.addEventListener('click', function() { window.location.reload(); });
                        el.append(errorText, retry);
                        document.body.appendChild(el);
                    }

                    async function initializeClerk(Clerk) {
                        // The bootstrap script and the page listener can both
                        // observe clerk:ready. Guard against re-entering this
                        // initializer when it dispatches the ready event.
                        if (window.ClerkReady) return;
                        showLoading();
                        if (!clerkPubKey) {
                            hideLoading();
                            return;
                        }
                        if (!Clerk) {
                            showError('Authentication SDK failed to load. Please refresh the page.');
                            return;
                        }
                        try {
                            hideLoading();
                            window.ClerkReady = true;
                            window.dispatchEvent(new CustomEvent('clerk:ready', { detail: { clerk: Clerk } }));
                            updateSidebarAuth(Clerk);
                        } catch(e) {
                            console.error('[Clerk] Init failed:', e);
                            showError('Authentication initialization failed. ' + (e.message || 'Please try again.'));
                        }

                        if (window.convex && convexUrl) {
                            try {
                                window.convexClient = new window.convex.ConvexClient(convexUrl);
                                // Wire up Clerk JWT so ctx.auth.getUserIdentity() works in Convex
                                Clerk.addListener(function(state) {
                                    if (state.user) {
                                        window.convexClient.setAuth(function() {
                                            return state.user.getToken();
                                        });
                                    } else {
                                        window.convexClient.clearAuth();
                                    }
                                    updateSidebarAuth(Clerk);
                                });
                            } catch(e) {
                                console.error('[Convex] Init failed:', e);
                            }
                        }
                    }

                    window.addEventListener('clerk:ready', function(e) {
                        initializeClerk(e.detail && e.detail.clerk ? e.detail.clerk : window.Clerk);
                    });
                    window.addEventListener('clerk:error', function() {
                        showError('Authentication SDK failed to load. Please refresh the page.');
                    });
                    window.addEventListener('load', function() {
                        // clerk-bootstrap owns loading; wait for its completed production initialization.
                        if (window.housoraAuthState && window.housoraAuthState.status === 'ready' && window.Clerk && !window.ClerkReady) initializeClerk(window.Clerk);
                    });

                    function updateSidebarAuth(Clerk) {
                        var publicPath = window.location.pathname;
                        if (Clerk.user && publicPath === '/') {
                            window.location.replace('/app/home');
                            return;
                        }
                        if (!Clerk.user && publicPath.indexOf('/app') === 0) {
                            window.location.replace('/sign-in?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
                            return;
                        }
                        var userInfo = document.getElementById('sidebar-user-info');
                        var authSection = document.getElementById('sidebar-auth-section');
                        var accountLinks = document.getElementById('sidebar-account-links');
                        if (Clerk.user) {
                            if (window.HousoraAnalytics) window.HousoraAnalytics.identify(Clerk.user);
                            if (accountLinks) accountLinks.style.display = 'block';
                            window.HousoraUser = {
                                name: Clerk.user.firstName || Clerk.user.emailAddresses[0]?.emailAddress || 'User',
                                email: Clerk.user.emailAddresses[0]?.emailAddress || '',
                                imageUrl: Clerk.user.imageUrl || ''
                            };
                            // Show user info in sidebar
                            if (userInfo) {
                                userInfo.style.display = 'flex';
                                var nameEl = document.getElementById('sidebar-user-name');
                                var emailEl = document.getElementById('sidebar-user-email');
                                var avatarEl = document.getElementById('sidebar-user-avatar');
                                if (nameEl) nameEl.textContent = window.HousoraUser.name;
                                if (emailEl) emailEl.textContent = window.HousoraUser.email;
                                if (avatarEl && window.HousoraUser.imageUrl) {
                                    var avatarImage = document.createElement('img');
                                    avatarImage.src = window.HousoraUser.imageUrl;
                                    avatarImage.alt = '';
                                    avatarImage.width = 36;
                                    avatarImage.height = 36;
                                    avatarImage.className = 'sidebar-avatar-image';
                                    avatarEl.replaceChildren(avatarImage);
                                } else if (avatarEl) {
                                    var avatarInitial = document.createElement('span');
                                    avatarInitial.className = 'sidebar-avatar-initial';
                                    avatarInitial.setAttribute('aria-hidden', 'true');
                                    avatarInitial.textContent = window.HousoraUser.name.charAt(0).toUpperCase();
                                    avatarEl.replaceChildren(avatarInitial);
                                }
                            }
                            // Replace sign-in/up links with sign-out
                            if (authSection) {
                                authSection.replaceChildren();
                                [['/pricing#billing-help', 'Manage Plan & Refunds', 'sidebar-manage-plan-link'], ['/sign-out', 'Sign Out', 'sidebar-signout-link'], ['/delete-account', 'Delete Account', 'sidebar-delete-account-link']].forEach(function(item) {
                                    var link = document.createElement('a');
                                    link.href = item[0];
                                    link.className = 'sidebar-link ' + item[2];
                                    link.textContent = item[1];
                                    authSection.appendChild(link);
                                });
                            }
                        } else {
                            if (window.HousoraAnalytics) window.HousoraAnalytics.reset();
                            if (accountLinks) accountLinks.style.display = 'none';
                            if (userInfo) userInfo.style.display = 'none';
                            // Show sign-in/up links
                            if (authSection) {
                                authSection.replaceChildren();
                                [['/sign-in', 'Sign In', 'sidebar-signin-link'], ['/sign-up', 'Create Account', 'sidebar-signup-link']].forEach(function(item) {
                                    var link = document.createElement('a');
                                    link.href = item[0];
                                    link.className = 'sidebar-link ' + item[2];
                                    link.textContent = item[1];
                                    authSection.appendChild(link);
                                });
                            }
                        }
                    }
                })();
                """
            }
        }
        script(src = "/static/js/i18n.js") {}
        script(src = "/static/js/main.js") {}

        // First-party consent panel. Optional analytics is disabled by default.
        div(classes = "cookiebot-panel") {
            attributes["id"] = "cookiebot-panel"
            attributes["role"] = "region"
            attributes["aria-labelledby"] = "cookie-consent-title"
            attributes["aria-describedby"] = "cookie-consent-message"
            div(classes = "cookiebot-desktop") {
                div(classes = "cookiebot-content") {
                    h4(classes = "cookiebot-title") {
                        id = "cookie-consent-title"
                        attributes["data-i18n"] = "cookie.title"
                        +"Your privacy choices"
                    }
                    p(classes = "cookiebot-message") {
                        id = "cookie-consent-message"
                        attributes["data-i18n"] = "cookie.message"
                        +"Housora uses necessary storage for security and your choices. With permission, PostHog measures page visits and product events. Analytics is off by default and never includes your uploaded images or prompts. You can change this later in the footer."
                    }
                    div(classes = "cookiebot-toggles") {
                        div(classes = "cookiebot-toggle-row") {
                            div(classes = "cookiebot-toggle-copy") {
                                span(classes = "cookiebot-toggle-label") {
                                    id = "cookie-label-necessary"
                                    attributes["data-i18n"] = "cookie.necessary"
                                    +"Necessary"
                                }
                                span(classes = "cookiebot-toggle-description") { +"Security, sign-in, privacy choices, and features you request" }
                            }
                            label(classes = "cookiebot-toggle") {
                                unsafe { +"""<input type="checkbox" class="cookiebot-checkbox" name="necessary" aria-labelledby="cookie-label-necessary" checked disabled>""" }
                                span(classes = "cookiebot-toggle-slider") {}
                            }
                        }
                        div(classes = "cookiebot-toggle-row") {
                            div(classes = "cookiebot-toggle-copy") {
                                span(classes = "cookiebot-toggle-label") {
                                    id = "cookie-label-analytics"
                                    attributes["data-i18n"] = "cookie.analytics"
                                    +"Analytics"
                                }
                                span(classes = "cookiebot-toggle-description") { +"Optional PostHog page paths and product events" }
                            }
                            label(classes = "cookiebot-toggle") {
                                unsafe { +"""<input type="checkbox" class="cookiebot-checkbox" name="analytics" aria-labelledby="cookie-label-analytics">""" }
                                span(classes = "cookiebot-toggle-slider") {}
                            }
                        }
                        a(href = "/cookies", classes = "cookiebot-details-link") {
                            attributes["data-i18n"] = "cookie.show_details"
                            +"Read the Cookie & Storage Policy"
                        }
                    }
                }
                div(classes = "cookiebot-actions") {
                    button(classes = "cookiebot-btn-choice") {
                        attributes["id"] = "cookiebot-necessary-btn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "cookie.necessary_only"
                        +"Reject analytics"
                    }
                    button(classes = "cookiebot-btn-secondary") {
                        attributes["id"] = "cookiebot-save-btn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "cookie.save_choices"
                        +"Save choices"
                    }
                    button(classes = "cookiebot-btn-choice") {
                        attributes["id"] = "cookiebot-ok-btn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "cookie.accept_all"
                        +"Allow analytics"
                    }
                }
            }
        }

    }
}
