package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.examplesPage() {
    baseLayout("Interior Design Examples | Housora AI") {
        section(classes = "examples-hero") {
            div(classes = "examples-hero-inner") {
                h1(classes = "examples-hero-title") { +"Interior Design Examples for the 15 Most Popular Styles" }
                p(classes = "examples-hero-sub") { +"Explore original Housora concepts across popular styles, then try a direction on your own room photo." }
                a(href = "/interior-design#try-it-now", classes = "btn-primary btn-large") { +"TRY IT ON YOUR ROOM FREE "; i("lucide arrow-right") {} }
                // Social proof
                    div(classes = "social-proof-bar-inline") {
                    div(classes = "proof-avatars-inline") {
                        repeat(4) { div(classes = "avatar-inline") {} }
                    }
                    div(classes = "proof-text-inline") {
                        strong { +"Your own space, your own direction" }
                        span { +"Explore concepts grounded in your photo." }
                    }
                    div(classes = "proof-divider-inline") {}
                    div(classes = "proof-text-inline") {
                        strong { +"Built for exploration" }
                        span { +"A growing design toolkit" }
                    }
                    div(classes = "proof-rating-inline") {
                        div(classes = "stars-inline") { +"★★★★★" }
                        span { +"Preview mode" }
                    }
                }
            }
        }
        section(classes = "examples-layout") {
            div(classes = "examples-inner") {
                // Left sidebar
                aside(classes = "examples-sidebar") {
                    h3(classes = "sidebar-styles-label") { +"STYLES" }
                    ul(classes = "styles-list") {
                        val styles = listOf(
                            "Scandinavian", "Modern", "Minimalist", "Industrial",
                            "Mid-Century Modern", "Bohemian", "Coastal", "Farmhouse",
                            "Japandi", "Traditional", "Transitional", "Art Deco"
                        )
                        styles.forEachIndexed { index, style ->
                            li(classes = if (index == 0) "style-item active" else "style-item") {
                                a(href = "#style-${style.lowercase().replace(" ", "-")}") { +style }
                            }
                        }
                    }
                }
                // Right content
                main(classes = "examples-content") {
                    val styleDetails = listOf(
                        Triple("Scandinavian", "/static/images/room-after.jpg", "Light woods, soft neutrals, and clutter-free calm."),
                        Triple("Modern", "/static/images/interior-after.jpg", "Clean lines, neutral colors, and functional furniture."),
                        Triple("Minimalist", "/static/images/layout-after.jpg", "Less is more with essential furniture only."),
                        Triple("Industrial", "/static/images/interior-industrial.jpg", "Exposed brick, metal accents, and raw textures."),
                        Triple("Mid-Century Modern", "/static/images/interior-after.jpg", "Retro furniture with organic forms and bold colors."),
                        Triple("Bohemian", "/static/images/room-after.jpg", "Eclectic mix of colors, patterns, and textures."),
                        Triple("Coastal", "/static/images/interior-coastal.jpg", "Light blues, whites, and natural materials."),
                        Triple("Farmhouse", "/static/images/kitchen-after.jpg", "Rustic charm with modern comforts."),
                        Triple("Japandi", "/static/images/interior-after.jpg", "Japanese minimalism meets Scandinavian warmth."),
                        Triple("Traditional", "/static/images/interior-after.jpg", "Classic furniture with ornate details."),
                        Triple("Transitional", "/static/images/layout-after.jpg", "Blend of traditional and modern elements."),
                        Triple("Art Deco", "/static/images/walls-texture-after.jpg", "Bold geometric patterns and luxurious materials.")
                    )
                    styleDetails.forEach { (name, img, desc) ->
                        div(classes = "style-detail-section") {
                            id = "style-${name.lowercase().replace(" ", "-")}"
                            div(classes = "style-detail-content") {
                                div(classes = "style-detail-image") {
                                    img(src = img, alt = "$name Interior Design") {
                                        attributes["width"] = "600"
                                        attributes["height"] = "400"
                                        attributes["loading"] = "lazy"
                                        attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                    }
                                }
                                div(classes = "style-detail-text") {
                                    h2(classes = "style-detail-title") { +"${name.uppercase()} INTERIOR DESIGN" }
                                    p(classes = "style-detail-subtitle") { +desc }
                            a(href = "/reference-style?reference=${img}", classes = "style-detail-link") { +"Try ${name} on your room" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
