package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.stairsDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Stairs Design",
        badge = "AI Stairs Design Tool",
        heroHeading = "REDESIGN YOUR TREADS WITH AI IN SECONDS",
        heroAction = "Redesign your",
        heroElement = "Staircase",
        heroWords = listOf("Railing", "Treads", "Banister", "Runner", "Stairwell", "Staircase"),
        heroSlides = listOf("/static/images/tools/stairs-design-hero.jpg", "/static/images/stairs-after.jpg", "/static/images/gallery-glass-railing.jpg", "/static/images/gallery-floating.jpg"),
        toolName = "Stairs Design",
        interactiveHeading = "Redesign Your Staircase with AI",
        uploadDescription = "Upload a photo of your stairs and redesign them instantly",
        styleLabel = "STAIRCASE STYLE",
        styles = listOf(
            "Modern Oak" to "/static/images/s-modernoak.jpg",
            "Floating" to "/static/images/s-floating.jpg",
            "Glass Railing" to "/static/images/s-glass.jpg",
            "Farmhouse" to "/static/images/s-farmhouse.jpg",
            "Industrial" to "/static/images/s-industrial.jpg",
            "Spiral" to "/static/images/s-spiral.jpg"
        ),
        textInputPlaceholder = "Describe your ideal staircase...",
        quickIdeas = listOf(
            "Oak & Metal" to "Oak treads with black metal railing",
            "Classic White" to "White spindles with a stair runner",
            "Glass Balustrade" to "Frameless glass for a modern look",
            "Under-Stair Storage" to "Built-in storage drawers under stairs",
            "Bold Risers" to "Painted risers in a bold accent color",
            "Carpet Runner" to "Carpet runner with brass rods"
        ),
        galleryHeading = "Staircase Renovations Cost $8,000+ and Are Hard to Visualize",
        gallerySubtext = "One uploaded photo, the very same staircase restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-floating.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Modern Oak", "Floating", "Glass Railing", "Farmhouse", "Industrial", "Spiral"),
        problemHeading = "A New Staircase Costs Thousands, and It Is Almost Impossible to Picture",
        problemDescription = "Staircase renovations are high-commitment. You need to see the result first.",
        problemCards = listOf(
            Triple("home", "Homeowners", "You can't visualize what a new staircase will look like in your home."),
            Triple("building", "Real Estate Agents", "A dated staircase drags down the whole entryway."),
            Triple("palette", "Interior Designers", "Clients want options but can't picture alternatives.")
        ),
        solutionText = "Skip the guesswork. Upload a photo of your staircase and Housora AI applies any style in under 30 seconds.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI stairs design work?" to "Upload a photo of your staircase, choose a style, and AI generates a realistic render of your new staircase.",
            "Can I redesign an existing staircase?" to "Yes! Upload any staircase photo and the AI will transform it.",
            "What staircase types are supported?" to "Straight, L-shaped, U-shaped, spiral, floating, and curved staircases.",
            "Is the design realistic?" to "Yes, our AI produces photorealistic renders that show exactly how your staircase will look.",
            "How many staircase styles are available?" to "8 staircase styles including Modern Oak, Floating, Glass Railing, and more.",
            "Do I need design experience?" to "No experience needed. Upload a photo and pick a style."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Floor Restyle", "Swap flooring", "/floor-restyle"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture"),
            Triple("AI Garden Design", "Landscape outdoor", "/garden-design")
        ),
        keepReading = listOf(
            "Redesign your staircase with AI" to "#",
            "How AI stairs design works" to "#",
            "Staircase design trends 2026" to "#"
        ),
        ctaHeading = "Ready to Transform Your Staircase?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
