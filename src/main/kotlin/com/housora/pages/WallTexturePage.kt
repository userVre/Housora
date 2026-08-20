package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.wallTexturePage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Wall Texture",
        badge = "AI Wall Texture & Paint Visualizer",
        heroHeading = "RESTYLE BEDROOM WALLS WITH AI IN SECONDS",
        heroAction = "Restyle",
        heroElement = "Walls",
        heroWords = listOf("Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Any Room"),
        heroLine2 = "walls with AI in seconds",
        heroSlides = listOf("/static/images/tools/wall-texture-hero.jpg", "/static/images/wall-after.jpg", "/static/images/gallery-wood-paneling.jpg", "/static/images/gallery-stone.jpg"),
        toolName = "Wall Texture",
        interactiveHeading = "Restyle Your Walls with AI",
        uploadDescription = "Upload a photo of your room and restyle your walls instantly",
        styleLabel = "WALL TEXTURE",
        styles = listOf(
            "Exposed Brick" to "/static/images/s-brick.jpg",
            "Subway Tile" to "/static/images/s-subway.jpg",
            "Wood Paneling" to "/static/images/s-wood.jpg",
            "Stone" to "/static/images/s-stone.jpg",
            "Navy Feature" to "/static/images/s-navy.jpg",
            "Sage Green" to "/static/images/s-sage.jpg"
        ),
        showCustomPrompt = true,
        textInputPlaceholder = "Describe your ideal wall style...",
        quickIdeas = listOf(
            "Exposed Brick" to "Industrial accent wall with warm red tones",
            "Navy Feature" to "Bold navy blue accent wall for drama",
            "Subway Tile" to "Classic white subway tile backsplash",
            "Wood Paneling" to "Warm vertical wood slat wall",
            "Sage Green" to "Calming sage green bedroom walls",
            "Textured Plaster" to "Old-world textured plaster finish"
        ),
        galleryHeading = "Paint Samples Never Show the Full Wall",
        gallerySubtext = "One uploaded photo, the very same walls restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-exposed-brick.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Exposed Brick", "Subway Tile", "Wood Paneling", "Stone", "Navy Feature", "Sage Green"),
        problemHeading = "Paint Swatches Lie, And Repainting Costs $400+",
        problemDescription = "A 2-inch swatch looks nothing like a full wall.",
        problemCards = listOf(
            Triple("home", "Homeowners", "You picked a color, painted the whole wall, and hate it."),
            Triple("building", "Real Estate Agents", "A bold wall color can kill a sale before it starts."),
            Triple("palette", "Interior Designers", "Clients ask for 'something different' but can't describe it.")
        ),
        solutionText = "Skip the sample pots entirely. Upload a photo and Housora AI applies any wall texture or paint color in under 30 seconds.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI wall texture work?" to "Upload a photo of your room, choose a wall texture or paint color, and AI applies it to your walls realistically.",
            "Can I restyle textured walls?" to "Yes! The AI handles any wall type — painted, wallpapered, brick, or plaster.",
            "What room types are supported?" to "All room types: living rooms, bedrooms, kitchens, bathrooms, offices, and more.",
            "Is the texture realistic?" to "Yes, our AI produces photorealistic renders that show exactly how the texture or color looks on your walls.",
            "How many wall textures are available?" to "6 wall textures plus any custom paint color you can imagine.",
            "Do I need design experience?" to "No experience needed. Upload a photo and pick a texture or color."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Floor Restyle", "Swap flooring", "/floor-restyle"),
            Triple("AI Stairs Design", "Redesign staircase", "/stairs-design"),
            Triple("AI Garden Design", "Landscape outdoor", "/garden-design")
        ),
        keepReading = listOf(
            "Change wall color in a photo with AI" to "#",
            "Best AI wall color tools (2026)" to "#",
            "Accent wall ideas for 2026" to "#"
        ),
        ctaHeading = "Ready to Transform Your Walls?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
