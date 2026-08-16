package com.housora.pages

import kotlinx.html.*
import com.housora.templates.aiTools
import com.housora.templates.baseLayout

private val workspaceToolImages = mapOf(
    "/interior-design" to "/static/images/room-after-640w.webp",
    "/exterior-design" to "/static/images/hero-after-1376w.avif",
    "/garden-design" to "/static/images/garden-after-320w.webp",
    "/ai-kitchen-design" to "/static/images/kitchen-after-1376w.avif",
    "/ai-bathroom-design" to "/static/images/bathroom-after-640w.webp",
    "/floorplan-to-3d" to "/static/images/floorplan-after-640w.avif"
)

fun HTML.appHomePage() {
    baseLayout("Housora App | Home", bodyClass = "page-app-home", path = "/app/home") {
        section("workspace-home") {
            div("workspace-home-heading") {
                div {
                    span("workspace-eyebrow") { +"WORKSPACE" }
                    h1 { +"What will you design today?" }
                    p { +"Choose a tool, upload your space, and turn your idea into a finished design." }
                }
                a(href = "#workspace-tools", classes = "workspace-primary-action") { +"+  Choose a tool" }
            }
            div("workspace-featured-grid") {
                a(href = "/interior-design", classes = "workspace-featured-card workspace-featured-main") {
                    img(src = "/static/images/room-after-640w.webp", alt = "Warm modern living room created with Housora")
                    div("workspace-featured-overlay") { span { +"MOST POPULAR" }; h2 { +"AI Interior Design" }; p { +"Redesign any room while preserving its architecture." }; strong { +"Start designing →" } }
                }
                div("workspace-featured-stack") {
                    a(href = "/exterior-design", classes = "workspace-featured-card workspace-featured-small") {
                        img(src = "/static/images/hero-after-1376w.avif", alt = "Modern home exterior created with Housora")
                        div("workspace-featured-overlay") { h2 { +"Exterior Design" }; strong { +"Open tool →" } }
                    }
                    a(href = "/garden-design", classes = "workspace-featured-card workspace-featured-small") {
                        img(src = "/static/images/garden-after-320w.webp", alt = "Landscaped garden created with Housora")
                        div("workspace-featured-overlay") { h2 { +"Garden Design" }; strong { +"Open tool →" } }
                    }
                }
            }
            div("workspace-section-heading") { attributes["id"] = "workspace-tools"; div { h2 { +"AI Tools" }; p { +"Everything you need to reimagine rooms, finishes, and outdoor spaces." } } }
            div("workspace-tools-grid") {
                aiTools.forEach { tool ->
                    a(href = tool.path, classes = "workspace-tool-card") {
                        val image = workspaceToolImages[tool.path]
                        if (image != null) img(src = image, alt = "") else div("workspace-tool-placeholder") { +tool.name.removePrefix("AI ").take(1) }
                        div { h3 { +tool.name.removePrefix("AI ") }; p { +when (tool.path) {
                            "/layout-boost" -> "Explore a smarter furniture layout."
                            "/wall-texture" -> "Preview new wall materials and finishes."
                            "/floor-restyle" -> "Try a new floor without changing the room."
                            "/video-walkthrough" -> "Bring a finished concept to life."
                            "/reference-style" -> "Guide a redesign with an image you love."
                            else -> "Create a focused design for your space."
                        } } }
                        span(classes = "workspace-tool-arrow") { +"→" }
                    }
                }
            }
            div("workspace-home-bottom") {
                div("workspace-recent-card") {
                    div("workspace-section-heading") { div { h2 { +"Recent projects" }; p { +"Continue where you left off." } }; a(href = "/projects") { +"View all" } }
                    div("workspace-empty-projects") { span { +"◇" }; div { h3 { +"No projects yet" }; p { +"Your saved designs will appear here." } }; a(href = "/design") { +"Create your first project" } }
                }
                div("workspace-home-usage") {
                    span("workspace-eyebrow") { +"CURRENT PLAN" }; h2 { attributes["id"] = "workspace-home-plan"; +"Free" }; p { attributes["id"] = "workspace-home-usage"; +"Loading your image allowance…" }
                    div("workspace-home-usage-track") { span { attributes["id"] = "workspace-home-progress" } }
                    a(href = "/app/plan") { +"View plans and usage →" }
                }
            }
        }
    }
}
