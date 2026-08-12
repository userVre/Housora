package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.workspacePage(projectId: String? = null) {
    val restoredProjectId = projectId?.takeIf { it.matches(Regex("[A-Za-z0-9_-]{1,160}")) }
    baseLayout("Housora - Workspace", bodyClass = "page-workspace", path = "/design") {
        h1("sr-only") { +"Housora design workspace" }
        section("workspace-section") {
            id = "editor"
            attributes["tabindex"] = "-1"
            restoredProjectId?.let { attributes["data-project-id"] = it }
            span("sr-only") {
                id = "first-design"
                attributes["tabindex"] = "-1"
                +"Start a design"
            }
            span("sr-only") {
                id = "designStudio"
                attributes["tabindex"] = "-1"
                +"Design studio"
            }
            div("workspace-layout") {
                // Main canvas area
                div("workspace-canvas") {
                    div("workspace-topbar") {
                        a(href = "/interior-design", classes = "back-link") { +"\u2190 AI INTERIOR DESIGN" }
                    }
                    div("workspace-tabs-bar") {
                        button(classes = "tab-item") { type = ButtonType.button; attributes["aria-label"] = "Add workspace tab"; +"+" }
                        button(classes = "tab-item tab-label") { type = ButtonType.button; +"Furniture" }
                        button(classes = "tab-item tab-label") { type = ButtonType.button; +"List" }
                        button(classes = "tab-item tab-label tab-active") { type = ButtonType.button; attributes["aria-current"] = "page"; +"Design" }
                    }
                    div("workspace-modify-header") {
                        span("modify-title") { +"MODIFY THIS IMAGE" }
                        span("modify-credits") { +"PLAN IMAGES" }
                        a(href = "/projects", classes = "summary-btn") { +"Summary \u2192" }
                    }
                    div("canvas-area") {
                        div("analyzing-overlay empty-state") {
                            p("analyzing-title") { attributes["id"] = "workspaceStatusTitle"; +"UPLOAD A ROOM TO BEGIN" }
                            p("analyzing-pct") { attributes["id"] = "analyzePct"; +"No photo selected" }
                            p("analyzing-sub") { attributes["id"] = "workspaceStatusText"; +"Upload a room photo first. Then choose a direction and describe the design you want." }
                            a(href = "/#first-design", classes = "btn-primary workspace-upload-cta") { +"UPLOAD ROOM PHOTO" }
                            div("analyzing-image") {
                                img(src = "/static/images/room-before.jpg", alt = "Example room photo placeholder", classes = "workspace-input-photo") {
                                    attributes["width"] = "300"
                                    attributes["height"] = "225"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                                span("image-number") { +"1 / 1" }
                            }
                            div("progress-bar") {
                                div("progress-fill") { attributes["id"] = "progressFill" }
                            }
                        }
                        div("workspace-photo-grid") {
                            val photos = listOf(
                                "/static/images/kitchen-after.jpg",
                                "/static/images/kitchen-before.jpg",
                                "/static/images/interior-after.jpg",
                                "/static/images/room-after.jpg",
                                "/static/images/interior-before.jpg",
                                "/static/images/walls-texture-after.jpg",
                                "/static/images/room-before.jpg",
                                "/static/images/floor-restyle-after.jpg",
                                "/static/images/kitchen-after.jpg"
                            )
                            photos.forEach { src ->
                            div("photo-cell photo-cell-primary") {
                                    img(src = src, alt = "Room design photo") {
                                        attributes["loading"] = "lazy"
                                        attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                    }
                                }
                            }
                        }
                        div("canvas-actions") {
                            button(classes = "action-btn") {
                                type = ButtonType.button
                                attributes["aria-label"] = "Edit design"
                                +"Edit"
                            }
                            button(classes = "action-btn") { type = ButtonType.button; attributes["aria-label"] = "Download design"; +"⬇" }
                            button(classes = "action-btn") { type = ButtonType.button; attributes["aria-label"] = "Share design"; +"⤴" }
                        }
                    }
                    div("workspace-prompt-bar") {
                        div("prompt-input-area") {
                            label("prompt-input-label") { htmlFor = "workspacePrompt"; +"Describe your design" }
                            input(InputType.text, classes = "prompt-input-field") {
                                id = "workspacePrompt"
                                attributes["aria-describedby"] = "workspacePromptHelp workspacePromptError"
                                attributes["placeholder"] = "Describe the style, materials, or changes you want"
                                attributes["maxlength"] = "500"
                            }
                            p("prompt-input-help") { id = "workspacePromptHelp"; +"A room photo and a description are both required." }
                            p("workspace-field-error") { id = "workspacePromptError"; attributes["role"] = "alert"; attributes["aria-live"] = "polite" }
                        }
                        div("prompt-controls") {
                            button(classes = "upload-furniture-btn") {
                                type = ButtonType.button
                                img(src = "/static/images/tools/interior-design-hero.jpg", alt = "Upload furniture reference photo") {
                                    attributes["width"] = "16"
                                    attributes["height"] = "16"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                    style = "border-radius:2px"
                                }
                                +"UPLOAD FURNITURE"
                            }
                            span("quality-badge") { +"Quick \u00B7 1x \u00B7 1K" }
                            span("quality-arrow") { +"⌄" }
                            button(classes = "send-btn") { type = ButtonType.button; attributes["aria-label"] = "Generate design"; attributes["disabled"] = "true"; +"\u2191" }
                        }
                    }
                }

                // Right sidebar
                div("workspace-sidebar") {
                    // Room Type
                    div("sidebar-section") {
                        h4("sidebar-label") { +"ROOM TYPE" }
                        div("room-type-grid") {
                            div("room-option active") {
                                attributes["data-room"] = "living"
                                img(src = "/static/images/room-living.jpg", alt = "Living Room") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("room-check") { +"\u2713" }
                                span("room-name") { +"Living Room" }
                            }
                            div("room-option") {
                                attributes["data-room"] = "bedroom"
                                img(src = "/static/images/room-bedroom.jpg", alt = "Bedroom") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("room-name") { +"Bedroom" }
                            }
                            div("room-option") {
                                attributes["data-room"] = "dining"
                                img(src = "/static/images/room-dining.jpg", alt = "Dining Room") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("room-name") { +"Dining Room" }
                            }
                            div("room-option") { attributes["data-room"] = "kitchen"; img(src = "/static/images/kitchen-after.jpg", alt = "Kitchen"); span("room-name") { +"Kitchen" } }
                            div("room-option") { attributes["data-room"] = "bathroom"; img(src = "/static/images/bathroom-minimalist.jpg", alt = "Bathroom"); span("room-name") { +"Bathroom" } }
                            div("room-option") { attributes["data-room"] = "office"; img(src = "/static/images/interior-after.jpg", alt = "Home Office"); span("room-name") { +"Home Office" } }
                            div("room-option") { attributes["data-room"] = "kids"; img(src = "/static/images/room-bedroom.jpg", alt = "Kids Room"); span("room-name") { +"Kids Room" } }
                            div("room-option") { attributes["data-room"] = "balcony"; img(src = "/static/images/interior-balcony.jpg", alt = "Balcony"); span("room-name") { +"Balcony" } }
                        }
                        span("show-more") { +"Show more (5) \u25BE" }
                    }

                    // Style
                    div("sidebar-section") {
                        h4("sidebar-label") { +"STYLE" }
                        div("style-grid") {
                            div("style-option active") {
                                attributes["data-style"] = "scandinavian"
                                img(src = "/static/images/style-scandi.jpg", alt = "Scandinavian") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("style-check") { +"\u2713" }
                                span("style-name") { +"Scandinavian" }
                            }
                            div("style-option") {
                                attributes["data-style"] = "modern"
                                img(src = "/static/images/style-modern.jpg", alt = "Modern") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("style-name") { +"Modern" }
                            }
                            div("style-option") {
                                attributes["data-style"] = "coastal"
                                img(src = "/static/images/style-coastal.jpg", alt = "Coastal") {
                                    attributes["width"] = "60"
                                    attributes["height"] = "42"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3'"
                                }
                                span("style-name") { +"Coastal" }
                            }
                            div("style-option") { attributes["data-style"] = "japandi"; img(src = "/static/images/s-warm-min.jpg", alt = "Japandi"); span("style-name") { +"Japandi" } }
                            div("style-option") { attributes["data-style"] = "minimalist"; img(src = "/static/images/s-minimalist.jpg", alt = "Minimalist"); span("style-name") { +"Minimalist" } }
                            div("style-option") { attributes["data-style"] = "industrial"; img(src = "/static/images/interior-industrial.jpg", alt = "Industrial"); span("style-name") { +"Industrial" } }
                            div("style-option") { attributes["data-style"] = "luxury"; img(src = "/static/images/s-luxury-render.jpg", alt = "Luxury"); span("style-name") { +"Luxury" } }
                            div("style-option") { attributes["data-style"] = "farmhouse"; img(src = "/static/images/s-farmhouse.jpg", alt = "Farmhouse"); span("style-name") { +"Farmhouse" } }
                        }
                        span("show-more") { +"Show more (5) \u25BE" }
                    }

                    // Color Palette
                    div("sidebar-section") {
                        h4("sidebar-label") { +"COLOR PALETTE" }
                        div("palette-grid") {
                            div("palette-option active") {
                                attributes["data-palette"] = "neutral"
                                div("palette-colors") {
                                    span("color-dot c1") {}
                                    span("color-dot c2") {}
                                    span("color-dot c3") {}
                                    span("color-dot c4") {}
                                }
                                span("palette-name") { +"Neutral" }
                            }
                            div("palette-option") {
                                attributes["data-palette"] = "warm"
                                div("palette-colors") {
                                    span("color-dot c5") {}
                                    span("color-dot c6") {}
                                    span("color-dot c7") {}
                                    span("color-dot c8") {}
                                }
                                span("palette-name") { +"Warm" }
                            }
                            div("palette-option") {
                                attributes["data-palette"] = "cool"
                                div("palette-colors") {
                                    span("color-dot c9") {}
                                    span("color-dot c10") {}
                                    span("color-dot c11") {}
                                    span("color-dot c12") {}
                                }
                                span("palette-name") { +"Cool" }
                            }
                            div("palette-option") {
                                attributes["data-palette"] = "earth"
                                div("palette-colors") {
                                    span("color-dot c13") {}
                                    span("color-dot c14") {}
                                    span("color-dot c15") {}
                                    span("color-dot c16") {}
                                }
                                span("palette-name") { +"Earth" }
                            }
                            div("palette-option") {
                                attributes["data-palette"] = "mono"
                                div("palette-colors") {
                                    span("color-dot c17") {}
                                    span("color-dot c18") {}
                                    span("color-dot c19") {}
                                    span("color-dot c20") {}
                                }
                                span("palette-name") { +"Mono" }
                            }
                            div("palette-option palette-custom") {
                                attributes["data-palette"] = "custom"
                                span("plus-icon") { +"+" }
                                span("palette-name") { +"Custom" }
                            }
                        }
                    }

                    // Budget
                    div("sidebar-section") {
                        h4("sidebar-label") { +"BUDGET" }
                        div("budget-row") {
                            span("budget-amount") { +"$3,000" }
                        }
                        div("budget-slider-wrap") {
                            input(InputType.range, classes = "budget-range") {
                                id = "workspaceBudget"
                                attributes["aria-label"] = "Budget"
                                attributes["min"] = "500"
                                attributes["max"] = "20000"
                                attributes["value"] = "3000"
                                attributes["step"] = "500"
                            }
                            div("budget-labels") {
                                span { +"$500" }
                                span { +"$10K" }
                                span { +"$20K+" }
                            }
                        }
                    }

                    // Generate Button
                    button(classes = "btn-design-room") {
                        id = "workspaceGenerateBtn"
                        type = ButtonType.button
                        attributes["data-i18n"] = "workspace.design_now"
                        attributes["disabled"] = "true"
                        attributes["aria-describedby"] = "workspacePromptError"
                        +"DESIGN NOW"
                    }
                }
            }
        }
        script {
            unsafe {
                +"""
                (function () {
                    var url = new URL(window.location.href);
                    var projectId = url.searchParams.get('project');
                    var legacyMatch = window.location.hash.match(/^#project-(.+)$/);
                    var editor = document.getElementById('editor');
                    if (!projectId && legacyMatch) {
                        try { projectId = decodeURIComponent(legacyMatch[1]); } catch (_) { projectId = legacyMatch[1]; }
                    }
                    if (projectId && /^[A-Za-z0-9_-]{1,160}$/.test(projectId)) {
                        try { localStorage.setItem('housora_current_project', projectId); } catch (_) {}
                        if (legacyMatch) {
                            url.hash = '';
                            url.searchParams.set('project', projectId);
                            history.replaceState(null, '', url.pathname + url.search);
                        }
                        if (editor) editor.setAttribute('data-project-id', projectId);
                    }
                    if (editor && projectId && !window.location.hash) {
                        requestAnimationFrame(function () { editor.focus({ preventScroll: true }); });
                    }
                })();
                """
            }
        }
    }
}
