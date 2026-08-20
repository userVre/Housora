package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.windowsDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Windows Design",
        badge = "AI Windows Design Tool",
        heroHeading = "REDESIGN YOUR WINDOW WITH AI IN SECONDS",
        heroAction = "Redesign your",
        heroElement = "Window",
        heroWords = listOf("Window", "Frame", "Glazing", "Glass", "View", "Windows"),
        heroSlides = listOf("/static/images/tools/windows-design-hero-v2.jpg", "/static/images/gallery-black-frame.jpg", "/static/images/gallery-crittall.jpg", "/static/images/gallery-french-glass.jpg"),
        toolName = "Windows Design",
        interactiveHeading = "Redesign Your Windows with AI",
        uploadDescription = "Upload a photo of your window and redesign it instantly",
        styleLabel = "WINDOW STYLE",
        styles = listOf(
            "Black Frame" to "/static/images/s-black-frame.jpg",
            "Crittall Steel" to "/static/images/s-crittall-steel.jpg",
            "Georgian Bars" to "/static/images/s-georgian.jpg",
            "Picture Window" to "/static/images/s-picture.jpg",
            "Wood Frame" to "/static/images/s-wood-frame.jpg",
            "Arched" to "/static/images/s-arched-win.jpg",
            "Bay Window" to "/static/images/s-bay.jpg",
            "Floor-to-Ceiling" to "/static/images/s-floor-ceiling.jpg"
        ),
        textInputPlaceholder = "Describe any window style, frame or glazing...",
        quickIdeas = listOf(
            "black aluminium frame" to "Slim sightlines",
            "Crittall steel grid glazing" to "Industrial elegance",
            "white Georgian bars" to "Six panes, classic",
            "arched top window" to "Wood frame, warm",
            "floor-to-ceiling glazing" to "Maximum light",
            "warm oak window frame" to "Natural and cozy"
        ),
        galleryHeading = "Window Replacements Are Expensive and Hard to Choose",
        gallerySubtext = "One uploaded photo, the very same windows restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-crittall.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Crittall Steel", "Picture Window", "Georgian", "Black Frame", "Bay Window", "Wood Frame"),
        problemHeading = "New Windows Cost Hundreds Each, and They Are Hard to Picture in Place",
        problemDescription = "A frame sample in a showroom tells you nothing about how it will read on your wall. Replacing windows runs $300 to $1,200+ per window fitted.",
        problemCards = listOf(
            Triple("home", "Homeowners", "Windows shape every room's light and character, so tired white frames drag a house down. But you cannot tell whether black frames or Georgian bars will work until fitted."),
            Triple("building", "Real Estate Agents", "Dated windows in listing photos quietly cheapen a home. Replacing them before a sale is slow and costly. Virtual staging shows the space bright and modern."),
            Triple("users", "Window Companies & Installers", "Clients struggle to picture a window from a brochure page. You need to show black versus wood versus Crittall on their actual opening before they approve.")
        ),
        solutionText = "Skip the guesswork. Upload a photo of your window and Housora AI applies any style, frame or glazing to your actual wall in under 30 seconds, with correct perspective and daylight.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Hannah Boyle", "US", "HB", "Our old uPVC windows made the living room feel dated. I tried slim black frames in the AI, showed the installer, and it looks exactly like the render."),
            Testimonial("Owen Fletcher", "GB", "OF", "Swapped our plain window for Georgian bars in the render to match the period house. Convinced my wife instantly."),
            Testimonial("Priya Menon", "IN", "PM", "We wanted an arched window for the stairwell. The AI showed it on our real wall so we could picture the shape before spending."),
            Testimonial("Grace OConnor", "IE", "GO", "A bay window with a seat under it for the living room. Being able to see it first was worth it on its own.")
        ),
        faqItems = listOf(
            "Can I try different glazing types?" to "Yes! From clear to frosted, Crittall steel to Georgian bars.",
            "What window styles are available?" to "8 styles: Black Frame, Crittall Steel, Georgian Bars, Picture Window, Wood Frame, Arched, Bay Window, Floor-to-Ceiling.",
            "Is it accurate to real dimensions?" to "Yes! The AI applies the style to your actual window opening with correct perspective."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"),
            Triple("AI Kitchen Design", "Redesign your kitchen", "/kitchen-design"),
            Triple("AI Doors Design", "Redesign your doors", "/doors-design"),
            Triple("AI Stairs Design", "Redesign your staircase", "/stairs-design")
        ),
        keepReading = listOf(
            "Visualize a renovation before you start" to "#",
            "AI room makeover: before & after" to "#",
            "Redesign a room from a photo" to "#"
        ),
        ctaHeading = "Ready to Upgrade Your Windows?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
