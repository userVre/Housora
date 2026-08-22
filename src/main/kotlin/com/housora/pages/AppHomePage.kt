package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

private data class HomeTool(val label: String, val path: String, val image: String, val description: String)

private val popularHomeTools = listOf(
    HomeTool("AI Interior Design", "/interior-design", "/static/images/tools/interior-design-hero.jpg", "Redesign any room from your own photo."),
    HomeTool("AI Kitchen Design", "/ai-kitchen-design", "/static/images/tools/kitchen-design-hero-v2.jpg", "Explore cabinets, worktops, colours, and layout."),
    HomeTool("AI Bathroom Design", "/ai-bathroom-design", "/static/images/tools/bathroom-design-hero.jpg", "Try new tiles, fixtures, storage, and finishes."),
    HomeTool("AI Exterior Design", "/exterior-design", "/static/images/tools/exterior-design-hero.jpg", "Reimagine your home's materials and curb appeal."),
    HomeTool("AI Garden Design", "/garden-design", "/static/images/tools/garden-design-hero.jpg", "Plan planting, pathways, and outdoor living."),
    HomeTool("AI Layout Boost", "/layout-boost", "/static/images/tools/layout-boost-hero-v2.jpg", "Find a better furniture arrangement and flow."),
    HomeTool("AI Wall Texture", "/wall-texture", "/static/images/tools/wall-texture-hero.jpg", "Visualize paint, plaster, panels, and texture."),
    HomeTool("AI Floor Restyle", "/floor-restyle", "/static/images/tools/floor-restyle-hero.jpg", "Compare flooring materials in your real space.")
)

private val moreHomeTools = listOf(
    HomeTool("AI Stairs Design", "/ai-stairs-design", "/static/images/tools/stairs-design-hero.jpg", "Explore stairs, treads, railings, and finishes."),
    HomeTool("AI Doors Design", "/ai-doors-design", "/static/images/doors-after.jpg", "Try different door styles, colours, and hardware."),
    HomeTool("AI Windows Design", "/ai-windows-design", "/static/images/tools/windows-design-hero-v2.jpg", "Explore frames, glazing, shapes, and proportions."),
    HomeTool("AI Floorplan to 3D", "/floorplan-to-3d", "/static/images/tools/floorplan-to-3d-hero.jpg", "Turn a flat floorplan into a spatial concept."),
    HomeTool("AI Photo to Render", "/photo-to-render", "/static/images/tools/photo-to-render-hero-v2.jpg", "Transform a draft or photo into a polished render."),
    HomeTool("Reference Style", "/reference-style", "/static/images/gallery-warm-render.jpg", "Bring an inspiration image's look into your room."),
    HomeTool("AI Video Walkthrough", "/video-walkthrough", "/static/images/tools/video-walkthrough-hero-v2.jpg", "Create a moving tour from a finished design.")
)

private fun FlowContent.toolCard(tool: HomeTool) {
    a(href = tool.path, classes = "workspace-home-tool-card") {
        div("workspace-home-tool-media") {
            img(src = tool.image, alt = "", classes = "workspace-home-tool-image") {
                attributes["loading"] = "lazy"; attributes["width"] = "640"; attributes["height"] = "420"
            }
            span("workspace-home-tool-open") { attributes["aria-hidden"] = "true"; +"↗" }
        }
        div("workspace-home-tool-copy") { h2 { +tool.label }; p { +tool.description } }
    }
}

fun HTML.appHomePage() {
    baseLayout("Housora App | Home", bodyClass = "page-app-home", path = "/app/home") {
        // baseLayout already supplies the page's single semantic <main>.
        // Keep this as a visual content container to avoid nested main landmarks.
        div("workspace-home") {
            header("workspace-home-welcome") {
                p("workspace-home-greeting") { +"Good morning, "; span { id = "workspace-home-name"; +"there" } }
                h1 { +"What would you like to redesign?" }
                p("workspace-home-intro") { +"Choose a tool and start creating with your own image." }
            }
            section("workspace-home-tools") {
                id = "workspace-tools"
                div("workspace-home-section-head") { div { h2 { +"Popular AI tools" }; p { +"Choose where you want to begin." } } }
                div("workspace-home-tool-grid") { popularHomeTools.forEach { toolCard(it) } }
                details("workspace-home-more-tools") {
                    summary { span("show-label") { +"View all tools" }; span("hide-label") { +"Show fewer tools" }; span { attributes["aria-hidden"] = "true"; +"↓" } }
                    div("workspace-home-tool-grid workspace-home-tool-grid-more") { moreHomeTools.forEach { toolCard(it) } }
                }
            }
            section("workspace-library-section") {
                id = "my-images"
                div("workspace-home-section-head") {
                    div { h2 { +"Recent projects" }; p { +"Continue working on one of your spaces." } }
                    a(href = "/projects") { +"View all projects →" }
                }
                p("workspace-home-status") { id = "workspaceHomeStatus"; attributes["role"] = "status"; attributes["aria-live"] = "polite"; +"Loading your latest projects…" }
                div("workspace-card-skeletons") { id = "workspaceHomeSkeletons"; attributes["aria-hidden"] = "true"; repeat(3) { div("workspace-card-skeleton") { span {}; i {} } } }
                div("workspace-recent-grid") { id = "workspaceRecentGrid" }
                div("workspace-library-empty") {
                    id = "workspaceHomeEmpty"; hidden = true
                    div("workspace-empty-art") { img(src = "/static/images/room-after.jpg", alt = "Warm contemporary living room example") { attributes["loading"] = "lazy" }; span { +"YOUR FIRST SPACE" } }
                    div { span { +"NO PROJECTS YET" }; h3 { +"Choose a tool to create your first design." }; p { +"Your generated images will appear here so you can return to them anytime." }; a(href = "#workspace-tools", classes = "workspace-inline-cta") { +"EXPLORE AI TOOLS" } }
                }
            }
        }
    }
}
