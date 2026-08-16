package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.layoutBoostPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Layout Boost",
        badge = "AI Room Layout Optimizer",
        heroHeading = "OPTIMIZE LAYOUT WITH AI IN 20 SECONDS",
        heroAction = "Optimize Layout",
        heroElement = "Layout",
        heroWords = emptyList(),
        toolName = "Layout Boost",
        interactiveHeading = "Boost Your Room Layout with AI",
        uploadDescription = "Upload a photo and optimize your room layout instantly",
        styleLabel = "OPTIMIZE FOR",
        styles = listOf(
            "Spaciousness" to "",
            "Functionality" to "",
            "Coziness" to ""
        ),
        optionGroups = listOf(
            ToolOptionGroup("OPTIMIZE FOR", listOf("Spaciousness" to "", "Functionality" to "", "Coziness" to ""), "pills"),
            ToolOptionGroup("SPACE FEEL", listOf("Airy & Open" to "", "Balanced" to "", "Cozy & Warm" to ""), "pills"),
            ToolOptionGroup("EXISTING FURNITURE", listOf("Keep & Rearrange" to "", "Suggest New" to ""), "pills")
        ),
        styleDisplayMode = "pills",
        extraStyleGroups = listOf(
            "SPACE FEEL" to listOf("Airy & Open", "Balanced", "Cozy & Warm")
        ),
        textInputPlaceholder = "Describe your ideal layout...",
        quickIdeas = listOf(
            "Open Plan Living" to "Maximize space with open flow",
            "Reading Nook" to "Cozy corner layout with armchair and lamp",
            "Family TV Room" to "Kid-friendly layout with storage",
            "Minimal Desk" to "Clean desk setup for productivity",
            "Entertaining Area" to "Open flow for hosting guests",
            "Small Bedroom" to "Maximize storage in a tight space"
        ),
        galleryHeading = "Bad Layouts Waste Space and Money",
        gallerySubtext = "One uploaded photo, the very same layout restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-scandinavian.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Spaciousness", "Functionality", "Coziness", "Airy & Open", "Balanced", "Cozy & Warm"),
        problemHeading = "Most Rooms Aren't Laid Out for How You Actually Live",
        problemDescription = "You bought great furniture but the room still feels off.",
        problemCards = listOf(
            Triple("home", "Homeowners", "Furniture doesn't fit right and traffic flow feels awkward."),
            Triple("building", "Real Estate Agents", "Poor layouts make rooms look smaller than they are."),
            Triple("palette", "Interior Designers", "Clients want help but can't visualize alternative arrangements.")
        ),
        solutionText = "AI Layout Boost analyzes your room and finds the optimal furniture arrangement.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the renders."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a better arrangement that made my room feel twice as big."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards and my interior designer."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact sofa on Amazon for $200 less.")
        ),
        faqItems = listOf(
            "How does AI layout optimization work?" to "Upload a photo of your room, choose a layout goal, and AI suggests the optimal furniture arrangement.",
            "Can I optimize a furnished room?" to "Yes! AI can rearrange your existing furniture or suggest new pieces for a better layout.",
            "What room types are supported?" to "All room types: living rooms, bedrooms, offices, dining rooms, and more.",
            "Is the layout realistic?" to "Yes, the AI considers furniture dimensions and room proportions for practical layouts.",
            "How many layout styles are available?" to "6 optimization goals: Spaciousness, Functionality, Coziness, and more.",
            "Do I need design experience?" to "No experience needed. Upload a photo and pick a goal."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room", "/interior-design"),
            Triple("AI Wall Texture", "Try paint colors", "/wall-texture"),
            Triple("AI Floor Restyle", "Swap flooring", "/floor-restyle"),
            Triple("AI Stairs Design", "Redesign staircase", "/stairs-design")
        ),
        keepReading = listOf(
            "Optimize your room layout with AI" to "#",
            "How AI layout optimization works" to "#",
            "Room layout best practices" to "#"
        ),
        ctaHeading = "Ready to Optimize Your Layout?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false,
        socialProofSubtext = "Got their layouts optimized."
    ))
}
