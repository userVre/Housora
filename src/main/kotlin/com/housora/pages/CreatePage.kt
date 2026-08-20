package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.homePage() {
    baseLayout("Housora - AI Room Design | Upload a Photo & Redesign", bodyClass = "marketing-home") {
        h1(classes = "sr-only") {
            attributes["data-i18n"] = "create.seo_title"
            +"AI room design concepts from your own photo"
        }
        // ===== HERO SECTION =====
        section("hero-section") {
            // Desktop version
            div(classes = "hero-split-layout desktop-only") {
                // LEFT: Text, badge, heading, brands, prompt input
                div("hero-split-left") {
                    div(classes = "hero-stat-badge hero-stat-badge-dark") {
                        unsafe {
                            +"""<svg class="hero-stat-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v6a6 6 0 1 1-12 0V2Z" stroke="currentColor" stroke-width="1.8"></path><path d="M6 5H3v2a3 3 0 0 0 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 14v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M8 21h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>"""
                        }
                        +"A visual starting point for your next space"
                    }
                    div("hero-split-title") {
                        div("hero-split-title-line1") {
                            +"Redesign "
                            span("hero-rotating-words hero-rotating-words-desktop") {
                                id = "heroLine1"
                                span("hero-rotating-word active") { +"Bedroom" }
                                span("hero-rotating-word") { +"Kitchen" }
                                span("hero-rotating-word") { +"Bathroom" }
                                span("hero-rotating-word") { +"Office" }
                                span("hero-rotating-word") { +"Interior" }
                                span("hero-rotating-word") { +"Any Room" }
                            }
                        }
                        div("hero-split-title-line2") { +"with AI, shaped around your space" }
                        div("hero-split-title-line3") {
                            +"Furniture from"
                            span("sr-only") { +" Your own furniture references" }
                        }
                    }
                    // Spacer between heading and brands
                    unsafe { +"""<div style="height:24px"></div>""" }
                    p(classes = "hero-supporting-copy") { attributes["data-i18n"] = "create.supporting_copy"; +"Design ideas shaped around your visual brief." }
                    // Input Wrapper — matches reference inline styles
                    unsafe { +"""<div style="width:100%;align-self:stretch">""" }
                    div("create-input-wrapper") {
                        attributes["style"] = "position:relative;margin-top:clamp(15px, 3vh, 40px);margin-left:auto;margin-right:auto;width:100%;max-width:min(730px, 85vw)"
                        div("create-input-container") {
                            attributes["style"] = "position:relative"
                            div {
                                attributes["style"] = "position:relative;width:100%"
                                textArea(classes = "create-input") {
                                    rows = "1"
                                    id = "heroPromptInput"
                                    attributes["aria-label"] = "Design prompt"
                                    placeholder = ""
                                    attributes["readOnly"] = "true"
                                }
                            }
                            div("create-input-actions") {
                                div("add-image-btn-wrap") {
                                    input(type = InputType.file, classes = "hero-file-input") {
                                        id = "heroFileInput"
                                        accept = "image/*,.heic,.heif"
                                        attributes["aria-label"] = "Upload a photo of your room"
                                        style = "display:none"
                                    }
                                    button(classes = "input-action-btn") {
                                        id = "heroUploadBtn"
                                        type = ButtonType.button
                                        attributes["aria-label"] = "Upload a photo of your room"
                                        unsafe {
                                            +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>"""
                                        }
                                        span(classes = "add-image-btn-label") { attributes["data-i18n"] = "create.start_free"; +"Start free design" }
                                    }
                                }
                                div(classes = "input-divider") {}
                                div("brand-style-button-container") {
                                    attributes["style"] = "margin-left:auto"
                                }
                                button(classes = "submit-arrow-btn") {
                                    id = "heroSubmitBtn"
                                    type = ButtonType.button
                                    attributes["aria-label"] = "Submit"
                                    attributes["disabled"] = "true"
                                    attributes["aria-busy"] = "false"
                                    attributes["style"] = "opacity:0.45;cursor:not-allowed"
                                    unsafe {
                                        +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>"""
                                    }
                                }
                            }
                        }
                        div("hero-bar-preview") {
                            id = "heroPreview"
                            style = "display:none"
                            img(src = "/static/images/room-before.jpg", alt = "Uploaded room photo") {
                                id = "heroPreviewImg"
                                attributes["onerror"] = "this.style.display='none'"
                            }
                            button(classes = "hero-preview-remove") {
                                id = "heroPreviewRemove"
                                type = ButtonType.button
                                attributes["aria-label"] = "Remove photo"
                                unsafe {
                                    +"""<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>"""
                                }
                            }
                        }
                        div("hero-bar-error") {
                            id = "heroBarError"
                            style = "display:none"
                        }
                        div("hero-bar-ai-notice") {
                            id = "heroAiNotice"
                            +"Image generation is not configured yet. You can still browse styles and furniture."
                        }
                    }
                    unsafe { +"""</div>""" }
                }
                // RIGHT: Slideshow + trust bar
                div("hero-split-right") {
                    div("hero-desktop-slideshow") {
                        val slides = listOf(
                            "/static/images/room-before.jpg" to "Empty room before AI interior design",
                            "/static/images/interior-after.jpg" to "AI living room redesign",
                            "/static/images/room-after.jpg" to "AI minimalist living room redesign",
                            "/static/images/hero-after.jpg" to "AI warm living room redesign",
                            "/static/images/style-scandi.jpg" to "AI Scandinavian living room redesign",
                            "/static/images/room-bedroom.jpg" to "AI bedroom redesign",
                            "/static/images/room-bedroom.jpg" to "AI minimalist bedroom redesign",
                            "/static/images/gallery-cottage.jpg" to "AI kids room redesign",
                            "/static/images/kitchen-after.jpg" to "AI kitchen redesign",
                            "/static/images/room-dining.jpg" to "AI dining room redesign",
                            "/static/images/gallery-modern.jpg" to "AI dining room with modern finishes"
                        )
                        slides.forEachIndexed { index, (src, alt) ->
                            img(src = src, alt = alt, classes = if (index == 0) "hero-desktop-slide hero-desktop-slide--active" else "hero-desktop-slide") {
                                attributes["width"] = "1372"
                                attributes["height"] = "768"
                                if (index == 0) {
                                    attributes["loading"] = "eager"
                                    attributes["fetchpriority"] = "high"
                                } else {
                                    attributes["loading"] = "lazy"
                                }
                                attributes["onerror"] = "this.style.display='none'"
                            }
                        }
                    }
                    // Trust bar (social proof)
                    div("hero-trust-bar") {
                        div("hero-trust-avatars") {
                            div("hero-trust-avatar") { attributes["style"] = "background:#4a90d9" }
                            div("hero-trust-avatar") { attributes["style"] = "background:#e67e22" }
                            div("hero-trust-avatar") { attributes["style"] = "background:#2ecc71" }
                            div("hero-trust-avatar") { attributes["style"] = "background:#9b59b6" }
                        }
                        div("hero-trust-text") {
                            span("hero-trust-number") { +"Your own space, your own direction" }
                            span("hero-trust-label") { +"Explore concepts grounded in your photo." }
                        }
                        div("hero-trust-divider") {}
                        div("hero-trust-reviews") {
                            div("hero-trust-reviews-left") {
                                span("hero-trust-reviews-text") {
                                    +"Rated "
                                    strong { +"top-notch" }
                                    br {}
                                    strong { +"Built for visual exploration" }
                                }
                            }
                            div("hero-trust-reviews-right") {
                                div("hero-trust-stars") {
                                    span("hero-trust-star") { +"★" }
                                    span("hero-trust-star") { +"★" }
                                    span("hero-trust-star") { +"★" }
                                    span("hero-trust-star") { +"★" }
                                    span("hero-trust-star half") { +"★" }
                                }
                                span("hero-trust-rating") { +"Preview mode" }
                            }
                        }
                    }
                }
            }
            // Mobile version
            div(classes = "hero-wallpaper-section mobile-only") {
                attributes["style"] = "width:100vw;position:relative;overflow:hidden"
                div(classes = "hero-content-wrapper") {
                    div(classes = "hero-mobile-banner mobile-only") {
                        div(classes = "hero-stat-badge hero-stat-badge-dark") {
                            unsafe {
                                +"""<svg class="hero-stat-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v6a6 6 0 1 1-12 0V2Z" stroke="currentColor" stroke-width="1.8"></path><path d="M6 5H3v2a3 3 0 0 0 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 14v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M8 21h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>"""
                            }
                            +"Bring your ideas to life"
                        }
                        div(classes = "hero-mobile-title") {
                            span(classes = "hero-mobile-title-line1") {
                                +"Redesign "
                                span(classes = "hero-rotating-words hero-rotating-words-desktop") {
                                    id = "heroLine1Mobile"
                                    span(classes = "hero-rotating-word active") { +"Bedroom" }
                                    span(classes = "hero-rotating-word") { +"Kitchen" }
                                    span(classes = "hero-rotating-word") { +"Bathroom" }
                                    span(classes = "hero-rotating-word") { +"Office" }
                                    span(classes = "hero-rotating-word") { +"Interior" }
                                    span(classes = "hero-rotating-word") { +"Any Room" }
                                }
                            }
                            span(classes = "hero-mobile-title-line2") { +"with AI, shaped around your space" }
                            span(classes = "hero-mobile-title-line3") {
                                +"Furniture from"
                                span("sr-only") { +" Your own furniture references" }
                            }
                        }
                        p(classes = "hero-supporting-copy") { attributes["data-i18n"] = "shared.explore_look"; +"A calm way to explore your next design direction." }
                        // Mobile prompt input — visible on mobile
                        div("create-input-wrapper") {
                            attributes["style"] = "width:100%;max-width:100%;padding:0 16px;margin-top:16px"
                            div("create-input-container") {
                                attributes["style"] = "position:relative"
                                div {
                                    attributes["style"] = "position:relative;width:100%"
                                    textArea(classes = "create-input") {
                                        rows = "1"
                                        id = "heroPromptInputMobile"
                                        attributes["aria-label"] = "Design prompt"
                                        placeholder = ""
                                        attributes["readOnly"] = "true"
                                    }
                                }
                                div("create-input-actions") {
                                    div("add-image-btn-wrap") {
                                        input(type = InputType.file, classes = "hero-file-input") {
                                            id = "heroFileInputMobile"
                                            accept = "image/*,.heic,.heif"
                                            attributes["aria-label"] = "Upload a photo of your room"
                                            style = "display:none"
                                        }
                                        button(classes = "input-action-btn") {
                                            id = "heroUploadBtnMobile"
                                            type = ButtonType.button
                                            attributes["aria-label"] = "Upload a photo of your room"
                                            unsafe {
                                                +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>"""
                                            }
                                            span(classes = "add-image-btn-label") { attributes["data-i18n"] = "create.start_free"; +"Start free design" }
                                        }
                                    }
                                    div(classes = "input-divider") {}
                                    div("brand-style-button-container") {
                                        attributes["style"] = "margin-left:auto"
                                    }
                                    button(classes = "submit-arrow-btn") {
                                        id = "heroSubmitBtnMobile"
                                        type = ButtonType.button
                                        attributes["aria-label"] = "Submit"
                                        attributes["disabled"] = "true"
                                        attributes["aria-busy"] = "false"
                                        attributes["style"] = "opacity:0.45;cursor:not-allowed"
                                        unsafe {
                                            +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>"""
                                        }
                                    }
                                }
                            }
                        }
                        // Mobile slideshow
                        div("hero-mobile-slideshow") {
                            val mobileSlides = listOf(
                                "/static/images/hero-after.jpg",
                                "/static/images/interior-after.jpg",
                                "/static/images/room-after.jpg",
                                "/static/images/kitchen-after.jpg",
                                "/static/images/try-after.jpg"
                            )
                            mobileSlides.forEachIndexed { index, src ->
                                img(src = src, alt = "AI Room Design", classes = if (index == 0) "hero-slide hero-slide--active" else "hero-slide") {
                                    attributes["loading"] = if (index == 0) "eager" else "lazy"
                                    attributes["onerror"] = "this.style.display='none'"
                                }
                            }
                        }
                    }
                }
            }
        }
        section("marketing-hero") {
        section("marketing-intro") {
            div("marketing-intro-inner") {
                span("marketing-kicker") { attributes["data-i18n"] = "create.marketing_kicker"; +"AI HOME DESIGN" }
                h2 { attributes["data-i18n"] = "create.marketing_title"; +"Redesign your room with AI." }
                p { attributes["data-i18n"] = "create.marketing_subtitle"; +"Explore Housora's AI design tools, then create an account to start designing." }
                div("marketing-intro-actions") {
                    a(href = "#demoPhotoBtn", classes = "btn-primary btn-large") { attributes["data-i18n"] = "create.marketing_primary"; +"CREATE YOUR FIRST DESIGN" }
                    a(href = "/examples", classes = "btn-secondary btn-large") { attributes["data-i18n"] = "create.marketing_secondary"; +"EXPLORE EXAMPLES" }
                }
            }
        }

        // ===== TRY IT YOURSELF =====
        section("demo-section") {
            id = "first-design"
            attributes["hidden"] = "hidden"
            attributes["tabindex"] = "-1"
            span("sr-only") {
                id = "designStudio"
                attributes["tabindex"] = "-1"
                +"Design studio"
            }
            h2("demo-section-title") { attributes["data-i18n"] = "create.first_design_title"; +"Create Your First Design" }
            p("demo-section-subtitle") { attributes["data-i18n"] = "create.first_design_sub"; +"Upload your photo, choose your room and style, then generate your free design." }
            div("demo-layout") {
                // LEFT PANEL: selectors + budget + CTA
                div("demo-panel") {
                    div("demo-upload-step") {
                        input(type = InputType.file, classes = "demo-photo-input") {
                            id = "demoPhotoInput"
                            accept = "image/jpeg,image/png,image/webp,image/heic,image/heif"
                            attributes["aria-label"] = "Upload a photo of your room"
                            style = "display:none"
                        }
                        button(classes = "demo-upload-zone") {
                            id = "demoPhotoBtn"
                            type = ButtonType.button
                            attributes["aria-describedby"] = "demoPhotoHint"
                            unsafe { +"""<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>""" }
                            span(classes = "demo-upload-zone-copy") {
                                strong { attributes["data-i18n"] = "create.upload_own"; +"UPLOAD YOUR OWN PHOTO" }
                                small { id = "demoPhotoHint"; attributes["data-i18n"] = "create.upload_own_sub"; +"Upload a photo of your room and explore a personalized design concept" }
                            }
                        }
                        div("demo-upload-preview") {
                            id = "demoPhotoPreview"
                            style = "display:none"
                            img { id = "demoPhotoPreviewImg"; alt = "Uploaded room preview" }
                            button(classes = "demo-upload-remove") { id = "demoPhotoRemove"; type = ButtonType.button; attributes["aria-label"] = "Remove photo"; +"×" }
                            span(classes = "demo-upload-file-name") { id = "demoPhotoName" }
                        }
                        div("demo-upload-error") { id = "demoPhotoError"; style = "display:none" }
                    }
                    div {
                        div("demo-panel-label") { attributes["data-i18n"] = "create.choose_room"; +"Choose a room" }
                        div("demo-styles") {
                            button(classes = "demo-style-pill demo-style-pill-active") {
                                attributes["data-room"] = "living"
                                attributes["data-i18n"] = "create.room_living"
                                +"Living Room"
                            }
                            button(classes = "demo-style-pill") {
                                attributes["data-room"] = "dining"
                                attributes["data-i18n"] = "create.room_dining"
                                +"Dining Room"
                            }
                            button(classes = "demo-style-pill") {
                                attributes["data-room"] = "bedroom"
                                attributes["data-i18n"] = "create.room_bedroom"
                                +"Bedroom"
                            }
                            button(classes = "demo-style-pill") { attributes["data-room"] = "kitchen"; +"Kitchen" }
                            button(classes = "demo-style-pill") { attributes["data-room"] = "bathroom"; +"Bathroom" }
                            button(classes = "demo-style-pill") { attributes["data-room"] = "office"; +"Home Office" }
                        }
                    }
                    div {
                        div("demo-panel-label") { attributes["data-i18n"] = "create.choose_style"; +"Choose a style" }
                        div("demo-styles") {
                            button(classes = "demo-style-pill") {
                                attributes["data-style"] = "minimalist"
                                attributes["data-i18n"] = "create.style_minimalist"
                                +"Minimalist"
                            }
                            button(classes = "demo-style-pill") {
                                attributes["data-style"] = "scandinavian"
                                attributes["data-i18n"] = "create.style_scandinavian"
                                +"Scandinavian"
                            }
                            button(classes = "demo-style-pill demo-style-pill-active") {
                                attributes["data-style"] = "modern"
                                attributes["data-i18n"] = "create.style_modern"
                                +"Modern"
                            }
                            button(classes = "demo-style-pill") { attributes["data-style"] = "japandi"; +"Japandi" }
                            button(classes = "demo-style-pill") { attributes["data-style"] = "industrial"; +"Industrial" }
                            button(classes = "demo-style-pill") { attributes["data-style"] = "luxury"; +"Luxury" }
                        }
                    }
                    div("demo-budget-locked-wrap") {
                        div {
                            div("demo-budget-header") {
                                div("demo-panel-label") { attributes["data-i18n"] = "create.budget"; +"Budget" }
                                div("demo-budget-value") { id = "budgetAmount"; +"$5,000" }
                            }
                            input(InputType.range, classes = "demo-budget-slider") {
                                id = "budgetSlider"; min = "0"; max = "10000"; value = "5000"; step = "100"
                                attributes["aria-label"] = "Budget"
                            }
                            div("demo-budget-range") {
                                span { +"$0" }
                                span { +"$10,000" }
                            }
                        }
                    }
                    button(classes = "demo-generate-btn demo-start-btn") {
                        id = "demoStartBtn"
                        attributes["data-i18n"] = "create.start_free"
                        +"Start Free Design"
                    }
                }
                // RIGHT PANEL: before/after slider
                div("demo-preview-wrapper") {
                    div("demo-preview") {
                        div("demo-slider-container") {
                            id = "demoSlider"
                            // AFTER image (full, underneath)
                            div("demo-slider-after") {
                                img(src = "/static/images/room-after.jpg", alt = "Living Room \u2014 Scandinavian", classes = "demo-slide-img") {
                                    attributes["width"] = "1376"
                                    attributes["height"] = "768"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                            }
                            // BEFORE image (clipped via clip-path)
                            div("demo-slider-before") {
                                id = "demoSliderBefore"
                                img(src = "/static/images/room-before.jpg", alt = "Empty room", classes = "demo-slide-img") {
                                    attributes["width"] = "1376"
                                    attributes["height"] = "768"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                                span("demo-slider-label demo-slider-label-before") { +"BEFORE" }
                            }
                            span("demo-slider-label demo-slider-label-after") { +"AFTER" }
                            // Hotspot 1 (active)
                            div("demo-hotspot demo-hotspot-active") {
                                id = "demoHotspot1"
                                style = "left:48%;top:78%"
                                button(classes = "demo-hotspot-dot") {
                                    attributes["aria-label"] = "View Oak Block Coffee Table"
                                    span("demo-hotspot-dot-inner") {}
                                }
                                div("demo-hotspot-card") {
                                    div("demo-hotspot-card-img") {
                                        img(src = "/static/images/try-after.jpg", alt = "Oak Block Coffee Table") {
                                            attributes["width"] = "80"
                                            attributes["height"] = "80"
                                            attributes["loading"] = "eager"
                                            attributes["onerror"] = "this.style.opacity='0.3'"
                                        }
                                    }
                                    div("demo-hotspot-card-info") {
                                        div("demo-hotspot-card-name") { +"Oak Block Coffee Table" }
                                        div("demo-hotspot-card-brand") {
                                            +"HAY \u2022 "
                                            span("demo-hotspot-card-price") { +"$1,970" }
                                        }
                                        a(href = "/pricing", classes = "demo-hotspot-card-cta") {
                                            attributes["target"] = "_blank"
                                            attributes["rel"] = "noopener noreferrer"
                                            +"SHOP NOW"
                                        }
                                    }
                                }
                            }
                            // Hotspot 2 (hidden)
                            div("demo-hotspot") {
                                id = "demoHotspot2"
                                style = "left:11%;top:72%"
                                button(classes = "demo-hotspot-dot") {
                                    attributes["aria-label"] = "View Woven Lounge Chair"
                                    span("demo-hotspot-dot-inner") {}
                                }
                            }
                            // Hotspot 3 (hidden)
                            div("demo-hotspot") {
                                id = "demoHotspot3"
                                style = "left:75%;top:30%"
                                button(classes = "demo-hotspot-dot") {
                                    attributes["aria-label"] = "View Pendant Light"
                                    span("demo-hotspot-dot-inner") {}
                                }
                            }
                            // Slider divider
                            div("demo-slider-divider") {
                                id = "demoSliderDivider"
                                style = "left:15%"
                            }
                            // Slider handle
                            div("demo-slider-handle") {
                                id = "demoSliderHandle"
                                style = "left:15%"
                                unsafe {
                                    +"""<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 3 1 8 5 13"></polyline><polyline points="11 3 15 8 11 13"></polyline></svg>"""
                                }
                            }
                        }
                    }
                }
            }

            div("demo-flow-note") {
                span("demo-flow-step") { strong { +"1" }; span { attributes["data-i18n"] = "create.flow_upload"; +" Upload your photo above" } }
                span("demo-flow-arrow") { +"→" }
                span("demo-flow-step") { strong { +"2" }; span { attributes["data-i18n"] = "create.flow_choose"; +" Choose your direction" } }
                span("demo-flow-arrow") { +"→" }
                span("demo-flow-step") { strong { +"3" }; span { attributes["data-i18n"] = "create.flow_generate"; +" Generate your design" } }
            }

            div("stats-section housora-trust-note") {
                h2("stats-tagline") { +"Your space is the starting point." }
                p { +"Use your own photo, compare directions, and build a visual brief you can actually discuss." }
            }
            div("demo-testimonials-grid") {}
        }

        }

        // ===== EXPLORE AI TOOLS =====
        section("create-tools-section") {
            h2("create-tools-title") { attributes["data-i18n"] = "create.explore_tools"; +"EXPLORE AI TOOLS" }
            div("create-tools-wrap") {
                div("create-tools-scroll") {
                    data class ToolCard(val url: String, val name: String, val desc: String, val imagePath: String, val isVideo: Boolean = false)
                    val tools = listOf(
                        ToolCard("/interior-design", "AI Interior Design", "Explore a new direction for any room", "/static/images/tools/interior-design-hero.jpg"),
                        ToolCard("/wall-texture", "AI Walls Texture", "Try wall textures and paint colors", "/static/images/tools/walls-texture-hero.jpg"),
                        ToolCard("/floor-restyle", "AI Floor Restyle", "Explore new flooring finishes", "/static/images/tools/floor-restyle-hero.jpg"),
                        ToolCard("/ai-stairs-design", "AI Stairs Design", "Redesign your staircase from a photo", "/static/images/tools/stairs-design-hero.jpg"),
                        ToolCard("/ai-doors-design", "AI Doors Design", "Redesign your doors from a photo", "/static/images/tools/doors-design-hero.jpg"),
                        ToolCard("/ai-windows-design", "AI Windows Design", "Redesign your windows from a photo", "/static/images/tools/windows-design-hero-v2.jpg"),
                        ToolCard("/ai-kitchen-design", "AI Kitchen Design", "Redesign your kitchen from a photo", "/static/images/tools/kitchen-design-hero-v2.jpg"),
                        ToolCard("/ai-bathroom-design", "AI Bathroom Design", "Redesign your bathroom from a photo", "/static/images/tools/bathroom-design-hero.jpg"),
                        ToolCard("/exterior-design", "AI Exterior Design", "Transform your home's exterior", "/static/images/tools/exterior-design-hero.jpg"),
                        ToolCard("/garden-design", "AI Garden Design", "Design your dream garden", "/static/images/tools/garden-design-hero.jpg"),
                        ToolCard("/layout-boost", "AI Layout Boost", "Optimize your room layout with AI", "/static/images/tools/layout-boost-hero-v2.jpg"),
                        ToolCard("/video-walkthrough", "AI Video Walkthrough", "Generate cinematic video walkthroughs", "/static/images/tools/video-walkthrough-hero-v2.jpg", true),
                        ToolCard("/floorplan-to-3d", "AI Floorplan to 3D", "Convert 2D floorplans to photorealistic 3D", "/static/images/tools/floorplan-to-3d-hero.jpg", true),
                        ToolCard("/photo-to-render", "AI Photo to Render", "Turn any photo or 3D draft into a render", "/static/images/tools/photo-to-render-hero-v2.jpg", true)
                    )
                    tools.forEach { tool ->
                        a(href = tool.url, classes = "create-tool-card") {
                            div("create-tool-card__img") {
                                if (tool.isVideo) {
                                    // Video placeholder for video tools
                                    img(src = tool.imagePath, alt = tool.name, classes = "create-tool-card__slide create-tool-card__slide--active") {
                                        attributes["loading"] = "lazy"
                                        attributes["onerror"] = "this.style.display='none'"
                                    }
                                } else {
                                    div("create-tool-card__slideshow") {
                                        img(src = tool.imagePath, alt = tool.name, classes = "create-tool-card__slide create-tool-card__slide--active") {
                                            attributes["loading"] = "lazy"
                                            attributes["onerror"] = "this.style.display='none'"
                                        }
                                    }
                                }
                            }
                            div("create-tool-card__info") {
                                span("create-tool-card__name") { +tool.name }
                                span("create-tool-card__desc") { +tool.desc }
                            }
                        }
                    }
                }
            }
        }

        // ===== HOW IT WORKS =====
        div("three-steps-section") {
            h2("three-steps-title") { attributes["data-i18n"] = "create.how_it_works"; +"How It Works" }
            div("three-steps-row") {
                val steps = listOf(
                    Triple("01", "Upload Your Room", "Any room photo works. Empty or furnished."),
                    Triple("02", "Choose Your Direction", "Pick the room, style, palette, and other details that fit your brief."),
                    Triple("03", "Generate Your Concept", "Review the result, refine the direction, and save the ideas that fit your space.")
                )
                steps.forEach { (num, title, desc) ->
                    div("three-steps-card") {
                        div("three-steps-img-wrap") {
                            img(src = "/static/images/step${num.toInt()}.jpg", alt = title) {
                                attributes["width"] = "400"
                                attributes["height"] = "260"
                                attributes["loading"] = "eager"
                                attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                            }
                        }
                        div("three-steps-card-body") {
                            span("three-steps-badge") { +num }
                            h3("three-steps-card-title") { attributes["data-i18n"] = "create.step${num.toInt()}_title"; +title }
                            p("three-steps-card-desc") { attributes["data-i18n"] = "create.step${num.toInt()}_desc"; +desc }
                        }
                    }
                }
            }
        }

        // ===== BEFORE-AFTER SECTION (Floorplan + Visualize) =====
        div("before-after-section before-after-desktop") {
            // Row 1: Start with Your Floorplan
            div("before-after-row") {
                div("before-after-text-box") {
                    h3 { +"Start"; br("mobile-br") {}; +" with Your Floorplan" }
                    p { +"Upload your floorplan and let Housora do the work:" }
                    ul {
                        li { +"Instant 3D room visualization" }
                        li { +"Automatic furniture placement" }
                        li { +"A visual brief you can review and refine" }
                        li { +"No measuring or technical skills needed" }
                    }
                }
                div("before-after-card floorplan-card") {
                    img(src = "/static/images/floorplan-after.jpg", alt = "Upload floor plan to AI interior design tool for automatic 3D room conversion", classes = "single-feature-image") {
                        attributes["width"] = "670"
                        attributes["height"] = "447"
                        attributes["loading"] = "lazy"
                        attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                    }
                }
            }
            // Row 2: Visualize Before You Buy
            div("before-after-row") {
                div("before-after-card") {
                    div("before-after-comparison") {
                        div("before-side") {
                            img(src = "/static/images/room-before.jpg", alt = "Empty room before AI furniture visualization") {
                                attributes["width"] = "670"
                                attributes["height"] = "447"
                                attributes["loading"] = "lazy"
                                attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                            }
                        }
                        div("after-side") {
                            img(src = "/static/images/room-after.jpg", alt = "AI interior design concept showing furniture in a redesigned room") {
                                attributes["width"] = "670"
                                attributes["height"] = "447"
                                attributes["loading"] = "lazy"
                                attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                            }
                        }
                    }
                }
                div("before-after-text-box") {
                    h3 { +"Preview Your Direction" }
                    p { +"Make confident decisions with realistic 3D visualization:" }
                    ul {
                        li { +"Explore approximate furniture placement" }
                        li { +"Try different layouts and styles" }
                        li { +"See how pieces work together" }
                        li { +"Make decisions before spending money" }
                    }
                }
            }
        }

        // ===== COMPARISON TABLE =====
        div("comparison-section") {
            h2("comparison-title") {
                span("comparison-highlight") { +"Housora" }
                +" vs. Everybody Else"
            }
            div("comparison-table-wrapper") {
                table(classes = "comparison-table") {
                    thead {
                        tr {
                            th(classes = "comparison-feature-col") { +"Features" }
                            th(classes = "comparison-housora-col") { +"Housora" }
                            th { +"Planner 5D" }
                            th { +"Canva" }
                            th { +"Photoshop" }
                            th(classes = "comparison-hide-mobile") { +"AutoCAD" }
                            th(classes = "comparison-hide-mobile") { +"SketchUp" }
                        }
                    }
                    tbody {
                        data class Feature(val name: String, val desc: String, val mf: Boolean, val others: List<Boolean>)
                        val features = listOf(
                            Feature("Guided Design", "Move from room photo to a clear visual direction", true, listOf(false, true, false, false, false)),
                            Feature("Real photo", "Upload & redesign real rooms", true, listOf(false, true, true, false, false)),
                            Feature("Real brands furniture", "Shop optional product references", true, listOf(false, false, false, false, false)),
                            Feature("Virtual staging", "Furnish empty rooms from a photo", true, listOf(true, false, false, false, false)),
                            Feature("Photorealistic renders", "AI-generated room images", true, listOf(false, false, true, true, true)),
                            Feature("Multiple design styles", "10+ interior design styles", true, listOf(true, true, false, false, true)),
                            Feature("Floor plan to 3D", "Convert any floor plan to interactive 3D", true, listOf(true, false, false, true, true)),
                            Feature("Web-based", "No installation required", true, listOf(true, true, false, false, false)),
                            Feature("Beginner-friendly", "No technical skills needed", true, listOf(true, true, false, false, false)),
                            Feature("Free tier", "Start designing at no cost", true, listOf(true, true, false, false, false))
                        )
                        features.forEach { f ->
                            tr {
                                td(classes = "comparison-feature-cell") {
                                    span("comparison-feature-name") { +f.name }
                                    span("comparison-feature-desc") { +f.desc }
                                }
                                td(classes = "comparison-housora-col") {
                                    span(if (f.mf) "comparison-check" else "comparison-cross") {
                                        if (f.mf) unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>""" }
                                        else unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>""" }
                                    }
                                }
                                f.others.forEach { has ->
                                    td {
                                        span(if (has) "comparison-check-other" else "comparison-cross") {
                                            if (has) unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>""" }
                                            else unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>""" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                p("comparison-mobile-note") { +"Unlike Planner 5D, Canva, Photoshop, AutoCAD or SketchUp \u2014 only Housora combines all of these in one tool." }
            }
        }

        // ===== ROOM SEO SECTION =====
        section("room-seo-section") {
            div("room-seo-inner") {
                h2("room-seo-title") { +"AI Room Design Concepts From Your Own Photo" }
                p("room-seo-intro") {
                    +"Housora is a free "
                    strong { +"AI room design" }
                    +" and "
                    strong { +"AI interior design tool" }
                    +" that turns a single photo into a photorealistic design concept. Upload a room image, choose a direction, and Housora creates a visual starting point while preserving the original architecture. Housora does not currently provide retailer catalogs, live product prices, affiliate links, or purchasing guarantees."
                }
                div("room-seo-cards") {
                    val rooms = listOf(
                        Triple("M2 7.5l4-4 4 4M6 3.5v13", "Living Room Design", "Explore furniture layouts, lighting, and finishes that suit the room photo you provide."),
                        Triple("M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01", "Bedroom Design", "Try different moods and furnishing directions while keeping the photographed space recognizable."),
                        Triple("M3 21h18M3 7v14M21 7v14M5 7V4h14v3M8 11h.01M8 15h.01M16 11h.01M16 15h.01", "Kitchen & Dining Design", "Compare visual directions for cabinets, surfaces, seating, and lighting before you decide."),
                        Triple("M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6", "Every Other Room", "Home office, bathroom and hallway. Every room in the house, one AI room designer.")
                    )
                    rooms.forEach { (iconPath, title, desc) ->
                        div("room-seo-card") {
                            span("room-seo-icon") {
                                unsafe {
                                    +"""<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="$iconPath"></path></svg>"""
                                }
                            }
                            h3 { +title }
                            p { +desc }
                        }
                    }
                }
                p("room-seo-more") {
                    +"Want to change more than the furniture? Housora also restyles the "
                    a(href = "/floor-restyle") { +"floors" }
                    +", "
                    a(href = "/wall-texture") { +"walls" }
                    +", "
                    a(href = "/ai-stairs-design") { +"staircase" }
                    +", "
                    a(href = "/ai-doors-design") { +"doors" }
                    +" and "
                    a(href = "/ai-windows-design") { +"windows" }
                    +" in the same photo, so your AI room design covers the whole space, not just what sits in it. "
                    a(href = "/interior-design") { +"See how AI interior design works" }
                    +", or upload a photo above to redesign your room now."
                }
            }
        }

        // ===== FAQ =====
        section("faq-section") {
            attributes["id"] = "faq"
            h2("faq-section-title") { attributes["data-i18n"] = "create.faq_title"; +"Frequently Asked Questions" }
            div("faq-list") {
                val faqs = listOf(
                    Triple("Is there a free AI interior design tool?", "Housora is free to try. Upload a room photo and create an initial design concept without a credit card. Your available generations and plan limits are shown in the app.", "/pricing"),
                    Triple("Is Housora free, and how much does it cost?", "You can start for free, then choose Standard or Pro when you need more generations and features. Billing can be monthly or yearly; see the pricing page for the current allowances and prices.", "/pricing"),
                    Triple("How do I redesign my room with AI?", "Upload a photo, choose a room and style, then generate a visual concept. The result is an AI design direction based on your image; it is not a product catalogue or a guarantee of exact furniture availability.", "/interior-design"),
                    Triple("Can I use AI to design any room, like a living room, bedroom, kitchen, or dining room?", "Yes. Housora includes room and specialist tools for spaces such as living rooms, bedrooms, kitchens, dining rooms, offices, bathrooms, halls, exteriors, floors, walls, doors, windows and stairs.", "/interior-design"),
                    Triple("Can I see how furniture looks in my room before buying?", "You can preview a design direction in your own room before committing to a renovation. Always confirm product dimensions, availability and installation details with the relevant supplier.", "/interior-design"),
                    Triple("Can I buy the furniture shown in my AI design?", "Housora creates visual concepts; it does not currently guarantee that every rendered item is a purchasable product or provide price comparison. Use the render as a planning reference and verify products separately.", "/pricing"),
                    Triple("How does Housora help me choose a direction?", "Housora turns your selections into a visual concept you can review, discuss, and refine before you commit to a design direction.", "/pricing"),
                    Triple("What is virtual staging and how much does it cost?", "Virtual staging digitally furnishes an empty room so you can explore a possible direction. Housora plan limits and generation allowances are shown on the pricing page.", "/pricing"),
                    Triple("How many design styles can I try?", "The available styles depend on the tool. Choose from the style cards and prompts shown in the editor; the generated result is a visual concept, not a catalogue of purchasable products.", "/interior-design"),
                    Triple("What AI design tools does Housora include?", "Housora offers a set of visual design tools for interiors, exteriors, gardens, layouts, floors, walls, stairs, doors, windows, kitchens, bathrooms, floor plans, renders, and walkthrough concepts. Upload a photo, choose the available options, and review the result as a starting point for your own decisions.", "/interior-design"),
                    Triple("Can I redesign my staircase, doors, or windows with AI?", "Yes, Housora has a dedicated tool for each. Upload a photo and the AI restyles only that element while keeping the rest of the room intact: try AI Stairs Design for treads, risers and railings, AI Doors Design for new interior doors, glass and handles, and AI Windows Design for new frames, glazing and window styles. Each render keeps your real perspective and lighting, so you can take it straight to a joiner, fitter or installer.", "/ai-stairs-design"),
                    Triple("Can Housora restyle my floors, walls, or home exterior?", "Yes. Use AI Floor Restyle to swap flooring such as wood, tile or concrete, AI Wall Texture to test paint colors, wallpaper and finishes, and AI Exterior Design or AI Garden Design to reimagine your facade, cladding and outdoor space. Every change lands on your actual photo at the correct scale and lighting, so you see exactly how it will look before you commit.", "/floor-restyle"),
                    Triple("Can I turn a floor plan into a 3D render or make a video walkthrough?", "Yes. AI Floorplan to 3D converts a flat 2D plan into a furnished, photorealistic 3D room, and AI Photo to Render turns a rough draft, sketch or 3D model view into a finished render. Once you have a design you love, AI Video Walkthrough animates it into a moving tour you can share with clients or on social media.", "/floorplan-to-3d"),
                    Triple("What is the best AI interior design tool in 2026?", "Choose the tool that fits your workflow. Housora brings room redesign together with specialist tools for floors, walls, staircases, doors, windows, exteriors and video, so you can explore concepts from one place.", "/interior-design")
                )
                faqs.forEachIndexed { index, (q, a, link) ->
                    div(classes = "faq-item") {
                        div(classes = "faq-question") {
                            attributes["role"] = "button"
                            attributes["tabindex"] = "0"
                            attributes["aria-expanded"] = "false"
                            attributes["aria-controls"] = "create-faq-answer-$index"
                            span { +q }
                            span(classes = "faq-toggle") { +"+" }
                        }
                        div(classes = "faq-answer hidden") {
                            id = "create-faq-answer-$index"
                            +a
                            +" "
                            a(href = link, classes = "faq-answer-link") { +"Learn more" }
                        }
                    }
                }
            }
        }
    }
}
