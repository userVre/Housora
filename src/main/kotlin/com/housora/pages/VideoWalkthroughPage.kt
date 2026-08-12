package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.*

fun HTML.videoWalkthroughPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Video Walkthrough",
        badge = "AI Video Walkthrough Tool",
        heroHeading = "GENERATE YOUR VIDEO WALKTHROUGH WITH AI",
        heroAction = "Generate",
        heroElement = "Video Walkthrough",
        heroWords = listOf("Cinematic", "Smooth Pan", "Dolly Zoom", "Orbit", "First Person"),
        heroLine2 = "video walkthrough",
        heroLine3 = "with AI",
        toolName = "Video Walkthrough",
        interactiveHeading = "Generate Cinematic Video Walkthroughs",
        uploadDescription = "Upload your designed room and create a video tour",
        styleLabel = "VIDEO STYLE",
        styles = listOf("Cinematic" to "/static/images/s-cinematic.jpg", "Smooth Pan" to "/static/images/s-smooth-pan.jpg", "Aerial View" to "/static/images/s-aerial.jpg", "Walk-through" to "/static/images/s-walkthrough.jpg", "Slow Zoom" to "/static/images/s-slow-zoom.jpg", "Day to Night" to "/static/images/s-day-night.jpg"),
        optionGroups = listOf(
            ToolOptionGroup("CAMERA STYLE", listOf(
                "Cinematic" to "/static/images/s-cinematic.jpg",
                "Smooth Pan" to "/static/images/s-smooth-pan.jpg",
                "Dolly Zoom" to "/static/images/s-slow-zoom.jpg",
                "Orbit" to "/static/images/s-aerial.jpg",
                "Aerial Flyover" to "/static/images/s-walkthrough.jpg"
            ), "select"),
            ToolOptionGroup("RATIO", listOf("16:9" to "", "9:16" to "", "1:1" to "", "4:3" to ""), "select"),
            ToolOptionGroup("DURATION", listOf("4 sec" to "", "8 sec" to ""), "select")
        ),
        textInputPlaceholder = "Describe the video movement you want...",
        quickIdeas = listOf("smooth camera pan across living room" to "Cinematic sweep", "cinematic entrance through front door" to "Dramatic reveal", "aerial overview of open plan" to "Bird's eye view", "day to night lighting transition" to "Time lapse effect", "slow zoom into kitchen detail" to "Focus shot", "walk-through from room to room" to "Full tour"),
        galleryHeading = "Static Renders Don't Capture the Feel of a Space",
        gallerySubtext = "One uploaded photo, animated into a video walkthrough by AI in a range of styles. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-walkthrough.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Cinematic", "Smooth Pan", "Aerial", "Walk-through", "Slow Zoom", "Day to Night"),
        problemHeading = "Static Renders Don't Capture How a Space Feels",
        problemDescription = "Photos are flat. Clients need to feel like they are in the room. Static images miss the flow, the light changes, the spatial relationships.",
        problemCards = listOf(Triple("home", "Homeowners", "You designed a beautiful room but photos don't always communicate how it feels to move through the space."), Triple("building", "Real Estate Agents", "A short walkthrough can help prospective buyers understand a listing's layout before visiting."), Triple("users", "Designers & Architects", "A moving preview can complement static renders and make a design direction easier to discuss.")),
        solutionText = "Upload your designed room to explore a smooth, cinematic video walkthrough concept. Check the result against the original room before sharing it in a listing or presentation.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(Testimonial("Jakub Kowalski", "CA", "JK", "Sent a video walkthrough to my contractor. He thought I hired a videographer."), Testimonial("Daniela Reyes", "US", "DR", "Posted the video on TikTok and got 50k views. My friends couldn't believe it was AI."), Testimonial("Elena Hargreaves", "GB", "EH", "The video walkthrough closed the deal with my client in minutes."), Testimonial("Astrid Hedlund", "CH", "AH", "Created a walkthrough of my whole apartment. It looks like a professional tour.")),
        faqItems = listOf("How long are the videos?" to "Videos are typically 15-30 seconds, perfect for social media or client presentations.", "What format are the videos?" to "MP4 format, compatible with all social platforms and presentation software.", "Can I choose camera movements?" to "Yes! Choose from cinematic, smooth pan, aerial, walk-through, slow zoom, and day to night styles."),
        exploreTools = listOf(Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"), Triple("AI Floorplan to 3D", "Turn 2D plans into 3D rooms", "/floorplan-to-3d"), Triple("AI Photo to Render", "Turn drafts into renders", "/photo-to-render"), Triple("AI Floor Restyle", "Swap flooring in seconds", "/floor-restyle")),
        keepReading = listOf("How to create real estate video tours" to "#", "Visualize a renovation before you start" to "#", "AI room makeover: before & after" to "#"),
        ctaHeading = "Ready to Bring Your Designs to Life?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
