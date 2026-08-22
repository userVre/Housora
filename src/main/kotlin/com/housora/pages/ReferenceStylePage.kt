package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.referenceStylePage(reference: String? = null) {
    val safeReference = reference?.takeIf { it.startsWith("/") || it.startsWith("https://") || it.startsWith("http://") }
    val emptyPreview = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
    baseLayout("Reference Style | Housora AI", bodyClass = "page-reference-style", path = "/reference-style") {
        div(classes = "reference-style-page") {
            if (safeReference != null) attributes["data-reference-src"] = safeReference
            section(classes = "reference-style-hero") {
                h1 { attributes["data-i18n"] = "reference.title"; +"Design from a reference" }
                p { attributes["data-i18n"] = "reference.subtitle"; +"Upload a style image you love and a photo of your own room. Housora will carry the visual direction into your space." }
            }
            section(classes = "reference-style-grid") {
                div(classes = "reference-upload-card") {
                    h2 { attributes["data-i18n"] = "reference.reference_title"; +"1. Reference image" }
                    p { id = "reference-reference-help"; attributes["data-i18n"] = "reference.reference_help"; +"Upload a saved JPG, PNG, or WebP inspiration image. URL import is not currently supported." }
                    input(type = InputType.file) { attributes["id"] = "referenceFileInput"; attributes["accept"] = "image/*"; attributes["hidden"] = "hidden" }
                    label(classes = "reference-upload-zone") { htmlFor = "referenceFileInput"; id = "referenceUploadZone"; attributes["tabindex"] = "0"; attributes["role"] = "button"; attributes["aria-describedby"] = "reference-reference-help"
                        img(src = safeReference ?: emptyPreview, alt = "Selected reference") { attributes["id"] = "referencePreview"; if (safeReference == null) attributes["hidden"] = "hidden" }
                        span { attributes["data-i18n"] = "reference.choose_reference"; +"Choose a reference image" }
                    }
                }
                div(classes = "reference-upload-card") {
                    h2 { attributes["data-i18n"] = "reference.room_title"; +"2. Your room photo" }
                    p { id = "reference-room-help"; attributes["data-i18n"] = "reference.room_help"; +"Upload the room you want to redesign." }
                    input(type = InputType.file) { attributes["id"] = "referenceRoomFileInput"; attributes["accept"] = "image/*"; attributes["hidden"] = "hidden" }
                    label(classes = "reference-upload-zone") { htmlFor = "referenceRoomFileInput"; id = "referenceRoomUploadZone"; attributes["tabindex"] = "0"; attributes["role"] = "button"; attributes["aria-describedby"] = "reference-room-help"
                        img(src = emptyPreview, alt = "Selected room") { attributes["id"] = "referenceRoomPreview"; attributes["hidden"] = "hidden" }
                        span { attributes["data-i18n"] = "reference.choose_room"; +"Choose your room photo" }
                    }
                }
            }
            div(classes = "reference-style-options") {
                label { span { attributes["data-i18n"] = "reference.room_type"; +"Room type" }
                    select { id = "referenceRoomType"; listOf("Living Room", "Bedroom", "Dining Room", "Kitchen", "Bathroom", "Home Office").forEach { option { +it } } }
                }
                label { span { attributes["data-i18n"] = "reference.style_direction"; +"Reference strength" }
                    select { id = "referenceStyleSelect"; listOf("Balanced", "Subtle influence", "Close match").forEach { option { +it } } }
                }
                label { span { attributes["data-i18n"] = "reference.palette"; +"Color palette" }
                    select { id = "referencePalette"; listOf("Follow reference", "Natural", "Warm", "Cool", "Earth", "Monochrome").forEach { option { +it } } }
                }
                fieldSet("reference-borrow") { legend { +"Borrow from reference" }; listOf("Palette", "Materials", "Furniture", "Mood", "Lighting").forEach { label { checkBoxInput { checked = true; value = it.lowercase() }; span { +it } } } }
            }
            div(classes = "reference-generate-row") {
                p("reference-generate-help") { id = "referenceGenerateHelp"; +"Add both images to continue." }
                button(classes = "btn-primary btn-large") { id = "referenceGenerateBtn"; attributes["type"] = "button"; attributes["data-i18n"] = "reference.generate"; attributes["aria-describedby"] = "referenceGenerateHelp"; attributes["disabled"] = "disabled"; +"Generate my design" }
            }
        }
    }
}
