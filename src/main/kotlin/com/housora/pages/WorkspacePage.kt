package com.housora.pages

import kotlinx.html.*
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
                        a(href = "/app/home", classes = "back-link") { +"\u2190 WORKSPACE HOME" }
                        span("workspace-step-label") { +"NEW DESIGN" }
                    }
                    div("workspace-modify-header") {
                        div {
                            span("modify-title") { +"DESIGN STUDIO" }
                            span("modify-credits") { +"Upload, configure, and generate in one place" }
                        }
                        a(href = "/projects", classes = "summary-btn") { +"VIEW PROJECTS \u2192" }
                    }
                    div("canvas-area") {
                        div("analyzing-overlay empty-state") {
                            p("analyzing-title") { attributes["id"] = "workspaceStatusTitle"; +"UPLOAD A ROOM TO BEGIN" }
                            p("analyzing-pct") { attributes["id"] = "analyzePct"; +"No photo selected" }
                            p("analyzing-sub") { attributes["id"] = "workspaceStatusText"; +"Choose a JPG, PNG, or WebP image up to 10 MB. Your photo stays private and is used only for the design you request." }
                            input(InputType.file) {
                                id = "workspaceFileInput"
                                attributes["accept"] = "image/jpeg,image/png,image/webp"
                                attributes["hidden"] = "hidden"
                            }
                            button(classes = "btn-primary workspace-upload-cta") {
                                id = "workspaceUploadBtn"
                                type = ButtonType.button
                                attributes["aria-describedby"] = "workspaceStatusText workspaceUploadError"
                                +"CHOOSE ROOM PHOTO"
                            }
                            p("workspace-upload-error") { id = "workspaceUploadError"; attributes["role"] = "alert"; attributes["aria-live"] = "polite" }
                            div("analyzing-image") {
                                img(src = "/static/images/room-before.jpg", alt = "Example room photo placeholder", classes = "workspace-input-photo") {
                                    attributes["width"] = "300"
                                    attributes["height"] = "225"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                                span("image-number") { +"1 / 1" }
                            }
                            button(classes = "workspace-replace-photo") {
                                id = "workspaceReplacePhoto"
                                type = ButtonType.button
                                attributes["hidden"] = "hidden"
                                +"Replace photo"
                            }
                        }
                        div("workspace-result ph-no-capture") {
                            attributes["id"] = "workspaceResult"
                            attributes["hidden"] = "hidden"
                            p("workspace-result-label") { +"YOUR AI DESIGN" }
                            img(src = "", alt = "AI-generated room redesign") { id = "workspaceResultImage" }
                            div("canvas-actions") {
                                button(classes = "action-btn") { id = "workspaceDownloadBtn"; type = ButtonType.button; +"Download" }
                                button(classes = "action-btn") { id = "workspaceShareBtn"; type = ButtonType.button; +"Share" }
                                button(classes = "action-btn") { id = "workspaceStartOverBtn"; type = ButtonType.button; +"Start over" }
                            }
                            p("workspace-action-status") { id = "workspaceActionStatus"; attributes["role"] = "status"; attributes["aria-live"] = "polite" }
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
                            span("quality-badge") { +"STANDARD OUTPUT" }
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
                                img(src = "/static/images/room-bedroom-v2.png", alt = "Bedroom") {
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
                            div("room-option") { attributes["data-room"] = "office"; img(src = "/static/images/room-home-office-v2.png", alt = "Home Office"); span("room-name") { +"Home Office" } }
                            div("room-option") { attributes["data-room"] = "kids"; img(src = "/static/images/room-kids-v2.png", alt = "Kids Room"); span("room-name") { +"Kids Room" } }
                            div("room-option") { attributes["data-room"] = "balcony"; img(src = "/static/images/interior-balcony.jpg", alt = "Balcony"); span("room-name") { +"Balcony" } }
                        }
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
                            div("style-option") { attributes["data-style"] = "japandi"; img(src = "/static/images/japandi_minimalist_living_room.jpg", alt = "Japandi"); span("style-name") { +"Japandi" } }
                            div("style-option") { attributes["data-style"] = "minimalist"; img(src = "/static/images/s-minimalist.jpg", alt = "Minimalist"); span("style-name") { +"Minimalist" } }
                            div("style-option") { attributes["data-style"] = "industrial"; img(src = "/static/images/interior-industrial.jpg", alt = "Industrial"); span("style-name") { +"Industrial" } }
                            div("style-option") { attributes["data-style"] = "luxury"; img(src = "/static/images/s-luxury-render.jpg", alt = "Luxury"); span("style-name") { +"Luxury" } }
                            div("style-option") { attributes["data-style"] = "farmhouse"; img(src = "/static/images/s-farmhouse.jpg", alt = "Farmhouse"); span("style-name") { +"Farmhouse" } }
                        }
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
