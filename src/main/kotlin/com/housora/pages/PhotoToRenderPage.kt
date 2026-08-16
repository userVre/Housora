package com.housora.pages

import kotlinx.html.*
import com.housora.templates.*

fun HTML.photoToRenderPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Photo to Render",
        badge = "AI Photo to Render Tool",
        heroHeading = "TURN YOUR PHOTOS INTO A PHOTOREALISTIC RENDER IN SECONDS",
        heroAction = "Turn a",
        heroElement = "Photos",
        heroWords = listOf("Photo", "3D Draft", "SketchUp", "Snapshot", "Sketch"),
        heroLine2 = "into a photorealistic",
        heroLine3 = "render in seconds",
        toolName = "Photo to Render",
        interactiveHeading = "Turn Any Photo into a Photorealistic Render",
        uploadDescription = "Upload a draft, sketch, or basic 3D view and get a finished render",
        styleLabel = "RENDER STYLE",
        styles = listOf("Photorealistic" to "/static/images/s-photo-render.jpg", "Warm Interior" to "/static/images/s-warm-render.jpg", "Cool Modern" to "/static/images/s-cool-render.jpg", "Luxury" to "/static/images/s-luxury-render.jpg", "Natural Light" to "/static/images/s-natural-render.jpg", "Dramatic" to "/static/images/s-dramatic-render.jpg"),
        optionGroups = listOf(
            ToolOptionGroup("RENDER STYLE", listOf(
                "Photorealistic" to "/static/images/s-photo-render.jpg",
                "Cinematic" to "/static/images/s-dramatic-render.jpg",
                "Artistic" to "/static/images/s-warm-render.jpg",
                "Kids in Motion" to "/static/images/s-airy.jpg",
                "Adults in Motion" to "/static/images/s-modern.jpg",
                "Family in Motion" to "/static/images/s-warm-render.jpg"
            ))
        ),
        textInputPlaceholder = "Describe the render style you want...",
        quickIdeas = listOf("photorealistic, golden hour light" to "Warm sunset glow", "cool modern, blue tones" to "Clean and contemporary", "luxury, rich textures and gold" to "High-end finish", "natural light, bright and airy" to "Fresh and open", "dramatic shadows, moody" to "Cinematic feel", "warm, cozy atmosphere" to "Inviting space"),
        galleryHeading = "Rough Drafts and Sketches Don't Impress Clients",
        gallerySubtext = "One uploaded photo, turned into a photorealistic render by AI in a range of styles. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-warm-render.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Photorealistic", "Warm Interior", "Cool Modern", "Luxury", "Natural Light", "Dramatic"),
        problemHeading = "Renders Are Expensive and Slow to Produce",
        problemDescription = "Professional rendering workflows can be difficult to scope for small projects. Use a visual concept to explore a direction before deciding what level of production you need.",
        problemCards = listOf(Triple("home", "Homeowners", "You have a rough idea or a 3D model view but need a polished render to share with contractors. Professional renders are too expensive for personal projects."), Triple("building", "Real Estate Agents", "A basic photo doesn't sell the potential of a space. A photorealistic render makes listings stand out and sell faster."), Triple("users", "Architects & Designers", "Rough drafts and 3D model views need polishing before client presentations. Manual rendering is time-consuming and costly.")),
        solutionText = "Upload a draft, sketch, or basic 3D model view to explore a photorealistic visual direction. Treat the output as a concept and verify materials, scale, and construction details separately.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(Testimonial("Jakub Kowalski", "CA", "JK", "Uploaded a basic SketchUp view and got a photorealistic render. Saved me hours of post-production work."), Testimonial("Daniela Reyes", "US", "DR", "Used it for a client presentation. They thought I spent days on the renders. Done in seconds."), Testimonial("Elena Hargreaves", "GB", "EH", "The quality is incredible. No one can tell it's AI-generated."), Testimonial("Kevin Tran", "US", "KT", "Turned my rough drafts into presentation-quality renders. Won the pitch.")),
        faqItems = listOf("What input formats work?" to "Any photo, sketch, 3D model screenshot, or draft image.", "How long does it take?" to "About 30 seconds per render. Upload and get your result instantly.", "Can I choose the style?" to "Yes! Photorealistic, Warm Interior, Cool Modern, Luxury, Natural Light, and Dramatic styles."),
        exploreTools = listOf(Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"), Triple("AI Floorplan to 3D", "Turn 2D plans into 3D", "/floorplan-to-3d"), Triple("AI Video Walkthrough", "Turn renders into video", "/video-walkthrough"), Triple("AI Floor Restyle", "Restyle your floors instantly", "/floor-restyle")),
        keepReading = listOf("How to create photorealistic renders" to "#", "Visualize a renovation before you start" to "#", "AI room makeover: before & after" to "#"),
        ctaHeading = "Ready to Create Professional Renders?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
