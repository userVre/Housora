package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.*

fun HTML.floorplanTo3DPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Floorplan to 3D",
        badge = "AI-Powered 3D Visualization",
        heroHeading = "CONVERT YOUR BLUEPRINT TO 3D IN SECONDS",
        heroAction = "Convert",
        heroElement = "Blueprint",
        heroWords = listOf("Floorplan", "Blueprint", "Sketch", "Layout", "CAD Plan", "Drawing", "Any Plan"),
        heroLine2 = "to 3D in seconds",
        toolName = "Floorplan to 3D",
        interactiveHeading = "Convert 2D Floorplans to Photorealistic 3D",
        uploadDescription = "Upload a 2D floor plan and get a photorealistic 3D render",
        styleLabel = "RENDER STYLE",
        styles = listOf("Photorealistic" to "/static/images/s-photo-real.jpg", "Modern Minimal" to "/static/images/s-modern-3d.jpg", "Warm Contemporary" to "/static/images/s-warm-3d.jpg", "Luxury" to "/static/images/s-luxury-3d.jpg", "Scandinavian" to "/static/images/s-scandi-3d.jpg", "Industrial" to "/static/images/s-industrial-3d.jpg"),
        optionGroups = listOf(
            ToolOptionGroup("RENDER STYLE", listOf(
                "Photorealistic" to "/static/images/s-photo-real.jpg",
                "3D Model" to "/static/images/s-modern-3d.jpg",
                "Architectural Drawing" to "/static/images/s-industrial-3d.jpg",
                "Hand-Drawn Sketch" to "/static/images/s-warm-3d.jpg",
                "Wireframe" to "/static/images/s-scandi-3d.jpg",
                "Clay Render" to "/static/images/s-luxury-3d.jpg"
            ))
        ),
        textInputPlaceholder = "Describe the style for your 3D render...",
        quickIdeas = listOf("photorealistic, warm lighting" to "Realistic look", "minimal, white walls, wood floors" to "Clean and modern", "luxury, marble and gold accents" to "High-end finish", "scandinavian, light and airy" to "Nordic warmth", "industrial, concrete and steel" to "Urban edge", "cozy, earth tones, soft textures" to "Comfortable feel"),
        galleryHeading = "2D Floorplans Don't Show What a Room Really Looks Like",
        gallerySubtext = "One floorplan, converted into photorealistic 3D renders by AI in a range of styles. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-photorealistic.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Photorealistic", "Modern Minimal", "Warm Contemporary", "Luxury", "Scandinavian", "Industrial"),
        problemHeading = "2D Floorplans Are Hard for Clients to Interpret",
        problemDescription = "A flat blueprint doesn't sell the vision. Clients struggle to imagine a 3D space from a 2D drawing, leading to slow approvals and missed opportunities.",
        problemCards = listOf(Triple("home", "Homeowners", "You have a floorplan from the architect but cannot picture what the finished space will actually look like. Visualizing from lines on paper is nearly impossible."), Triple("building", "Real Estate Agents", "A 2D floorplan in a listing gets skipped. A photorealistic 3D render gets saved, shared, and generates inquiries."), Triple("users", "Architects & Designers", "Clients need to see the finished result before approving a build. Converting floorplans to 3D renders closes deals faster.")),
        solutionText = "Upload a 2D floor plan, sketch, PDF plan, or blueprint image to explore a furnished 3D design concept. Verify dimensions and construction details against the source plan.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(Testimonial("Jakub Kowalski", "CA", "JK", "Uploaded a rough sketch and got a photorealistic 3D render. My client was amazed."), Testimonial("Tereza Havlova", "CZ", "TH", "The 3D conversion saved me hours of manual rendering. Incredible quality."), Testimonial("Daniela Reyes", "US", "DR", "Posted the 3D render on social media. Got three new clients from it."), Testimonial("Kevin Tran", "US", "KT", "My hand-drawn floorplan became a professional 3D render in 30 seconds.")),
        faqItems = listOf("What floorplan formats work?" to "Hand-drawn sketches, PDF plans, blueprint images, and any photo of a floorplan.", "How accurate is the conversion?" to "The AI preserves room dimensions and layout while adding furniture, lighting, and materials.", "Can I choose the furniture style?" to "Yes! Choose from Photorealistic, Modern Minimal, Warm Contemporary, Luxury, Scandinavian, and Industrial styles."),
        exploreTools = listOf(Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"), Triple("AI Photo to Render", "Turn drafts into renders", "/photo-to-render"), Triple("AI Video Walkthrough", "Turn renders into video", "/video-walkthrough"), Triple("AI Floor Restyle", "Swap flooring in seconds", "/floor-restyle")),
        keepReading = listOf("How to read a floorplan" to "#", "Visualize a renovation before you start" to "#", "AI room makeover: before & after" to "#"),
        ctaHeading = "Ready to Bring Your Floorplans to Life?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false,
        socialProofSubtext = "Got their spaces visualized."
    ))
}
