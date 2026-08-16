package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.bathroomDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Bathroom Design",
        badge = "AI Bathroom Design Tool",
        heroHeading = "REDESIGN YOUR TILES WITH AI IN SECONDS",
        heroAction = "Redesign your",
        heroElement = "Bathroom",
        heroWords = listOf("Bathroom", "Tiles", "Vanity", "Shower", "Ensuite", "Bathrooms"),
        heroSlides = listOf("/static/images/bathroom-after.jpg", "/static/images/gallery-modern-spa.jpg", "/static/images/gallery-modern-spa.jpg", "/static/images/gallery-white-marble.jpg"),
        toolName = "Bathroom Design",
        interactiveHeading = "Redesign Your Bathroom with AI",
        uploadDescription = "Upload a photo of your bathroom and redesign it instantly",
        styleLabel = "BATHROOM STYLE",
        styles = listOf(
            "Modern Spa" to "/static/images/s-modern-spa.jpg",
            "Classic Marble" to "/static/images/s-classic-marble.jpg",
            "Minimalist" to "/static/images/bathroom-minimalist.jpg",
            "Rustic" to "/static/images/s-rustic-bath.jpg",
            "Art Deco" to "/static/images/s-art-deco.jpg",
            "Scandinavian" to "/static/images/s-scandi-bath.jpg"
        ),
        textInputPlaceholder = "Describe any bathroom style, tile or fixture...",
        quickIdeas = listOf(
            "marble tiles, gold fixtures" to "Luxurious spa feel",
            "matte black fixtures, concrete" to "Bold modern look",
            "subway tile, vintage vanity" to "Classic charm",
            "wood accents, stone basin" to "Natural warmth",
            "frameless glass shower" to "Open and airy",
            "terracotta floor, white walls" to "Mediterranean warmth"
        ),
        galleryHeading = "Bathroom Renovations Cost $10,000+ and Samples Mislead",
        gallerySubtext = "One uploaded photo, the very same bathroom restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-sage.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Modern Spa", "Classic Marble", "Minimalist", "Rustic", "Art Deco", "Scandinavian"),
        problemHeading = "Bathroom Renovations Cost $10,000+ and Samples Mislead",
        problemDescription = "A tile sample under store lighting looks nothing like your bathroom. Renovations average $10,000 to $25,000.",
        problemCards = listOf(
            Triple("home", "Homeowners", "You buy tile samples, lay them on the floor, and still cannot picture the final result. Choosing wrong is expensive and disruptive."),
            Triple("building", "Real Estate Agents", "A dated bathroom is a top reason buyers lose interest. Virtual staging shows the space at its best instantly."),
            Triple("users", "Bathroom Designers & Fitters", "Clients need to see subway tile versus marble versus mosaic on their actual bathroom before they commit to a $10,000 project.")
        ),
        solutionText = "Skip the guesswork. Upload a photo of your bathroom and Housora AI applies any tile, fixture, or vanity style in under 30 seconds, with correct perspective and lighting.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Manon Girard", "FR", "MG", "Subway tile in the bathroom without actually tiling. The visualization was so good we went ahead and did the real thing."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Saved me from tiling my bathroom the wrong shade. Tested navy vs charcoal and navy won."),
            Testimonial("Camille Dufour", "FR", "CD", "Tested sage green in every room of the house in 5 minutes. Love it."),
            Testimonial("Tereza Havlova", "CZ", "TH", "White brick texture in my bathroom. Done in 20 seconds. Nice.")
        ),
        faqItems = listOf(
            "Can I redesign an existing bathroom?" to "Yes! Upload a photo and see it transformed with new tiles, fixtures, and vanities.",
            "What styles are available?" to "10+ styles including Modern Spa, Classic Marble, Minimalist, Rustic, Art Deco, Scandinavian.",
            "Is it accurate?" to "Yes! The AI applies styles with correct perspective, lighting, and shadow."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"),
            Triple("AI Kitchen Design", "Redesign your kitchen", "/kitchen-design"),
            Triple("AI Floor Restyle", "Swap flooring in seconds", "/floor-restyle"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture")
        ),
        keepReading = listOf(
            "Bathroom design ideas for 2026" to "#",
            "Visualize a renovation before you start" to "#",
            "AI room makeover: before & after" to "#"
        ),
        ctaHeading = "Ready to Transform Your Bathroom?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
