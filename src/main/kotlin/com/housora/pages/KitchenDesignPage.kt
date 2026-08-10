package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.*

fun HTML.kitchenDesignPage() {
    toolPage(ToolPageConfig(
        pageTitle = "Housora - AI Kitchen Design",
        badge = "AI Kitchen Design Tool",
        heroHeading = "REDESIGN YOUR CABINETS WITH AI IN SECONDS",
        heroAction = "Redesign your",
        heroElement = "Kitchen",
        heroWords = listOf("Kitchen", "Cabinets", "Worktop", "Island", "Layout", "Kitchens"),
        heroSlides = listOf("/static/images/kitchen-after.jpg", "/static/images/gallery-sage-shaker.jpg", "/static/images/gallery-modern-oak.jpg", "/static/images/gallery-handleless.jpg"),
        toolName = "Kitchen Design",
        interactiveHeading = "Redesign Your Kitchen with AI",
        uploadDescription = "Upload a photo of your kitchen and redesign it instantly",
        styleLabel = "KITCHEN STYLE",
        styles = listOf(
            "Modern Handleless" to "/static/images/s-handleless.jpg",
            "Scandinavian" to "/static/images/s-scandi-kit.jpg",
            "Sage Shaker" to "/static/images/s-sage-shaker.jpg",
            "Farmhouse" to "/static/images/s-farmhouse-kit.jpg",
            "Industrial" to "/static/images/s-industrial-kit.jpg",
            "Warm Minimal" to "/static/images/s-warm-min.jpg",
            "Two-Tone" to "/static/images/s-two-tone.jpg",
            "Timeless White" to "/static/images/s-timeless-white.jpg"
        ),
        textInputPlaceholder = "Describe any kitchen style, cabinet colour or worktop...",
        quickIdeas = listOf(
            "sage green shaker, brass handles" to "Classic with a twist",
            "handleless matte navy cabinets" to "Sleek and modern",
            "white shaker, marble worktop" to "Timeless elegance",
            "warm oak, stone splashback" to "Natural warmth",
            "industrial open shelving" to "Urban edge",
            "minimalist, integrated appliances" to "Clean lines"
        ),
        galleryHeading = "Kitchens Cost $15,000+ and It Is Almost Impossible to Picture",
        gallerySubtext = "One uploaded photo, the very same kitchen restyled by AI into a range of looks. Click any thumbnail to compare",
        galleryMainImage = "/static/images/gallery-handleless.jpg",
        galleryThumbPrefix = "gallery",
        galleryStyles = listOf("Modern Handleless", "Scandinavian", "Sage Shaker", "Farmhouse", "Industrial", "Warm Minimal", "Two-Tone", "Timeless White"),
        problemHeading = "Kitchens Cost $15,000+ and It Is Almost Impossible to Picture",
        problemDescription = "A cabinet door sample in a showroom tells you nothing about the full kitchen. Replacing a kitchen averages $15,000 to $40,000.",
        problemCards = listOf(
            Triple("home", "Homeowners", "You visit three showrooms, collect samples, and still cannot picture the final result. Choosing wrong means living with a kitchen you dislike."),
            Triple("building", "Real Estate Agents", "A dated kitchen can make it harder for buyers to picture a listing's potential. A visual concept provides another direction to discuss."),
            Triple("users", "Kitchen Designers & Fitters", "Clients struggle to visualize the finished kitchen from a catalog page. You need to show them the result on their actual kitchen.")
        ),
        solutionText = "Skip the showroom trips. Upload a photo of your kitchen and Housora AI applies any cabinet style, worktop, or colour in under 30 seconds, with correct lighting and perspective.",
        statsLabel = "A growing toolkit for clearer design decisions",

        stats = emptyList(),
        testimonials = listOf(
            Testimonial("Jakub Kowalski", "CA", "JK", "My contractor literally asked me who did the kitchen renders. It was just me and Housora."),
            Testimonial("Tereza Havlova", "CZ", "TH", "Found a kitchen style I never would have picked in a showroom. The AI nailed it."),
            Testimonial("Daniela Reyes", "US", "DR", "This replaced my Pinterest boards, my mood boards, and my interior designer. For the kitchen."),
            Testimonial("Elena Hargreaves", "GB", "EH", "Found the exact cabinet on Wayfair for $200 less than the showroom quoted."),
            Testimonial("Priya Menon", "IN", "PM", "I uploaded my outdated kitchen photo and got 6 beautiful redesigns in under a minute. Unreal."),
            Testimonial("Diego Herrera", "MX", "DH", "Showed the renders to my contractor and he thought I hired a professional designer."),
            Testimonial("Elin Nordqvist", "SE", "EN", "The farmhouse style option completely transformed my 90s kitchen into something out of a magazine."),
            Testimonial("Grace O\u2019Connor", "IE", "GO", "I was about to spend $20K on a new kitchen. Housora showed me I just needed new cabinet doors."),
            Testimonial("Tom\u00e1s Silva", "PT", "TS", "The two-tone option was exactly what I needed. My kitchen looks brand new for a fraction of the cost."),
            Testimonial("Nadia Haddad", "LB", "NH", "As a real estate agent, I use this to stage kitchens virtually. Clients are blown away every time.")
        ),
        faqItems = listOf(
            "How does AI kitchen design work?" to "Upload a photo of your kitchen and our AI redesigns it with new cabinets, worktops, colours, and styles in under 30 seconds.",
            "What kitchen styles are available?" to "12+ styles including Modern Handleless, Scandinavian, Sage Shaker, Farmhouse, Industrial, Two-Tone, Timeless White, and more.",
            "Can I change just the colour of my kitchen?" to "Yes! You can change only the cabinet colour while keeping everything else the same.",
            "Is it better than visiting a showroom?" to "A showroom shows you samples. Housora shows you YOUR kitchen redesigned\u2014with correct lighting and perspective.",
            "Is Housora free to try?" to "Yes! You can try your first kitchen redesign for free. No credit card required.",
            "How accurate are the AI renders?" to "Our AI uses your actual kitchen photo as the base, so the layout, lighting, and proportions stay true to your space.",
            "Can kitchen companies use Housora?" to "Absolutely. Many kitchen designers use Housora to show clients concepts before committing to an order.",
            "Can I try farmhouse, shaker, or handleless styles?" to "Yes! All these styles and more are available. Upload your kitchen photo and pick any style to preview."
        ),
        exploreTools = listOf(
            Triple("AI Interior Design", "Redesign any room from a photo", "/interior-design"),
            Triple("AI Bathroom Design", "Redesign your bathroom", "/bathroom-design"),
            Triple("AI Floor Restyle", "Swap flooring in seconds", "/floor-restyle"),
            Triple("AI Wall Texture", "Try paint colors & finishes", "/wall-texture")
        ),
        keepReading = listOf(
            "Kitchen design ideas for 2026" to "#",
            "Visualize a renovation before you start" to "#",
            "AI room makeover: before & after" to "#"
        ),
        ctaHeading = "Ready to Redesign Your Kitchen?",
        ctaSubtext = "Explore a new visual direction for your own space.",
        showFurnitureFrom = false
    ))
}
