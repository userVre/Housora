package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.doorsDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Doors Design",
        badge = "AI Doors Design Tool",
        heroHeading = "REDESIGN YOUR DOOR WITH AI IN SECONDS",
        heroAction = "Redesign your",
        heroElement = "Door",
        heroWords = listOf("Door", "Handle", "Panels", "Frame", "Doorway", "Doors"),
        heroSlides = listOf(
            "/static/images/tools/doors-design-hero.jpg",
            "/static/images/door-modern-flush.jpg",
            "/static/images/door-french-glass.jpg",
            "/static/images/door-black-crittall.jpg"
        ),
        toolName = "Doors Design",
        interactiveHeading = "Redesign Your Doors with AI",
        uploadDescription = "Upload a photo of your door and redesign it instantly",
        styleLabel = "DOOR STYLE",
        styles = listOf(
            "Modern Flush" to "/static/images/door-modern-flush.jpg",
            "Shaker" to "/static/images/door-shaker.jpg",
            "Classic Panelled" to "/static/images/door-classic-panelled.jpg",
            "French Glass" to "/static/images/door-french-glass.jpg",
            "Black Crittall" to "/static/images/door-black-crittall.jpg",
            "Sliding Barn" to "/static/images/door-sliding-barn.jpg",
            "Pivot" to "/static/images/door-pivot.jpg",
            "Arched" to "/static/images/door-arched.jpg"
        ),
        textInputPlaceholder = "Describe any door style, material or handle...",
        quickIdeas = listOf(
            "oak flush door, black handle" to "Clean modern look",
            "black Crittall glass door" to "Industrial steel frame",
            "white shaker panels" to "Classic with brushed nickel",
            "sliding barn door" to "On a black track",
            "French glass double doors" to "Elegant and open",
            "matte black, brass handle" to "Bold contemporary"
        ),
        galleryHeading = "New Doors Change the Feel of Every Room",
        gallerySubtext = "One uploaded photo, the very same doors restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/door-pivot.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("French Glass", "Black Crittall", "Shaker White", "Oak Flush", "Panelled", "Moody Black"),
        problemHeading = "New Doors Cost Hundreds Each, and They Are Hard to Picture in Place",
        problemDescription = "A door sample in a showroom tells you nothing about how it will read in your hallway. Replacing doors runs $150 to $1,000+ per door fitted.",
        problemCards = listOf(
            Triple("home", "Homeowners", "Doors are in every room, so tired flat ones drag the whole house down. But you cannot tell whether shaker panels or glass will actually work until they are hung."),
            Triple("building", "Real Estate Agents", "Dated doors in listing photos quietly cheapen a home. Replacing them before a sale is slow and costly. Virtual staging shows the space at its best."),
            Triple("users", "Door Companies & Fitters", "Clients struggle to picture a door from a catalog page. You need to show flush versus panelled on their actual opening before they approve an order.")
        ),
        solutionText = "Skip the guesswork. Upload a photo of your door and Housora AI applies any style, glass, panel or handle to your actual doorway in under 30 seconds, with correct perspective and lighting. Compare a dozen looks before you commit a cent.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Hannah Boyle", "US", "HB", "Our hollow builder-grade doors made the whole hallway feel cheap. I tried oak flush doors in the AI, showed the joiner, and they look exactly like the render now."),
            Testimonial("Owen Fletcher", "GB", "OF", "Swapped our flat white doors for shaker panels in the render and painted them a soft sage. Convinced my wife instantly. We ordered the real ones that week."),
            Testimonial("Priya Menon", "IN", "PM", "We wanted a pivot door for the study. The AI showed it on our real wall so we could picture the swing before spending a rupee."),
            Testimonial("Grace OConnor", "IE", "GO", "New handles and an arched top on our old door. Being able to see it first was worth it on its own.")
        ),
        faqItems = listOf(
            "Can I redesign just the door handle?" to "Yes! Upload a photo of your door and try different handle styles, from brass to matte black.",
            "What door styles are available?" to "8 styles including Modern Flush, Shaker, Classic Panelled, French Glass, Black Crittall, Sliding Barn, Pivot, and Arched.",
            "Is it accurate to real dimensions?" to "Yes! The AI applies the style to your actual doorway with correct perspective and lighting."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"),
            Triple("AI Kitchen Design", "Redesign your kitchen", "/kitchen-design"),
            Triple("AI Windows Design", "Redesign your windows", "/windows-design"),
            Triple("AI Stairs Design", "Redesign your staircase", "/stairs-design")
        ),
        keepReading = listOf(
            "Black interior doors: 2026 ideas & how to preview them" to "#",
            "Visualize a renovation before you start" to "#",
            "AI room makeover: before & after" to "#"
        ),
        ctaHeading = "Ready to Redesign Your Doors?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
