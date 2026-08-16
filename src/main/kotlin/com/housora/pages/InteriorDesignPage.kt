package com.housora.pages

import kotlinx.html.HTML
import com.housora.templates.*

/**
 * The interior-design route uses the same shared tool template as the live
 * reference. Keeping this route on the shared template also keeps its mobile
 * hero, upload workflow, styles, FAQ and related-tool sections consistent.
 */
fun HTML.interiorDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "AI Interior Design From Your Own Photo | Housora",
        badge = "AI Interior Design Tool",
        heroAction = "Redesign",
        heroElement = "Bedroom",
        heroWords = listOf("Bedroom", "Kitchen", "Bathroom", "Office", "Interior", "Any Room"),
        heroLine2 = "with AI, shaped around your space",
        heroLine3 = "Furniture from",
        heroSlides = listOf(
            "/static/images/interior-after.jpg",
            "/static/images/hero-after.jpg",
            "/static/images/room-after.jpg",
            "/static/images/kitchen-after.jpg"
        ),
        toolName = "Interior Design",
        interactiveHeading = "Design Your Room with AI",
        uploadDescription = "Upload a photo of any room and redesign it instantly",
        styleLabel = "ROOM STYLE",
        styles = listOf(
            "Modern" to "/static/images/interior-after.jpg",
            "Scandinavian" to "/static/images/s-scandi-3d.jpg",
            "Minimalist" to "/static/images/s-minimalist.jpg",
            "Industrial" to "/static/images/interior-industrial.jpg",
            "Japandi" to "/static/images/s-warm-min.jpg",
            "Warm Modern" to "/static/images/s-warm.jpg"
        ),
        optionGroups = listOf(
            ToolOptionGroup("ROOM TYPE", listOf(
                "Living Room" to "/static/images/room-living.jpg",
                "Bedroom" to "/static/images/room-bedroom.jpg",
                "Dining Room" to "/static/images/room-dining.jpg",
                "Kitchen" to "/static/images/kitchen-after.jpg",
                "Bathroom" to "/static/images/bathroom-minimalist.jpg",
                "Home Office" to "/static/images/interior-after.jpg",
                "Kids Room" to "/static/images/room-bedroom.jpg",
                "Balcony" to "/static/images/interior-balcony.jpg",
                "Any Room" to "/static/images/room-living.jpg"
            )),
            ToolOptionGroup("STYLE", listOf(
                "Scandinavian" to "/static/images/s-scandi-3d.jpg",
                "Modern" to "/static/images/s-modern.jpg",
                "Coastal" to "/static/images/interior-coastal.jpg",
                "Japandi" to "/static/images/s-warm-min.jpg",
                "Minimalist" to "/static/images/s-minimalist.jpg",
                "Industrial" to "/static/images/interior-industrial.jpg",
                "Luxury" to "/static/images/s-luxury-render.jpg",
                "Farmhouse" to "/static/images/s-farmhouse.jpg"
            )),
            ToolOptionGroup("COLOR PALETTE", listOf("Neutral" to "", "Warm" to "", "Cool" to "", "Earth" to "", "Mono" to "", "Surprise Me" to ""), "palette")
        ),
        textInputPlaceholder = "Describe the room style, furniture or budget you want...",
        quickIdeas = listOf(
            "warm modern living room" to "Warm modern",
            "minimalist neutral bedroom" to "Quiet minimalist",
            "Scandinavian room with natural wood" to "Scandinavian",
            "luxury hotel-style interior" to "Luxury hotel"
        ),
        challengeHeading = "Most People Can't Picture the End Result",
        challengeIntro = "A room photo does not show how a new style will feel. Housora lets you see the finished space before you buy anything.",
        solutionText = "Upload one photo, choose a style, and get a photorealistic room redesign with furniture you can actually shop.",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Sofia Martin", "US", "SM", "I finally saw exactly how my living room could look before buying anything."),
            Testimonial("James Wilson", "GB", "JW", "The redesign kept my room layout and made the style feel completely new."),
            Testimonial("Priya Menon", "IN", "PM", "Six beautiful directions from one photo. The results were surprisingly realistic.")
        ),
        faqItems = listOf(
            "How does AI interior design work?" to "Upload a room photo, choose a style, and Housora creates a photorealistic redesign in seconds.",
            "Can I redesign any room?" to "Yes. Use it for living rooms, bedrooms, kitchens, bathrooms, offices and more.",
            "Can I try Housora for free?" to "Yes. Your first design is free and does not require a credit card.",
            "Can I describe my own style?" to "Yes. Add a custom description or choose one of the ready-made style options."
        ),
        exploreTools = listOf(
            Triple("AI Kitchen Design", "Redesign your kitchen", "/ai-kitchen-design"),
            Triple("AI Bathroom Design", "Redesign your bathroom", "/ai-bathroom-design"),
            Triple("AI Exterior Design", "Redesign your exterior", "/exterior-design"),
            Triple("AI Layout Boost", "Improve your room layout", "/layout-boost")
        ),
        keepReading = listOf(
            "How to redesign a room with AI" to "/blog",
            "Interior design ideas for 2026" to "/inspirations",
            "AI room makeover before and after" to "/examples"
        ),
        ctaHeading = "Ready to Redesign Your Space?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        directFlow = true
    ))
}
