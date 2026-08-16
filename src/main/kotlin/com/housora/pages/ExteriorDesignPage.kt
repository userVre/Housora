package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.exteriorDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Exterior Design",
        badge = "AI Exterior Design Tool",
        heroHeading = "REDESIGN YOUR HOUSE WITH AI IN 20 SECONDS",
        heroAction = "Redesign",
        heroElement = "House",
        heroWords = listOf("Apartment", "House", "Office", "Residential", "Retail", "Villa"),
        heroSlides = listOf("/static/images/exterior-after.jpg", "/static/images/gallery-colonial.jpg", "/static/images/gallery-modern.jpg", "/static/images/gallery-barn.jpg"),
        toolName = "Exterior Design",
        interactiveHeading = "Redesign Your Home Exterior with AI",
        uploadDescription = "Upload a photo of your home and redesign it instantly",
        styleLabel = "EXTERIOR STYLE",
        styles = listOf(
            "Modern" to "/static/images/s-modern.jpg",
            "Traditional" to "/static/images/s-traditional.jpg",
            "Minimalist" to "/static/images/s-minimalist.jpg",
            "Mediterranean" to "/static/images/s-mediterranean.jpg",
            "Farmhouse" to "/static/images/s-farmhouse.jpg",
            "Colonial" to "/static/images/s-colonial.jpg"
        ),
        optionGroups = listOf(
            ToolOptionGroup("BUILDING TYPE", listOf(
                "Apartment" to "/static/images/s-modern.jpg",
                "House" to "/static/images/s-traditional.jpg",
                "Office Building" to "/static/images/s-industrial.jpg",
                "Villa" to "/static/images/s-luxury-render.jpg",
                "Retail" to "/static/images/s-modern-flush.jpg",
                "Facade" to "/static/images/s-concrete.jpg"
            )),
            ToolOptionGroup("ARCHITECTURAL STYLE", listOf(
                "Art Deco" to "/static/images/s-art-deco.jpg",
                "Brutalist" to "/static/images/s-concrete.jpg",
                "Chinese" to "/static/images/s-japanese.jpg",
                "Modern" to "/static/images/s-modern.jpg",
                "Mediterranean" to "/static/images/s-mediterranean.jpg",
                "Farmhouse" to "/static/images/s-farmhouse.jpg",
                "Contemporary" to "/static/images/s-minimalist.jpg",
                "Tropical" to "/static/images/s-tropical.jpg"
            )),
            ToolOptionGroup("TIME OF DAY", listOf(
                "Day" to "/static/images/s-airy.jpg",
                "Golden Hour" to "/static/images/s-warm.jpg",
                "Evening" to "/static/images/s-day-night.jpg",
                "Night" to "/static/images/s-dramatic-render.jpg"
            ))
        ),
        textInputPlaceholder = "Describe your ideal exterior...",
        quickIdeas = listOf(
            "Modern Farmhouse" to "Black windows, board-and-batten siding, metal roof",
            "Traditional Colonial" to "Brick facade, columned porch, shutters",
            "Minimalist White" to "Stucco, flat roof, clean lines",
            "Mediterranean Villa" to "Terracotta roof, arched doorways, warm tones",
            "Rustic Cabin" to "Wood siding, stone foundation, forest setting",
            "Coastal Beach House" to "White siding, wraparound porch, ocean views"
        ),
        galleryHeading = "Most People Can't Visualize Their Dream Home Exterior",
        gallerySubtext = "One uploaded photo, the very same exterior restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-modern.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Modern", "Traditional", "Minimalist", "Mediterranean", "Farmhouse", "Colonial"),
        problemHeading = "Most People Can't Visualize Their Dream Home Exterior",
        problemDescription = "Renovating an exterior is expensive and irreversible. You need to see it first.",
        problemCards = listOf(
            Triple("home", "Homeowners", "Paint colors look different on a phone than on a full wall."),
            Triple("building", "Real Estate Agents", "A dated exterior kills curb appeal before buyers even walk in."),
            Triple("palette", "Architects & Designers", "Clients struggle to commit without seeing the final result.")
        ),
        solutionText = "Upload any exterior photo and the AI handles the rest. See your home in any style before spending a dime.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI exterior design work?" to "Upload a photo of your home exterior, choose a style, and Housora AI generates a realistic render of your home in the new look.",
            "Can I redesign a furnished exterior?" to "Yes! Upload any exterior photo — furnished or not — and the AI will transform it.",
            "What home types are supported?" to "All home types: single-family, townhouses, condos, cabins, and more.",
            "Is the exterior realistic?" to "Yes, our AI produces photorealistic renders that show exactly how your home would look.",
            "How many exterior styles are available?" to "Over 25 exterior styles including Modern, Traditional, Colonial, Farmhouse, Mediterranean, and more.",
            "Do I need design experience?" to "No experience needed. Just upload a photo and pick a style."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Garden Design", "Landscape outdoor", "/garden-design"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture"),
            Triple("AI Floor Restyle", "Swap flooring", "/floor-restyle")
        ),
        keepReading = listOf(
            "Redesign your home exterior with AI" to "#",
            "How AI exterior design works" to "#",
            "Exterior design trends 2026" to "#"
        ),
        ctaHeading = "Ready to Transform Your Home's Exterior?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
