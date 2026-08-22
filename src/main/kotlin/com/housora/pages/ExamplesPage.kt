package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

private data class StyleRoomImage(val room: String, val src: String)
private data class StyleStudy(val name: String, val description: String, val images: List<StyleRoomImage>)

private fun styleSlug(value: String) = value.lowercase().replace(" ", "-")
private fun study(name: String, description: String, vararg sources: String): StyleStudy {
    val isGeneratedRoomSet = sources.size == 5 && sources.all { it.startsWith("styles/") }
    val rooms = if (isGeneratedRoomSet) {
        listOf("Living room", "Kitchen", "Bedroom", "Bathroom", "Dining room")
    } else {
        listOf("Style preview")
    }
    return StyleStudy(
        name,
        description,
        rooms.zip(sources.take(rooms.size)).map { (room, src) -> StyleRoomImage(room, "/static/images/$src") }
    )
}

private val featuredStyleStudies = listOf(
    study("Scandinavian", "Light woods, tactile whites, and useful calm.", "styles/scandinavian/living-room.png", "styles/scandinavian/kitchen.png", "styles/scandinavian/bedroom.png", "styles/scandinavian/bathroom.png", "styles/scandinavian/dining-room.png"),
    study("Modern", "Clean lines, balanced proportions, and practical comfort.", "gallery-modern.jpg", "gallery-handleless.jpg", "room-bedroom.jpg", "bathroom-after.jpg", "room-dining.jpg"),
    study("Minimalist", "Essential forms, quiet materials, and generous breathing room.", "gallery-minimalist.jpg", "gallery-modern-minimal.jpg", "room-bedroom.jpg", "bathroom-minimalist.jpg", "room-dining.jpg"),
    study("Industrial", "Exposed structure, dark metal, and honest raw texture.", "gallery-industrial.jpg", "s-industrial-kit.jpg", "gallery-exposed-brick.jpg", "gallery-polished-concrete.jpg", "room-dining.jpg"),
    study("Mid-Century Modern", "Warm timber, sculptural furniture, and optimistic color.", "interior-after.jpg", "gallery-modern-oak.jpg", "room-bedroom.jpg", "gallery-warm.jpg", "room-dining.jpg"),
    study("Bohemian", "Collected color, layered textiles, and expressive detail.", "gallery-dramatic.jpg", "gallery-sage-shaker.jpg", "room-bedroom.jpg", "gallery-tropical.jpg", "room-dining.jpg"),
    study("Coastal", "Airy blues, sun-washed neutrals, and natural fibers.", "gallery-coastal.jpg", "kitchen-after.jpg", "room-bedroom.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Modern Farmhouse", "Familiar materials and rustic warmth with cleaner lines.", "gallery-farmhouse.jpg", "s-farmhouse-kit.jpg", "gallery-cottage.jpg", "s-rustic-bath.jpg", "room-dining.jpg"),
    study("Japandi", "Japanese restraint balanced with Scandinavian softness.", "gallery-japanese.jpg", "gallery-light-oak.jpg", "room-bedroom.jpg", "bathroom-minimalist.jpg", "room-dining.jpg"),
    study("Traditional", "Symmetry, classic silhouettes, and enduring craftsmanship.", "gallery-traditional.jpg", "gallery-shaker.jpg", "gallery-georgian.jpg", "gallery-classic-marble.jpg", "room-dining.jpg"),
    study("Transitional", "Traditional comfort refined with contemporary restraint.", "gallery-warm.jpg", "gallery-sage-shaker.jpg", "room-bedroom.jpg", "gallery-white-marble.jpg", "room-dining.jpg"),
    study("Art Deco", "Graphic geometry, polished accents, and theatrical confidence.", "gallery-art-deco.jpg", "gallery-navy.jpg", "gallery-dramatic.jpg", "gallery-classic-marble.jpg", "room-dining.jpg"),
    study("Modern Rustic", "Grounded stone and timber shaped into relaxed modern rooms.", "gallery-rustic.jpg", "gallery-modern-oak.jpg", "gallery-cottage.jpg", "s-rustic-bath.jpg", "room-dining.jpg"),
    study("Warm Contemporary", "Soft curves, layered neutrals, and welcoming refinement.", "gallery-warm-contemporary.jpg", "gallery-warm.jpg", "room-bedroom.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Wabi-Sabi", "Imperfect texture, quiet tones, and intentional simplicity.", "gallery-warm-minimal.jpg", "gallery-light-oak.jpg", "room-bedroom.jpg", "gallery-stone.jpg", "room-dining.jpg"),
    study("Mediterranean", "Sun-washed plaster, terracotta, and tactile natural materials.", "gallery-mediterranean.jpg", "gallery-arched.jpg", "gallery-warm.jpg", "gallery-stone.jpg", "room-dining.jpg"),
    study("French Country", "Patina, linen, and relaxed elegance with classic roots.", "gallery-colonial.jpg", "gallery-farmhouse.jpg", "gallery-english-cottage.jpg", "gallery-classic-marble.jpg", "room-dining.jpg"),
    study("English Cottage", "Pattern, vintage character, and lived-in warmth.", "gallery-english-cottage.jpg", "gallery-sage-shaker.jpg", "gallery-cottage.jpg", "s-rustic-bath.jpg", "room-dining.jpg"),
    study("Organic Modern", "Curved forms, earthy color, and biophilic texture.", "gallery-natural.jpg", "gallery-modern-oak.jpg", "room-bedroom.jpg", "gallery-stone.jpg", "room-dining.jpg"),
    study("Contemporary", "Current forms, clean finishes, and confident negative space.", "gallery-modern-2.jpg", "gallery-handleless.jpg", "room-bedroom.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Maximalist", "Rich color, expressive art, and deliberately layered rooms.", "gallery-dramatic.jpg", "gallery-navy.jpg", "gallery-art-deco.jpg", "gallery-classic-marble.jpg", "room-dining.jpg"),
    study("Biophilic", "Living greenery, daylight, and materials that reconnect with nature.", "gallery-tropical.jpg", "gallery-natural.jpg", "interior-balcony.jpg", "gallery-stone.jpg", "room-dining.jpg"),
    study("Modern Luxury", "Tailored materials, architectural lighting, and restrained glamour.", "gallery-luxury.jpg", "gallery-white-marble.jpg", "gallery-dark-walnut.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Neoclassical", "Elegant symmetry and classical detail with a lighter modern hand.", "gallery-georgian.jpg", "gallery-classic-marble.jpg", "gallery-colonial.jpg", "gallery-white-marble.jpg", "room-dining.jpg"),
    study("Moroccan", "Carved arches, warm mineral color, and intricate artisan pattern.", "gallery-arched.jpg", "gallery-mediterranean.jpg", "gallery-warm.jpg", "gallery-stone.jpg", "room-dining.jpg"),
    study("Desert Modern", "Low silhouettes, mineral tones, and sun-shaped simplicity.", "gallery-stone.jpg", "gallery-warm-minimal.jpg", "room-bedroom.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("California Casual", "Pale oak, easy textiles, and bright indoor-outdoor living.", "gallery-light-oak.jpg", "gallery-modern-oak.jpg", "room-bedroom.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Grandmillennial", "Fresh color and nostalgic pattern arranged with confidence.", "gallery-cottage.jpg", "gallery-sage-shaker.jpg", "gallery-english-cottage.jpg", "gallery-classic-marble.jpg", "room-dining.jpg"),
    study("Tropical Modern", "Bold foliage and resort ease balanced by simple architecture.", "gallery-tropical.jpg", "gallery-natural.jpg", "interior-balcony.jpg", "gallery-modern-spa.jpg", "room-dining.jpg"),
    study("Cottagecore", "Handmade charm, botanical color, and deeply comfortable rooms.", "gallery-cottage.jpg", "gallery-farmhouse.jpg", "gallery-english-cottage.jpg", "s-rustic-bath.jpg", "room-dining.jpg")
)

fun HTML.examplesPage() {
    baseLayout("30 Interior Design Styles & Room Ideas | Housora AI") {
        section(classes = "examples-hero") {
            div(classes = "examples-hero-inner") {
                p(classes = "examples-eyebrow") { +"THE HOUSORA STYLE LIBRARY" }
                h1(classes = "examples-hero-title") { +"30 design styles, explored room by room" }
                p(classes = "examples-hero-sub") { +"Compare living rooms, kitchens, bedrooms, bathrooms, and dining rooms before trying a direction on your own photo." }
                a(href = "/interior-design", classes = "btn-primary btn-large") { +"START INTERIOR DESIGN "; i("lucide arrow-right") {} }
                div("examples-collection-controls") {
                    div(classes = "examples-control examples-control-search") {
                        label { htmlFor = "examples-search"; +"Search examples" }
                        textInput(classes = "examples-search") { id = "examples-search"; attributes["placeholder"] = "Search a style or room" }
                    }
                    div(classes = "examples-control") {
                        label { htmlFor = "examples-room-filter"; +"Room" }
                        select(classes = "examples-filter") {
                            id = "examples-room-filter"
                            listOf("" to "All rooms", "living room" to "Living room", "kitchen" to "Kitchen", "bedroom" to "Bedroom", "bathroom" to "Bathroom", "dining room" to "Dining room").forEach { (key, label) -> option { value = key; +label } }
                        }
                    }
                    div(classes = "examples-control") {
                        label { htmlFor = "examples-style-filter"; +"Style" }
                        select(classes = "examples-filter") {
                            id = "examples-style-filter"
                            option { value = ""; +"All styles" }
                            featuredStyleStudies.forEach { style -> option { value = style.name.lowercase(); +style.name } }
                        }
                    }
                    p("examples-result-count") { id = "examples-result-count"; attributes["aria-live"] = "polite" }
                }
            }
        }
        section(classes = "examples-layout") {
            div(classes = "examples-inner") {
                aside(classes = "examples-sidebar") {
                    h2(classes = "sidebar-styles-label") { +"STYLES" }
                    ul(classes = "styles-list") {
                        featuredStyleStudies.forEachIndexed { index, style ->
                            li(classes = if (index == 0) "style-item active" else "style-item") {
                                a(href = "#style-${styleSlug(style.name)}") { +style.name }
                            }
                        }
                    }
                }
                div(classes = "examples-content") {
                    featuredStyleStudies.forEachIndexed { styleIndex, style ->
                        article(classes = "style-detail-section${if (style.images.size == 1) " is-preview-only" else ""}") {
                            id = "style-${styleSlug(style.name)}"
                            attributes["data-example"] = ""
                            attributes["data-style"] = style.name.lowercase()
                            attributes["data-rooms"] = style.images.joinToString(" ") { it.room.lowercase() }
                            header(classes = "style-detail-header") {
                                div {
                                    p(classes = "style-detail-index") { +(styleIndex + 1).toString().padStart(2, '0') }
                                    h2(classes = "style-detail-title") { +style.name }
                                    p(classes = "style-detail-subtitle") { +style.description }
                                }
                                a(href = "/reference-style?reference=${style.images.first().src}", classes = "style-detail-link") { +"Try this style "; span { attributes["aria-hidden"] = "true"; +"→" } }
                            }
                            div(classes = "style-room-gallery") {
                                style.images.forEachIndexed { imageIndex, image ->
                                    figure(classes = if (imageIndex == 0) "style-room-tile is-featured" else "style-room-tile") {
                                        attributes["data-room"] = image.room.lowercase()
                                        div(classes = "style-room-image") {
                                            img(src = image.src, alt = "${style.name} ${image.room.lowercase()} inspiration") {
                                                attributes["width"] = "720"
                                                attributes["height"] = "480"
                                                attributes["loading"] = if (styleIndex == 0 && imageIndex == 0) "eager" else "lazy"
                                                if (styleIndex == 0 && imageIndex == 0) attributes["fetchpriority"] = "high"
                                                attributes["onerror"] = "this.closest('.style-room-tile').classList.add('is-fallback')"
                                            }
                                            div(classes = "style-room-fallback") {
                                                attributes["aria-hidden"] = "true"
                                                span { +style.name }
                                                small { +image.room }
                                            }
                                        }
                                        figcaption { +image.room }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
