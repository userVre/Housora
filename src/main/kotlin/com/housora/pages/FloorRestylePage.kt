package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.*

fun HTML.floorRestylePage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Floor Restyle",
        badge = "AI Floor Restyle Tool",
        heroHeading = "RESTYLE BEDROOM FLOORS WITH AI IN SECONDS",
        heroAction = "Restyle",
        heroElement = "Floors",
        heroWords = listOf("Living Room", "Bedroom", "Kitchen", "Bathroom", "Hallway", "Any Room"),
        heroLine2 = "floors with AI",
        heroLine3 = "in seconds",
        heroSlides = listOf("/static/images/floor-restyle-after.jpg", "/static/images/gallery-oak-herringbone.jpg", "/static/images/gallery-polished-concrete.jpg", "/static/images/gallery-oak-chevron.jpg"),
        toolName = "Floor Restyle",
        interactiveHeading = "Transform Your Floors with AI",
        uploadDescription = "Upload a photo and restyle your floors instantly",
        styleLabel = "FLOOR MATERIAL",
        styles = listOf(
            "Oak Herringbone" to "/static/images/s-herringbone.jpg",
            "White Marble" to "/static/images/s-marble.jpg",
            "Polished Concrete" to "/static/images/s-concrete.jpg",
            "Dark Walnut" to "/static/images/s-walnut.jpg",
            "Light Oak" to "/static/images/s-lightoak.jpg",
            "Oak Chevron" to "/static/images/s-chevron.jpg"
        ),
        showCustomPrompt = true,
        textInputPlaceholder = "Describe your ideal floor style...",
        quickIdeas = listOf(
            "Terracotta Tiles" to "Mediterranean warmth with earthy red tones",
            "Checkered Retro" to "Black and white checkered vintage tiles",
            "Bamboo Planks" to "Light eco-friendly bamboo flooring",
            "Dark Slate" to "Natural dark slate stone tiles",
            "Gray Oak LVP" to "Luxury vinyl plank in modern gray oak",
            "Hexagonal Cement" to "Matte hexagonal cement tiles"
        ),
        galleryHeading = "New Flooring Costs $5,000+ and You Can't Picture It",
        gallerySubtext = "One uploaded photo, the very same floor restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-oak-herringbone.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Oak Herringbone", "White Marble", "Polished Concrete", "Dark Walnut", "Light Oak", "Oak Chevron"),
        problemHeading = "New Flooring Costs $3,000+, and Samples Tell You Almost Nothing",
        problemDescription = "A small sample in a store looks nothing like it will in your home.",
        problemCards = listOf(
            Triple("home", "Homeowners", "You ordered samples, lined them up, and still can't decide."),
            Triple("building", "Real Estate Agents", "Dated flooring drags down the whole listing."),
            Triple("palette", "Interior Designers", "Clients want to visualize flooring before committing.")
        ),
        solutionText = "Skip the showroom trips entirely. Upload a photo and Housora AI applies any flooring material in under 30 seconds.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI floor restyle work?" to "Upload a photo of your room, choose a flooring material, and AI applies it realistically to your floors.",
            "Can I restyle existing flooring?" to "Yes! Upload any room photo — furnished or empty — and the AI will swap the flooring.",
            "What room types are supported?" to "All room types: living rooms, bedrooms, kitchens, bathrooms, hallways, and more.",
            "Is the flooring realistic?" to "Yes, our AI produces photorealistic renders that show exactly how the flooring looks in your space.",
            "How many floor materials are available?" to "6 flooring materials plus any custom style you can imagine.",
            "Do I need design experience?" to "No experience needed. Upload a photo and pick a material."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture"),
            Triple("AI Stairs Design", "Redesign staircase", "/stairs-design"),
            Triple("AI Garden Design", "Landscape outdoor", "/garden-design")
        ),
        keepReading = listOf(
            "Restyle your floors with AI" to "#",
            "How AI floor restyle works" to "#",
            "Flooring trends 2026" to "#"
        ),
        ctaHeading = "Ready to Transform Your Floors?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
