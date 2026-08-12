package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

private data class BlogPost(
    val slug: String,
    val img: String,
    val category: String,
    val title: String,
    val excerpt: String,
    val date: String,
    val readTime: String,
    val paragraphs: List<String>
)

private val blogPosts = listOf(
    BlogPost("exterior-colour-palettes", "/static/images/exterior-after.jpg", "RENOVATION", "Exterior colour palettes that are easy to live with", "A practical way to compare exterior colours before you commit to paint, siding, or trim.", "July 21, 2026", "6 min read", listOf(
        "Choosing an exterior colour is harder than choosing a swatch in a shop. Sunlight, roof materials, neighbouring homes, and the colour of your windows all change how the final result feels.",
        "Start with the fixed elements you are keeping. A warm roof usually sits more comfortably beside a warm white, muted olive, clay, or deep brown than a sharp blue-grey. If the home already has strong stone or brick, use those tones as the anchor and keep the paint quieter.",
        "The safest workflow is to compare a few restrained directions on a photo of the actual home. Treat an AI visual as a planning sketch rather than a promise: test real paint samples in daylight before buying materials."
    )),
    BlogPost("planning-a-room-redesign", "/static/images/interior-after.jpg", "INTERIOR DESIGN", "How to plan a room redesign without losing your way", "A calm, photo-first process for testing layout, materials, and mood before shopping.", "July 21, 2026", "5 min read", listOf(
        "A good redesign starts with the room you have, not an imaginary room. Photograph it in daylight, note what must stay, and decide what the room needs to do for you every day.",
        "Try one direction at a time: first the layout, then the style, then the colour balance. Changing everything at once makes it difficult to understand which choice actually improved the room.",
        "Housora can help you explore ideas quickly, but the final decisions still belong to you. Measure key walls and furniture, save the concepts you like, and use them as a brief when you shop or speak with a designer."
    )),
    BlogPost("photo-to-video-room-tour", "/static/images/room-after.jpg", "AI TOOLS", "Turning one room photo into a simple video tour", "What makes an image-to-video room walkthrough useful, and where to keep expectations realistic.", "July 20, 2026", "5 min read", listOf(
        "A short camera move can communicate the feeling of a room better than a still image. The most useful source photo is clear, level, and wide enough to show the main depth of the space.",
        "Use a gentle movement for most rooms: a slow pan, a small push-in, or a restrained orbit. Dramatic camera directions can be fun, but they also make geometry errors more noticeable.",
        "Generated video is a visual concept, not a measured survey. Check doors, windows, stairs, and furniture placement against the original photo before using the result in a property listing or client presentation."
    )),
    BlogPost("architecture-prompt-basics", "/static/images/kitchen-after.jpg", "AI TOOLS", "A better way to write architecture prompts", "Small prompt details that help an image model understand materials, light, and camera position.", "July 20, 2026", "6 min read", listOf(
        "Strong prompts describe the subject before they describe the mood. Start with the building or room, then mention the view, materials, lighting, and the camera position you want to preserve.",
        "Instead of stacking ten unrelated styles, make one clear request: for example, a compact courtyard house with pale stone, timber screens, soft morning light, and a three-quarter street view.",
        "If the result keeps changing the structure, add constraints such as preserve the roofline, openings, proportions, and perspective. A reference image and a short, specific brief usually work better than a long list of adjectives."
    )),
    BlogPost("choosing-furniture-with-confidence", "/static/images/bathroom-after.jpg", "INTERIOR DESIGN", "Choosing furniture with more confidence", "A simple checklist for judging proportion, comfort, and finish before you buy.", "July 19, 2026", "5 min read", listOf(
        "A beautiful product can still be wrong for a room. Check the walking paths first, then the scale of the largest pieces, and only then worry about accent colours.",
        "Use a visual concept to compare directions, not to assume that a particular product will appear exactly as rendered. Always verify measurements, materials, delivery, and return terms with the seller.",
        "The best room usually has a mix of quiet and character: one or two pieces that lead the composition, surrounded by simpler pieces that leave the space comfortable to use."
    )),
    BlogPost("garden-design-brief", "/static/images/garden-after.jpg", "OUTDOOR DESIGN", "How to write a useful garden design brief", "Turn a vague outdoor wish list into a brief that is easier to visualise and discuss.", "July 18, 2026", "5 min read", listOf(
        "Begin with how you want to use the garden: dining, play, entertaining, growing food, relaxing, or a mixture. That decision affects every later choice.",
        "Record the practical limits too: sun, shade, wind, drainage, privacy, access, and the amount of maintenance you can realistically provide. These details matter more than a trend label.",
        "When you explore concepts with Housora, include those constraints in your prompt and compare a few planting and furniture directions. Ask a local professional to check plant suitability and construction details before work begins."
    )),
    BlogPost("room-walkthrough-storytelling", "/static/images/layout-after.jpg", "REAL ESTATE", "Making a room walkthrough tell a clearer story", "A short visual sequence works best when it has a beginning, middle, and end.", "July 18, 2026", "4 min read", listOf(
        "Open with the room’s strongest view, move through the space at a comfortable pace, and finish on the detail you want people to remember. The sequence should feel intentional rather than fast.",
        "For a listing, make sure the video agrees with the original photos and the written description. Virtual staging should be identified clearly so viewers understand what is real and what is conceptual.",
        "Keep the movement subtle and the export easy to watch on a phone. A short, legible tour is more useful than an impressive effect that hides the room’s actual proportions."
    )),
    BlogPost("comparing-ai-design-tools", "/static/images/walls-texture-after.jpg", "AI TOOLS", "How to compare AI design tools fairly", "The useful questions to ask before choosing an image-based design service.", "July 18, 2026", "5 min read", listOf(
        "Look beyond the demo image. Check which file types are accepted, whether your uploads are private, how long results are retained, and whether the service lets you download your work.",
        "Compare control as well as image quality. Room type, style, colour, aspect ratio, and prompt controls make a tool easier to use when you are exploring a real project.",
        "Finally, verify the current pricing and generation limits on the provider’s own plan page. Product names, model availability, and prices change quickly, so old comparison articles can become misleading."
    )),
    BlogPost("black-doors-without-regret", "/static/images/door-black-crittall.jpg", "INTERIOR DESIGN", "Trying bold interior doors before you commit", "Use contrast thoughtfully so dark doors feel designed rather than accidental.", "July 17, 2026", "4 min read", listOf(
        "Dark doors can give a room rhythm and make pale walls feel more architectural. The effect is strongest when the colour repeats somewhere else, such as in a light fitting, frame, handle, or piece of furniture.",
        "Pay attention to the hallway as well as the room. A bold door may look perfect in isolation but feel abrupt when several rooms meet in a narrow passage.",
        "Preview a few shades on your own photo, then paint a sample board and view it in morning, afternoon, and evening light. Digital previews are useful for direction, not a substitute for a real sample."
    ))
)

val blogPostSlugs: List<String> = blogPosts.map { it.slug }

fun blogPostExists(slug: String): Boolean = slug in blogPostSlugs

fun HTML.blogPage() {
    baseLayout("Blog | Housora AI Interior Design", bodyClass = "page-blog", path = "/blog") {
        section(classes = "blog-hero") {
            div(classes = "blog-hero-inner") {
                h1(classes = "blog-hero-title") { +"BLOG" }
                p(classes = "blog-hero-sub") { +"Interior design tips, AI insights, and product updates" }
            }
        }
        section(classes = "blog-grid-section") {
            div(classes = "blog-grid-inner") {
                div(classes = "blog-grid") {
                    blogPosts.forEach { post ->
                        a(href = "/blog/${post.slug}", classes = "blog-card") {
                            div(classes = "blog-card-img") {
                                img(src = post.img, alt = post.title) {
                                    attributes["width"] = "400"
                                    attributes["height"] = "240"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                            }
                            div(classes = "blog-card-body") {
                                span(classes = "blog-card-category") { +post.category }
                                h3(classes = "blog-card-title") { +post.title }
                                p(classes = "blog-card-excerpt") { +post.excerpt }
                                div(classes = "blog-card-meta") {
                                    span { +post.date }
                                    span { +" \u2022 " }
                                    span { +post.readTime }
                                }
                            }
                        }
                    }
                }
            }
        }
        section(classes = "tool-cta") {
            div(classes = "tool-cta-inner") {
                h2(classes = "cta-heading") { +"READY TO REDESIGN YOUR ROOM?" }
                p(classes = "cta-subtext") { +"Try Housora AI and see your space transformed in seconds" }
                div(classes = "cta-buttons") {
                    a(href = "/design#editor", classes = "btn-primary btn-large") { +"TRY HOUSORA FREE" }
                    a(href = "/pricing", classes = "btn-secondary") { +"View Pricing" }
                }
            }
        }
    }
}

fun HTML.blogArticlePage(slug: String) {
    val post = blogPosts.firstOrNull { it.slug == slug }
    if (post == null) {
        blogPage()
        return
    }
    val articleUrl = com.housora.WebsiteConfig.resolveUrl("/blog/${post.slug}")
    val publishedDay = post.date.substringAfter("July ").substringBefore(",").padStart(2, '0')
    val articleSchema = """{"@context":"https://schema.org","@type":"Article","headline":"${post.title.replace("\"", "\\\"")}","description":"${post.excerpt.replace("\"", "\\\"")}","datePublished":"2026-07-$publishedDay","author":{"@type":"Organization","name":"Housora"},"publisher":{"@type":"Organization","name":"Housora"},"image":"${com.housora.WebsiteConfig.resolveUrl(post.img)}","mainEntityOfPage":"$articleUrl"}"""
    baseLayout("${post.title} | Housora", bodyClass = "page-blog", path = "/blog/${post.slug}", structuredData = articleSchema) {
        article(classes = "blog-article") {
            div(classes = "blog-article-inner") {
                a(href = "/blog", classes = "blog-article-back") { +"← Back to blog" }
                span(classes = "blog-card-category") { +post.category }
                h1(classes = "blog-article-title") { +post.title }
                p(classes = "blog-article-meta") { +"${post.date} • ${post.readTime}" }
                img(src = post.img, alt = post.title, classes = "blog-article-image")
                div(classes = "blog-article-copy") {
                    post.paragraphs.forEach { paragraph -> p { +paragraph } }
                }
                a(href = "/design#editor", classes = "btn-primary btn-large") { +"Explore this idea with Housora" }
            }
        }
    }
}

fun HTML.blogNotFoundPage() {
    baseLayout("Article Not Found | Housora", bodyClass = "page-blog") {
        section(classes = "blog-hero") {
            div(classes = "blog-hero-inner") {
                h1(classes = "blog-hero-title") { +"ARTICLE NOT FOUND" }
                p(classes = "blog-hero-sub") { +"That article does not exist or is no longer available." }
                a(href = "/blog", classes = "btn-primary") { +"BACK TO THE BLOG" }
            }
        }
    }
}
