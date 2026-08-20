package com.housora.pages

import kotlinx.html.*
import com.housora.templates.aiTools
import com.housora.templates.baseLayout

private data class HomeTool(val label: String, val path: String, val image: String, val description: String)

private val featuredHomeTools = listOf(
    HomeTool("Interior redesign", "/interior-design", "/static/images/room-after.jpg", "Reimagine a room while keeping its architecture."),
    HomeTool("Kitchen design", "/ai-kitchen-design", "/static/images/workspace-kitchen-v2.png", "Explore finishes, cabinetry, and a clearer layout."),
    HomeTool("Bathroom design", "/ai-bathroom-design", "/static/images/bathroom-after.jpg", "Turn a practical bathroom into a considered space."),
    HomeTool("Garden design", "/garden-design", "/static/images/garden-after.jpg", "Plan planting, pathways, and outdoor living zones."),
    HomeTool("Exterior design", "/exterior-design", "/static/images/exterior-after.jpg", "Test materials, colours, and stronger curb appeal."),
    HomeTool("Floor restyle", "/floor-restyle", "/static/images/floor-restyle-after.jpg", "Compare realistic flooring directions in your room.")
)

fun HTML.appHomePage() {
    baseLayout("Housora App | Home", bodyClass = "page-app-home", path = "/app/home") {
        section("workspace-home") {
            header("workspace-home-hero") {
                span("workspace-home-kicker") { +"HOUSORA CREATIVE STUDIO" }
                h1 { +"Shape the home you have in mind." }
                p { +"Describe an idea, choose a focused tool, or continue from one of your spaces." }
            }

            form(action = "/design", method = FormMethod.get, classes = "workspace-creator") {
                attributes["id"] = "workspace-prompt"
                div("workspace-creator-tabs") {
                    a(href = "/design", classes = "is-active") { +"Room design" }
                    a(href = "/reference-style") { +"Reference style" }
                    a(href = "/layout-boost") { +"Layout boost" }
                    a(href = "/exterior-design") { +"Exterior" }
                    a(href = "/garden-design") { +"Garden" }
                }
                div("workspace-creator-body") {
                    label { htmlFor = "workspace-home-prompt"; +"Describe your design idea" }
                    textArea(classes = "workspace-home-prompt") {
                        id = "workspace-home-prompt"
                        name = "prompt"
                        attributes["rows"] = "4"
                        attributes["maxlength"] = "500"
                        attributes["placeholder"] = "Example: Make my living room warm and contemporary with oak, soft limestone, and hidden storage…"
                        attributes["data-i18n"] = "workspace.prompt_placeholder"
                    }
                    div("workspace-prompt-suggestions") {
                        button { type = ButtonType.button; attributes["data-home-prompt"] = "Create a warm Japandi living room with oak furniture, linen textures, and soft indirect lighting."; +"Warm Japandi" }
                        button { type = ButtonType.button; attributes["data-home-prompt"] = "Redesign this small kitchen with smarter storage, warm white cabinets, and natural stone worktops."; +"Smarter kitchen" }
                        button { type = ButtonType.button; attributes["data-home-prompt"] = "Give this bedroom a calm hotel feel with layered lighting, tactile neutrals, and uncluttered storage."; +"Calm bedroom" }
                    }
                }
                div("workspace-creator-actions") {
                    a(href = "/design#editor", classes = "workspace-add-photo") {
                        unsafe { +"""<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>""" }
                        +"Add room photo"
                    }
                    span("workspace-creator-note") { +"Your photo stays private" }
                    button(classes = "workspace-create-submit") { type = ButtonType.submit; span { +"Open design studio" }; span { +"↑" } }
                }
            }

            nav("workspace-quick-tools") {
                attributes["aria-label"] = "Popular design tools"
                a(href = "/interior-design") { span { +"01" }; +"Interior" }
                a(href = "/ai-kitchen-design") { span { +"02" }; +"Kitchen" }
                a(href = "/ai-bathroom-design") { span { +"03" }; +"Bathroom" }
                a(href = "/floorplan-to-3d") { span { +"04" }; +"Floorplan to 3D" }
                a(href = "/photo-to-render") { span { +"05" }; +"Photo to render" }
            }

            section("workspace-library-section") {
                id = "my-images"
                div("workspace-section-heading") {
                    div { span { +"YOUR LIBRARY" }; h2 { +"My images" }; p { +"Pick up where you left off or start a fresh space." } }
                    a(href = "/projects") { +"View all projects →" }
                }
                p("workspace-home-status") { id = "workspaceHomeStatus"; attributes["role"] = "status"; attributes["aria-live"] = "polite"; +"Loading your latest images…" }
                div("workspace-recent-grid") { id = "workspaceRecentGrid" }
                div("workspace-library-empty") {
                    id = "workspaceHomeEmpty"
                    attributes["hidden"] = "hidden"
                    div("workspace-empty-art") { img(src = "/static/images/room-after.jpg", alt = "Warm contemporary living room example") { attributes["loading"] = "lazy" }; span { +"YOUR FIRST SPACE" } }
                    div { span { +"NO DESIGNS YET" }; h3 { +"Your ideas deserve somewhere to live." }; p { +"Create your first room concept. Every generated image will be saved here and grouped inside a project." }; a(href = "/design", classes = "workspace-inline-cta") { +"CREATE FIRST DESIGN" } }
                }
            }

            section("workspace-examples-section") {
                div("workspace-section-heading") {
                    div { span { +"START FROM A SPACE" }; h2 { +"Focused tools for every part of home." }; p { +"Each workflow keeps the task simple and the output relevant." } }
                    a(href = "/examples") { +"Browse all examples →" }
                }
                div("workspace-example-grid") {
                    featuredHomeTools.forEach { tool ->
                        article("workspace-example-card") {
                            a(href = tool.path, classes = "workspace-example-image") { img(src = tool.image, alt = "${tool.label} example") { attributes["loading"] = "lazy"; attributes["width"] = "640"; attributes["height"] = "480" }; span { +"OPEN TOOL ↗" } }
                            div("workspace-example-copy") {
                                div { h3 { +tool.label }; p { +tool.description } }
                                button(classes = "workspace-like-button") { type = ButtonType.button; attributes["aria-label"] = "Save ${tool.label} to My likes"; attributes["aria-pressed"] = "false"; attributes["data-like-title"] = tool.label; attributes["data-like-image"] = tool.image; attributes["data-like-path"] = tool.path; +"♡" }
                            }
                        }
                    }
                }
            }

            section("workspace-likes-section") {
                id = "my-likes"
                div("workspace-section-heading") { div { span { +"SAVED INSPIRATION" }; h2 { +"My likes" }; p { +"Keep useful directions close while you decide what to make next." } } }
                div("workspace-liked-grid") { id = "workspaceLikedGrid" }
                div("workspace-likes-empty") { id = "workspaceLikesEmpty"; span { +"♡" }; h3 { +"Nothing saved yet" }; p { +"Tap the heart on an example to collect it here." } }
            }
        }
    }
}
