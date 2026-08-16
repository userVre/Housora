package com.housora.templates

import kotlinx.html.*

data class Testimonial(
    val name: String,
    val country: String,
    val initials: String,
    val text: String
)

data class ShowcaseItem(
    val beforeImg: String,
    val afterImg: String,
    val beforeAlt: String = "Before",
    val afterAlt: String = "After"
)

data class ToolOptionGroup(
    val label: String,
    val options: List<Pair<String, String>>,
    val displayMode: String = "thumbnails"
)

data class ToolPageConfig(
    val pageTitle: String,
    val badge: String,
    val heroAction: String = "",
    val heroWords: List<String> = emptyList(),
    val heroHeading: String = "",
    val heroElement: String = "",
    val heroLine2: String = "with AI, shaped around your space",
    val heroLine3: String = "",
    val heroSlides: List<String> = emptyList(),
    val toolName: String,
    val interactiveHeading: String,
    val uploadDescription: String,
    val styleLabel: String,
    val styles: List<Pair<String, String>>,
    val textInputPlaceholder: String,
    val quickIdeas: List<Pair<String, String>>,
    val challengeHeading: String = "",
    val challengeIntro: String = "",
    val challengeCards: List<Triple<String, String, String>> = emptyList(),
    val solutionText: String = "",
    val showcaseSections: List<Pair<String, List<ShowcaseItem>>> = emptyList(),
    val statsTagline: String = "",
    val stats: List<Pair<String, String>>,
    val testimonials: List<Testimonial>,
    val faqItems: List<Pair<String, String>>,
    val exploreTools: List<Triple<String, String, String>>,
    val keepReading: List<Pair<String, String>>,
    val ctaHeading: String,
    val ctaSubtext: String,
    val showFurnitureFrom: Boolean = true,
    val socialProofSubtext: String = "Got their spaces reimagined.",
    val showCustomPrompt: Boolean = false,
    val colorPalettes: List<String> = emptyList(),
    val optionGroups: List<ToolOptionGroup> = emptyList(),
    val styleDisplayMode: String = "thumbnails",
    val extraStyleGroups: List<Pair<String, List<String>>> = emptyList(),
    val directFlow: Boolean = false,
    // Legacy fields kept for backward compatibility
    val problemHeading: String = "",
    val problemDescription: String = "",
    val problemCards: List<Triple<String, String, String>> = emptyList(),
    val statsLabel: String = "",
    val galleryHeading: String = "",
    val gallerySubtext: String = "",
    val galleryStyles: List<String> = emptyList(),
    val galleryMainImage: String = "",
    val galleryThumbPrefix: String = ""
)

fun HTML.toolPage(config: ToolPageConfig) {
    fun withoutUnverifiedSpeedClaim(text: String): String = text
        .replace(Regex("(?:^|\\s+)in\\s+(?:under\\s+)?(?:20|30)\\s+seconds", RegexOption.IGNORE_CASE), "")
        .replace(Regex("(?:^|\\s+)in\\s+seconds", RegexOption.IGNORE_CASE), "")
        .replace(Regex("(?:^|\\s+)instantly", RegexOption.IGNORE_CASE), "")
        .trim()
    val safeBadge = config.badge
    val safeHeroLine2 = withoutUnverifiedSpeedClaim(config.heroLine2)
    val safeHeroLine3 = withoutUnverifiedSpeedClaim(config.heroLine3)
    val effectiveChallengeHeading = config.challengeHeading.ifEmpty { config.problemHeading }
    val effectiveChallengeIntro = config.challengeIntro.ifEmpty { config.problemDescription }
    val effectiveChallengeCards = config.challengeCards.ifEmpty { config.problemCards }
    // Serialize hero words as a real JavaScript array.  The previous output
    // emitted comma-separated string literals without brackets, which caused
    // `SyntaxError: Unexpected string` on every generic tool page.
    val heroWordsJson = config.heroWords.joinToString(",", prefix = "[", postfix = "]") {
        "\"${it.replace("\\", "\\\\").replace("\"", "\\\"")}\""
    }
    val optionGroups = buildList {
        if (config.optionGroups.isNotEmpty()) addAll(config.optionGroups)
        else add(ToolOptionGroup(config.styleLabel, config.styles, config.styleDisplayMode))
        config.extraStyleGroups.forEach { (label, options) -> add(ToolOptionGroup(label, options.map { it to "" }, "pills")) }
        if (config.colorPalettes.isNotEmpty()) add(ToolOptionGroup("COLOR PALETTE", config.colorPalettes.map { it to "" }, "palette"))
    }

    baseLayout(config.pageTitle, bodyClass = if (config.directFlow) "page-tool page-tool-direct" else "page-tool") {

        // One semantic heading for the page; responsive hero variants are visual.
        h1(classes = "sr-only") { +withoutUnverifiedSpeedClaim(config.heroHeading.ifEmpty { config.pageTitle }) }

        // ===== HERO - MOBILE BANNER =====
        div(classes = "hero-mobile-banner mobile-only") {
            div(classes = "hero-stat-badge hero-stat-badge-dark") {
                span(classes = "hero-stat-badge-icon") {
                    unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>""" }
                }
                +safeBadge
            }
            div(classes = "hero-mobile-title") {
                span(classes = "hero-mobile-title-line1") {
                    +(config.heroAction + " ")
                    span(classes = "hero-rotating-words") {
                        id = "heroRotatingWordsMobile"
                        config.heroWords.forEachIndexed { index, word ->
                            span(classes = if (index == 0) "hero-rotating-word active" else "hero-rotating-word") { +word }
                        }
                    }
                }
                span(classes = "hero-mobile-title-line2") { +safeHeroLine2 }
                if (safeHeroLine3.isNotBlank()) {
                    span(classes = "hero-mobile-title-line3") { +safeHeroLine3 }
                }
            }
            if (config.showFurnitureFrom) {
                p(classes = "hero-supporting-copy") { attributes["data-i18n"] = "shared.explore_look"; +"Explore the look before you commit to the next step." }
            }
        }

        // ===== HERO - DESKTOP SPLIT LAYOUT =====
        div(classes = "hero-split-layout desktop-only") {
            div(classes = "hero-split-left") {
                div(classes = "hero-stat-badge hero-stat-badge-dark") {
                    span(classes = "hero-stat-badge-icon") {
                        unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>""" }
                    }
                    +safeBadge
                }
                div(classes = "hero-split-title") {
                    div(classes = "hero-split-title-line1") {
                        +(config.heroAction + " ")
                        span(classes = "hero-rotating-words hero-rotating-words-desktop") {
                            id = "heroRotatingWords"
                            config.heroWords.forEachIndexed { index, word ->
                                span(classes = if (index == 0) "hero-rotating-word active" else "hero-rotating-word") { +word }
                            }
                        }
                    }
                    div(classes = "hero-split-title-line2") { +safeHeroLine2 }
                    if (safeHeroLine3.isNotBlank()) {
                        div(classes = "hero-split-title-line3") { +safeHeroLine3 }
                    }
                }
                if (config.showFurnitureFrom) {
                    p(classes = "hero-supporting-copy") { attributes["data-i18n"] = "shared.explore_look"; +"Explore the look before you commit to the next step." }
                }
                div { attributes["style"] = "height:24px" }
                button(classes = "hero-start-btn") {
                    attributes["onclick"] = "document.getElementById('try-it-now')?.scrollIntoView({behavior:'smooth'})"
                    attributes["data-i18n"] = "tool.start_now"
                    +"Start Now"
                    unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>""" }
                }
            }
            div(classes = "hero-split-right") {
                div(classes = "hero-desktop-slideshow") {
                    id = "heroSlideshow"
                    val slides = config.heroSlides.ifEmpty {
                        listOf(
                            "/static/images/hero-slide-1.jpg",
                            "/static/images/hero-slide-2.jpg",
                            "/static/images/hero-slide-3.jpg",
                            "/static/images/hero-slide-4.jpg"
                        )
                    }
                    slides.forEachIndexed { index, src ->
                        img(src = src, alt = "${config.toolName} design ${index + 1}", classes = if (index == 0) "hero-desktop-slide active" else "hero-desktop-slide") {
                            attributes["width"] = "800"
                            attributes["height"] = "450"
                            if (index == 0) attributes["loading"] = "eager" else attributes["loading"] = "lazy"
                        }
                    }
                }
                div(classes = "hero-trust-bar") {
                    div(classes = "hero-trust-avatars") {
                        div(classes = "hero-trust-avatar") { attributes["style"] = "background:#4a90d9" }
                        div(classes = "hero-trust-avatar") { attributes["style"] = "background:#e67e22" }
                        div(classes = "hero-trust-avatar") { attributes["style"] = "background:#2ecc71" }
                        div(classes = "hero-trust-avatar") { attributes["style"] = "background:#9b59b6" }
                    }
                    div(classes = "hero-trust-text") {
                        span(classes = "hero-trust-number") { attributes["data-i18n"] = "shared.your_space"; +"Your own space, your own direction" }
                        span(classes = "hero-trust-label") { +"Explore ideas from your own photo." }
                    }
                    div(classes = "hero-trust-divider") {}
                    div(classes = "hero-trust-reviews") {
                        div(classes = "hero-trust-reviews-left") {
                            span(classes = "hero-trust-reviews-text") {
                                attributes["data-i18n"] = "shared.rated"
                                +"Built for clear, visual design exploration"
                            }
                        }
                        div(classes = "hero-trust-reviews-right") {
                            span(classes = "hero-trust-rating") { +"Use your own space" }
                        }
                    }
                }
            }
        }

        // ===== INTERACTIVE TOOL SECTION =====
        section(classes = "id-configure-section") {
            attributes["id"] = "try-it-now"
            div(classes = "workspace-tool-heading") {
                div {
                    span(classes = "workspace-eyebrow") { +"AI TOOL" }
                    h2(classes = "id-configure-title") { +"AI ${config.toolName}" }
                    p { +"Upload your image, choose your preferences, and generate a design you can review." }
                }
                ol(classes = "workspace-tool-steps") {
                    attributes["aria-label"] = "Generation steps"
                    listOf("Upload", "Preferences", "Generate").forEachIndexed { index, step ->
                        li {
                            span { +(index + 1).toString() }
                            +step
                        }
                    }
                }
            }
            div(classes = "id-configure-inner") {
                div(classes = "id-configure-grid") {
                    // Upload Zone
                    div(classes = "id-configure-left") {
                        div(classes = "id-upload-area") {
                            id = "uploadZone"
                            attributes["role"] = "button"
                            attributes["tabindex"] = "0"
                            attributes["aria-describedby"] = "toolUploadHelp toolUploadError"
                            attributes["aria-label"] = "Upload a photo for ${config.toolName}"
                            input(type = InputType.file, classes = "id-upload-input") {
                                id = "fileInput"
                                attributes["accept"] = "image/*"
                                attributes["aria-label"] = "Upload a room or design reference image"
                                attributes["style"] = "display:none"
                            }
                            div(classes = "id-upload-placeholder") {
                                div(classes = "id-upload-stack") {
                                    img(src = "/static/images/room-preview-1.jpg", alt = "", classes = "id-upload-stack-img id-upload-stack-left") { attributes["width"] = "120"; attributes["height"] = "84"; attributes["loading"] = "lazy" }
                                    img(src = "/static/images/room-preview-2.jpg", alt = "", classes = "id-upload-stack-img id-upload-stack-center") { attributes["width"] = "132"; attributes["height"] = "91"; attributes["loading"] = "lazy" }
                                    img(src = "/static/images/room-preview-3.jpg", alt = "", classes = "id-upload-stack-img id-upload-stack-right") { attributes["width"] = "120"; attributes["height"] = "84"; attributes["loading"] = "lazy" }
                                    span(classes = "id-upload-stack-icon") {
                                        unsafe { +"""<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>""" }
                                    }
                                }
                                span(classes = "id-upload-title") { attributes["data-i18n"] = "tool.upload_title"; attributes["data-i18n-tool"] = config.toolName; +"AI ${config.toolName.uppercase()}" }
                                span(classes = "id-upload-subtitle") { id = "toolUploadHelp"; +withoutUnverifiedSpeedClaim(config.uploadDescription) }
                                span(classes = "id-upload-formats") { +"JPG · PNG · WEBP · MAX 10 MB" }
                            }
                        }
                        p(classes = "id-field-error") {
                            id = "toolUploadError"
                            attributes["role"] = "alert"
                            attributes["aria-live"] = "polite"
                        }
                    }
                    // Config Panel
                    div(classes = "id-configure-right") {
                        optionGroups.forEach { group ->
                            div(classes = "id-config-section") {
                                div(classes = "id-config-label") { +group.label }
                                if (group.displayMode == "select") {
                                    select(classes = "id-select") {
                                        group.options.forEachIndexed { index, (name, _) ->
                                            option {
                                                attributes["value"] = name
                                                if (index == 0) attributes["selected"] = "selected"
                                                +name
                                            }
                                        }
                                    }
                                } else if (group.displayMode == "palette") {
                                    div(classes = "id-palette-grid") {
                                        group.options.forEachIndexed { index, (name, _) ->
                                            button(classes = if (index == 0) "id-palette active" else "id-palette") {
                                                attributes["type"] = "button"
                                                attributes["aria-pressed"] = (index == 0).toString()
                                                span(classes = "id-palette-swatches") {
                                                    val paletteColors = when (name.lowercase()) {
                                                        "warm" -> listOf("#fff4e8", "#f3c7a5", "#d88962", "#8d4939")
                                                        "cool" -> listOf("#f0f5fb", "#c5d9ed", "#7fa4c8", "#41698e")
                                                        "earth" -> listOf("#f3eee2", "#d7c39e", "#9b815c", "#68764d")
                                                        "mono", "monochrome" -> listOf("#f5f5f5", "#cfcfcf", "#777777", "#242424")
                                                        "surprise me" -> listOf("#f2d4dc", "#c7b8e8", "#9ed6cf", "#edb36b")
                                                        else -> listOf("#f3eee8", "#d7c8b7", "#9c8d7e", "#51483f")
                                                    }
                                                    paletteColors.forEach { color ->
                                                        span(classes = "id-palette-dot") { attributes["style"] = "background:$color" }
                                                    }
                                                }
                                                span(classes = "id-palette-name") { +name }
                                            }
                                        }
                                    }
                                } else if (group.displayMode == "pills") {
                                    div(classes = "id-option-pill-grid") {
                                        group.options.forEachIndexed { index, (name, _) ->
                                            button(classes = if (index == 0) "id-option-pill active" else "id-option-pill") { attributes["type"] = "button"; +name }
                                        }
                                    }
                                } else {
                                    div(classes = "id-card-grid") {
                                        group.options.forEachIndexed { index, (name, image) ->
                                            button(classes = buildString {
                                                append(if (index == 0) "id-card active" else "id-card")
                                                if (index >= 3) append(" hidden")
                                            }) {
                                                attributes["type"] = "button";
                                                                                                if (image.isNotEmpty()) {
                                                    img(src = image, alt = "") { attributes["loading"] = "lazy"; attributes["onerror"] = "this.style.display='none'" }
                                                }
                                                span(classes = "id-card-label") { +name }
                                            }
                                        }
                                    }
                                    if (group.options.size > 3) {
                                        button(classes = "id-show-more") {
                                            attributes["type"] = "button"
                                            attributes["data-i18n"] = "shared.show_more"
                                            attributes["data-i18n-count"] = (group.options.size - 3).toString()
                                            +"Show more (${group.options.size - 3})"
                                            unsafe { +"""<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>""" }
                                        }
                                    }
                                }
                            }
                        }
                        if (config.showCustomPrompt) {
                            div(classes = "id-custom-prompt-section") {
                                label(classes = "id-config-label") {
                                    htmlFor = "customPrompt"
                                    attributes["data-i18n"] = "shared.or_describe"
                                    +"OR DESCRIBE YOUR OWN"
                                }
                                input(type = InputType.text, classes = "id-custom-prompt") {
                                    id = "customPrompt"
                                    placeholder = config.textInputPlaceholder
                                    attributes["aria-label"] = "Describe your preferred design"
                                    attributes["aria-describedby"] = "customPromptHelp"
                                    attributes["maxlength"] = "500"
                                    attributes["autocomplete"] = "off"
                                }
                                p(classes = "id-field-help") { id = "customPromptHelp"; +"Describe the specific changes, materials, or mood you want to see." }
                            }
                        }
                        div(classes = "id-generate-wrap") {
                            button(classes = "id-generate-btn") {
                                id = "generateBtn"
                                attributes["type"] = "button"
                                attributes["disabled"] = "true"
                                attributes["data-i18n"] = "tool.generate"
                                attributes["data-i18n-tool"] = config.toolName
                                +"Generate ${config.toolName}"
                                unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>""" }
                            }
                            span(classes = "id-generate-tooltip") { attributes["data-i18n"] = "tool.generate_tooltip"; +"Upload a photo \u2192 Select options \u2192 Generate" }
                            p(classes = "id-field-error") {
                                id = "toolGenerationError"
                                attributes["role"] = "alert"
                                attributes["aria-live"] = "polite"
                            }
                        }
                    }
                }
            }
        }

        // ===== SHOWCASE SECTIONS =====
        config.showcaseSections.forEach { (title, items) ->
            section(classes = "id-showcase-section") {
                h2(classes = "id-configure-title") { +title }
                items.forEach { item ->
                    div(classes = "id-showcase-step") {
                        div(classes = "id-showcase-flow") {
                            div(classes = "id-showcase-img-wrap") {
                                img(src = item.beforeImg, alt = item.beforeAlt, classes = "id-showcase-img") {
                                    attributes["width"] = "700"
                                    attributes["height"] = "405"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.alt='Image not available';this.style.opacity='0.5'"
                                }
                            }
                            div(classes = "id-showcase-arrow") {
                                unsafe { +"""<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>""" }
                            }
                            div(classes = "id-showcase-img-wrap") {
                                img(src = item.afterImg, alt = item.afterAlt, classes = "id-showcase-img") {
                                    attributes["width"] = "700"
                                    attributes["height"] = "405"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.alt='Image not available';this.style.opacity='0.5'"
                                }
                            }
                        }
                    }
                }
            }
        }

        // ===== PROBLEM / CHALLENGE SECTION =====
        section(classes = "id-challenge-card") {
            div(classes = "id-challenge-accent") {}
            div(classes = "id-challenge-header") {
                div(classes = "id-challenge-header-left") {
                    div(classes = "id-challenge-eyebrow") {
                        span(classes = "id-challenge-eyebrow-line") {}
                        span(classes = "id-challenge-eyebrow-text") { +"The Problem" }
                    }
                    h2(classes = "id-challenge-heading") { +effectiveChallengeHeading }
                }
                p(classes = "id-challenge-intro") { +effectiveChallengeIntro }
            }
            div(classes = "id-challenge-cards") {
                effectiveChallengeCards.forEach { (iconKey, title, description) ->
                    div(classes = "id-challenge-card-item") {
                        div(classes = "id-challenge-card-top") {
                            div(classes = "id-challenge-icon") {
                                val iconSvg = when (iconKey) {
                                    "home" -> """<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>"""
                                    "building" -> """<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>"""
                                    else -> """<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"></circle><path d="M17.08 13.14A6 6 0 0 1 2.92 13"></path><path d="m21 3-8.5 8.5"></path><path d="m17 3 4 4"></path></svg>"""
                                }
                                unsafe { +iconSvg }
                            }
                            h3 { +title }
                        }
                        p { +description }
                    }
                }
            }
            div(classes = "id-challenge-divider") {
                span(classes = "id-challenge-divider-line") {}
                div(classes = "id-challenge-divider-icon") {
                    unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>""" }
                }
                span(classes = "id-challenge-divider-line") {}
            }
            div(classes = "id-solution-box") {
                div(classes = "id-solution-sparkle") {
                    unsafe { +"""<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z"/></svg>""" }
                }
                div(classes = "id-solution-label") {
                    span(classes = "id-solution-dot") {}
                    span { +"The Solution" }
                }
                p(classes = "id-solution-text") {
                    +withoutUnverifiedSpeedClaim(config.solutionText)
                }
            }
        }

        // ===== TRUST SECTION =====
        div(classes = "demo-section") {
            div(classes = "stats-section housora-trust-note") {
                h2(classes = "stats-tagline") { +"A growing toolkit for clearer design decisions." }
                p { +"Explore the tools, create concepts from your own images, and keep the ideas that fit your space." }
            }

            // ===== TESTIMONIALS =====
            if (false) div(classes = "demo-testimonials-grid") {
                config.testimonials.forEach { testimonial ->
                    div(classes = "demo-testimonial-card") {
                        div(classes = "demo-testimonial-header") {
                            div(classes = "demo-testimonial-avatar") { +testimonial.initials }
                            div(classes = "demo-testimonial-info") {
                                div(classes = "demo-testimonial-name") { +testimonial.name }
                                div(classes = "demo-testimonial-country") { +testimonial.country }
                            }
                        }
                        div(classes = "demo-testimonial-stars") {
                            unsafe { +"""<svg width="72" height="14" viewBox="0 0 72 14" fill="none"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.2 3.3 12.4l.7-4.1-3-2.9 4.2-.8z" fill="#f5a623"/><path d="M21 1l1.8 3.6L27 5.4l-3 2.9.7 4.1L21 10.2l-3.7 2.2.7-4.1-3-2.9 4.2-.8z" fill="#f5a623"/><path d="M35 1l1.8 3.6L41 5.4l-3 2.9.7 4.1L35 10.2l-3.7 2.2.7-4.1-3-2.9 4.2-.8z" fill="#f5a623"/><path d="M49 1l1.8 3.6L55 5.4l-3 2.9.7 4.1L49 10.2l-3.7 2.2.7-4.1-3-2.9 4.2-.8z" fill="#f5a623"/><path d="M63 1l1.8 3.6L69 5.4l-3 2.9.7 4.1L63 10.2l-3.7 2.2.7-4.1-3-2.9 4.2-.8z" fill="#f5a623"/></svg>""" }
                        }
                        p(classes = "demo-testimonial-text") { +testimonial.text }
                    }
                }
            }
        }

        // ===== FAQ SECTION =====
        section(classes = "faq-section") {
            attributes["id"] = "faq"
                    h2(classes = "faq-section-title") { attributes["data-i18n"] = "shared.faq_section"; +"Frequently Asked Questions" }
            div(classes = "faq-list") {
                config.faqItems.forEach { (question, answer) ->
                    details(classes = "faq-item") {
                        summary(classes = "faq-question") { +question }
                        p(classes = "faq-answer") {
                            +if (answer.contains("About 30 seconds per render", ignoreCase = true)) {
                                "Processing time depends on image size and service availability."
                            } else {
                                withoutUnverifiedSpeedClaim(answer)
                            }
                        }
                    }
                }
            }
        }

        // ===== EXPLORE MORE + KEEP READING =====
        section(classes = "rt-related") {
            attributes["aria-label"] = "Related tools and reading"
            div(classes = "rt-grid") {
                div(classes = "rt-col") {
                    h2(classes = "rt-col-title") { attributes["data-i18n"] = "shared.explore_tools"; +"Explore More AI Design Tools" }
                    ul(classes = "rt-card-list") {
                        config.exploreTools.forEach { (name, description, url) ->
                            li {
                                a(href = if (url == "#") "/blog" else url, classes = "rt-card") {
                                    span(classes = "rt-card-thumb") {
                                        val imgKey = name.lowercase().replace("ai ", "").replace(" ", "-")
                                        img(src = "/static/images/tools/${imgKey}-hero.jpg", alt = name, classes = "rt-card-thumb-img") {
                                            attributes["width"] = "80"
                                            attributes["height"] = "56"
                                            attributes["loading"] = "lazy"
                                            attributes["onerror"] = "this.style.display='none'"
                                        }
                                    }
                                    span(classes = "rt-card-text") {
                                        span(classes = "rt-card-name") { +name }
                                        span(classes = "rt-card-desc") { +description }
                                    }
                                    span(classes = "rt-card-arrow") {
                                        unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>""" }
                                    }
                                }
                            }
                        }
                    }
                }
                div(classes = "rt-col") {
                    h2(classes = "rt-col-title") { attributes["data-i18n"] = "shared.keep_reading"; +"Keep Reading" }
                    ul(classes = "rt-card-list") {
                        config.keepReading.forEach { (title, url) ->
                            li {
                                a(href = url, classes = "rt-card") {
                                    span(classes = "rt-card-text") {
                                        span(classes = "rt-card-name") { +title }
                                        span(classes = "rt-card-desc") { +"Read article" }
                                    }
                                    span(classes = "rt-card-arrow") {
                                        unsafe { +"""<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>""" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ===== CTA SECTION =====
        section(classes = "id-bottom-cta") {
            h2 { +config.ctaHeading }
            p { +"Explore a new visual direction for your own space." }
            div(classes = "id-bottom-cta-links") {
                a(href = "/design", classes = "id-bottom-cta-primary") { +"Try Housora Free" }
                a(href = "/design", classes = "id-bottom-cta-secondary") { +"Open the AI ${config.toolName} Tool" }
            }
        }

        // Hero word animation script
        if (config.heroWords.isNotEmpty()) {
            script {
                unsafe {
                    +"""
                    document.addEventListener('DOMContentLoaded', function() {
                        var words = $heroWordsJson;
                        var el = document.getElementById('heroRotatingWords');
                        var elMobile = document.getElementById('heroRotatingWordsMobile');
                        function rotateWords(container) {
                            if (!container) return;
                            var wordEls = container.querySelectorAll('.hero-rotating-word');
                            if (wordEls.length === 0) return;
                            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                            // Reserve the width of the longest word so the
                            // headline does not jump or overlap while changing.
                            var maxWidth = 0;
                            wordEls.forEach(function(word) {
                                var previousDisplay = word.style.display;
                                word.style.display = 'inline';
                                maxWidth = Math.max(maxWidth, word.getBoundingClientRect().width);
                                word.style.display = previousDisplay;
                            });
                            if (maxWidth > 0) {
                                container.style.width = Math.ceil(maxWidth) + 'px';
                                container.style.display = 'inline-block';
                            }
                            var idx = 0;
                            setInterval(function() {
                                wordEls[idx].classList.remove('active');
                                idx = (idx + 1) % wordEls.length;
                                wordEls[idx].classList.add('active');
                            }, 2500);
                        }
                        rotateWords(el);
                        rotateWords(elMobile);

                        // Slideshow
                        var slides = document.querySelectorAll('.hero-desktop-slide');
                        if (slides.length > 1 && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                            var slideIdx = 0;
                            setInterval(function() {
                                slides[slideIdx].classList.remove('active');
                                slideIdx = (slideIdx + 1) % slides.length;
                                slides[slideIdx].classList.add('active');
                            }, 4000);
                        }

                        // Expand each route-specific option group independently.
                        document.querySelectorAll('.id-show-more').forEach(function(showMore) {
                            showMore.addEventListener('click', function() {
                                var section = this.closest('.id-config-section');
                                if (section) {
                                    section.querySelectorAll('.id-card.hidden').forEach(function(c) { c.classList.remove('hidden'); });
                                }
                                this.style.display = 'none';
                            });
                        });

                        // FAQ toggle
                        document.querySelectorAll('.faq-question').forEach(function(q) {
                            q.addEventListener('click', function(e) {
                                e.preventDefault();
                                var parent = this.closest('.faq-item');
                                if (parent) parent.classList.toggle('open');
                            });
                        });
                    });
                    """
                }
            }
        }
    }
}
