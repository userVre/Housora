package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.styleQuizPage() {
    baseLayout("Style Quiz | Housora AI Interior Design") {
        // Hero Section
        section(classes = "quiz-hero-section") {
            div(classes = "quiz-hero-inner") {
                div(classes = "quiz-hero-left") {
                    span(classes = "tool-badge") {
                        i("lucide trophy") {}
                        +"The free 60 second style quiz"
                    }
                    h1(classes = "quiz-hero-title") { +"WHAT'S YOUR INTERIOR DESIGN STYLE?" }
                    p(classes = "quiz-hero-sub") {
                        +"Answer 10 quick visual questions. Pick the sofa, the lighting, the palette you love, and we'll match you to one of the 14 most popular design styles. Then see your own room restyled in it with AI."
                    }
                    a(href = "#quiz-start", classes = "btn-quiz-start") { +"Start the quiz" }
                    div(classes = "social-proof-bar-inline") {
                        div(classes = "proof-avatars-inline") {
                            repeat(4) { div(classes = "avatar-inline") {} }
                        }
                        div(classes = "proof-text-inline") {
                            strong { +"Your own space, your own direction" }
                            span { +"Explore concepts grounded in your photo." }
                        }
                        div(classes = "proof-divider-inline") {}
                        div(classes = "proof-rating-inline") {
                            div(classes = "stars-inline") { +"★★★★★" }
                            span { +"Preview mode from A growing design toolkit" }
                        }
                    }
                }
                div(classes = "quiz-hero-right") {
                    div(classes = "quiz-hero-images") {
                        img(src = "/static/images/interior-after.jpg", alt = "AI interior design living room") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                        img(src = "/static/images/room-after.jpg", alt = "AI minimalist living room design") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                        img(src = "/static/images/layout-after.jpg", alt = "AI room layout") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                        img(src = "/static/images/floor-after.jpg", alt = "AI floor restyle") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                        img(src = "/static/images/walls-texture-after.jpg", alt = "AI wall texture") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                        img(src = "/static/images/hero-after.jpg", alt = "AI interior design") {
                            attributes["width"] = "200"
                            attributes["height"] = "140"
                            attributes["loading"] = "eager"
                            attributes["onerror"] = "this.style.opacity='0.3'"
                        }
                    }
                }
            }
        }

        // 14 Styles Section
        section(classes = "quiz-styles-section") {
            div(classes = "quiz-styles-inner") {
                h2(classes = "section-heading-center") { +"THE 14 STYLES YOU COULD MATCH" }
                div(classes = "quiz-styles-grid") {
                    val styles = listOf(
                        Pair("Scandinavian", "/static/images/room-after.jpg"),
                        Pair("Modern", "/static/images/interior-after.jpg"),
                        Pair("Minimalist", "/static/images/layout-after.jpg"),
                        Pair("Industrial", "/static/images/walls-texture-after.jpg"),
                        Pair("Mid-Century Modern", "/static/images/hero-after.jpg"),
                        Pair("Bohemian", "/static/images/try-after.jpg"),
                        Pair("Coastal", "/static/images/render-after.jpg"),
                        Pair("Farmhouse", "/static/images/floor-after.jpg"),
                        Pair("Japandi", "/static/images/interior-after.jpg"),
                        Pair("Traditional", "/static/images/room-after.jpg"),
                        Pair("Transitional", "/static/images/layout-after.jpg"),
                        Pair("Art Deco", "/static/images/walls-texture-after.jpg"),
                        Pair("Luxury", "/static/images/interior-after.jpg"),
                        Pair("Rustic", "/static/images/hero-after.jpg")
                    )
                    styles.forEach { (name, img) ->
                        div(classes = "quiz-style-card") {
                            img(src = img, alt = name) {
                                attributes["width"] = "200"
                                attributes["height"] = "140"
                                attributes["loading"] = "lazy"
                                attributes["onerror"] = "this.style.opacity='0.3'"
                            }
                            span(classes = "quiz-style-name") { +name }
                        }
                    }
                }
            }
        }

        // Quiz Section
        section(classes = "quiz-section") { id = "quiz-start"
            div(classes = "quiz-inner") {
                div(classes = "quiz-progress") {
                    div(classes = "quiz-progress-bar") {
                        div(classes = "quiz-progress-fill") { id = "quizProgressFill" }
                    }
                    span(classes = "quiz-progress-text") { id = "quizProgressText"; +"Question 1 of 10" }
                }
                div(classes = "quiz-card") { id = "quizCard"
                    h3(classes = "quiz-question") { id = "quizQuestion"; +"Which living room appeals to you most?" }
                    div(classes = "quiz-options") { id = "quizOptions"
                        div(classes = "quiz-option") {
                            img(src = "/static/images/interior-after.jpg", alt = "Modern interior design") {
                                attributes["width"] = "120"
                                attributes["height"] = "84"
                                attributes["onerror"] = "this.style.opacity='0.3'"
                            }
                            span { +"Modern" }
                        }
                        div(classes = "quiz-option") {
                            img(src = "/static/images/room-after.jpg", alt = "Scandinavian living room") {
                                attributes["width"] = "120"
                                attributes["height"] = "84"
                                attributes["onerror"] = "this.style.opacity='0.3'"
                            }
                            span { +"Scandinavian" }
                        }
                        div(classes = "quiz-option") {
                            img(src = "/static/images/kitchen-after.jpg", alt = "Minimalist kitchen") {
                                attributes["width"] = "120"
                                attributes["height"] = "84"
                                attributes["onerror"] = "this.style.opacity='0.3'"
                            }
                            span { +"Minimalist" }
                        }
                        div(classes = "quiz-option") {
                            img(src = "/static/images/walls-texture-after.jpg", alt = "Industrial wall design") {
                                attributes["width"] = "120"
                                attributes["height"] = "84"
                                attributes["onerror"] = "this.style.opacity='0.3'"
                            }
                            span { +"Industrial" }
                        }
                    }
                }
                div(classes = "quiz-result hidden") { id = "quizResult"
                    h2(classes = "quiz-result-title") { id = "quizResultTitle"; +"Your Style: Modern" }
                    p(classes = "quiz-result-desc") { id = "quizResultDesc"; +"Based on your answers, you prefer clean lines, neutral colors, and functional furniture." }
                    a(href = "/design", classes = "btn-primary btn-large") { +"Try This Style Now" }
                }
            }
        }
    }
}
