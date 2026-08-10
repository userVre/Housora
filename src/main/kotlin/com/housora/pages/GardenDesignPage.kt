package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.*

fun HTML.gardenDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Garden Design",
        badge = "AI Garden & Landscape Design Tool",
        heroHeading = "REDESIGN YOUR GARDEN WITH AI IN 20 SECONDS",
        heroAction = "Redesign",
        heroElement = "Garden",
        heroWords = listOf("Backyard", "Front Yard", "Patio", "Terrace", "Pool Area", "Rooftop", "Any Garden"),
        heroSlides = listOf("/static/images/garden-after.jpg", "/static/images/gallery-tropical.jpg", "/static/images/gallery-cottage.jpg", "/static/images/gallery-natural.jpg"),
        toolName = "Garden Design",
        interactiveHeading = "Design Your Dream Garden with AI",
        uploadDescription = "Upload a photo of your garden and redesign it instantly",
        styleLabel = "GARDEN STYLE",
        styles = listOf(
            "Modern" to "/static/images/s-modern.jpg",
            "Japanese" to "/static/images/s-japanese.jpg",
            "English Cottage" to "/static/images/s-cottage.jpg",
            "Mediterranean" to "/static/images/s-mediterranean.jpg",
            "Tropical" to "/static/images/s-tropical.jpg",
            "Minimalist" to "/static/images/s-minimalist.jpg"
        ),
        optionGroups = listOf(
            ToolOptionGroup("STYLE", listOf(
                "Surprise Me" to "/static/images/s-tropical.jpg",
                "Modern" to "/static/images/s-modern.jpg",
                "Tropical" to "/static/images/s-tropical.jpg",
                "Japanese" to "/static/images/s-japanese.jpg",
                "English Cottage" to "/static/images/s-cottage.jpg",
                "Mediterranean" to "/static/images/s-mediterranean.jpg",
                "Minimalist" to "/static/images/s-minimalist.jpg",
                "Rustic" to "/static/images/s-farmhouse.jpg"
            )),
            ToolOptionGroup("GREENERY", listOf(
                "Lush Planting" to "",
                "Low Maintenance" to "",
                "Native Plants" to "",
                "Edible Garden" to "",
                "Tropical Foliage" to "",
                "Ornamental Grasses" to ""
            ), "pills")
        ),
        textInputPlaceholder = "Describe your ideal garden...",
        quickIdeas = listOf(
            "Zen Garden" to "Gravel paths, rocks, bamboo, water feature",
            "English Cottage" to "Climbing roses, stone walls, winding paths",
            "Modern Patio" to "Fire pit, outdoor seating, minimalist planters",
            "Tropical Retreat" to "Palm trees, poolside, lush greenery",
            "Minimalist Gravel" to "Clean lines, succulents, low maintenance",
            "Outdoor Dining" to "Pergola, string lights, dining table"
        ),
        galleryHeading = "Garden Design Feels Overwhelming Without Seeing It First",
        gallerySubtext = "One uploaded photo, the very same garden restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-japanese.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Modern", "Japanese", "English Cottage", "Mediterranean", "Tropical", "Minimalist"),
        problemHeading = "Most People Can't Picture Their Dream Garden",
        problemDescription = "Landscaping is expensive and hard to undo. You need to see it first.",
        problemCards = listOf(
            Triple("home", "Homeowners", "A backyard feels like a blank canvas with no guide."),
            Triple("building", "Real Estate Agents", "Outdoor spaces sell homes but most are underutilized."),
            Triple("palette", "Landscape Designers", "Clients want to see options before committing to a design.")
        ),
        solutionText = "AI garden design fills the gap between imagination and reality. Upload a photo and see your garden transformed.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI garden design work?" to "Upload a photo of your outdoor space, choose a style, and AI generates a realistic garden design.",
            "Can I redesign a furnished garden?" to "Yes! Upload any outdoor photo and the AI will redesign it with new landscaping and furniture.",
            "What outdoor spaces are supported?" to "Backyards, front yards, patios, decks, pool areas, and balconies.",
            "Is the design realistic?" to "Yes, our AI produces photorealistic renders showing exactly how your garden would look.",
            "How many garden styles are available?" to "Over 15 garden styles including Modern, Japanese, English Cottage, Tropical, and more.",
            "Do I need design experience?" to "Not at all! Just upload a photo and describe your dream garden."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Exterior Design", "Redesign home exterior", "/exterior-design"),
            Triple("AI Floor Restyle", "Swap flooring", "/floor-restyle"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture")
        ),
        keepReading = listOf(
            "Design your garden with AI" to "#",
            "How AI garden design works" to "#",
            "Garden design trends 2026" to "#"
        ),
        ctaHeading = "Ready to Transform Your Outdoor Space?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
