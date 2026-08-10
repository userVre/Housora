package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.referenceStylePage(reference: String? = null) {
    val safeReference = reference?.takeIf { it.startsWith("/") || it.startsWith("https://") || it.startsWith("http://") }
    baseLayout("Reference Style | Housora AI", path = "/reference-style") {
        div(classes = "reference-style-page") {
            if (safeReference != null) attributes["data-reference-src"] = safeReference
            section(classes = "reference-style-hero") {
                h1 { attributes["data-i18n"] = "reference.title"; +"Design from a reference" }
                p { attributes["data-i18n"] = "reference.subtitle"; +"Upload a style image you love and a photo of your own room. Housora will carry the visual direction into your space." }
            }
            section(classes = "reference-style-grid") {
                div(classes = "reference-upload-card") {
                    h2 { attributes["data-i18n"] = "reference.reference_title"; +"1. Reference image" }
                    p { attributes["data-i18n"] = "reference.reference_help"; +"Pinterest, Instagram, or any image that inspires you." }
                    input(type = InputType.file) { attributes["id"] = "referenceFileInput"; attributes["accept"] = "image/*"; attributes["hidden"] = "hidden" }
                    div(classes = "reference-upload-zone") { id = "referenceUploadZone"; attributes["tabindex"] = "0"; attributes["role"] = "button"; attributes["aria-label"] = "Upload reference image"
                        img(src = safeReference ?: "", alt = "Selected reference") { attributes["id"] = "referencePreview"; if (safeReference == null) attributes["hidden"] = "hidden" }
                        span { attributes["data-i18n"] = "reference.choose_reference"; +"Choose a reference image" }
                    }
                }
                div(classes = "reference-upload-card") {
                    h2 { attributes["data-i18n"] = "reference.room_title"; +"2. Your room photo" }
                    p { attributes["data-i18n"] = "reference.room_help"; +"Upload the room you want to redesign." }
                    input(type = InputType.file) { attributes["id"] = "referenceRoomFileInput"; attributes["accept"] = "image/*"; attributes["hidden"] = "hidden" }
                    div(classes = "reference-upload-zone") { id = "referenceRoomUploadZone"; attributes["tabindex"] = "0"; attributes["role"] = "button"; attributes["aria-label"] = "Upload room photo"
                        img(src = "", alt = "Selected room") { attributes["id"] = "referenceRoomPreview"; attributes["hidden"] = "hidden" }
                        span { attributes["data-i18n"] = "reference.choose_room"; +"Choose your room photo" }
                    }
                }
            }
            div(classes = "reference-style-options") {
                label { span { attributes["data-i18n"] = "reference.room_type"; +"Room type" }
                    select { id = "referenceRoomType"; listOf("Living Room", "Bedroom", "Dining Room", "Kitchen", "Bathroom", "Home Office").forEach { option { +it } } }
                }
                label { span { attributes["data-i18n"] = "reference.style_direction"; +"Style direction" }
                    select { id = "referenceStyleSelect"; listOf("Use reference image", "Modern", "Scandinavian", "Japandi", "Minimalist", "Industrial").forEach { option { +it } } }
                }
                label { span { attributes["data-i18n"] = "reference.palette"; +"Color palette" }
                    select { id = "referencePalette"; listOf("Natural", "Warm", "Cool", "Earth", "Monochrome").forEach { option { +it } } }
                }
            }
            div(classes = "reference-generate-row") {
                button(classes = "btn-primary btn-large") { id = "referenceGenerateBtn"; attributes["type"] = "button"; attributes["data-i18n"] = "reference.generate"; +"Generate my design" }
            }
        }
    }
}
