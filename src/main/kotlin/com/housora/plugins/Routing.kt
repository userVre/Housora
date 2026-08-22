package com.housora.plugins

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.http.content.*
import io.ktor.server.html.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.http.*
import io.ktor.client.*
import io.ktor.client.engine.java.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.client.call.*
import io.ktor.http.content.*
import kotlinx.html.*
import com.housora.pages.*
import com.housora.templates.baseLayout
import com.housora.WhopConfig
import com.housora.WebsiteConfig
import com.housora.ClerkConfig
import com.housora.EnvConfig
import com.housora.ImageGenerationConfig
import java.io.File
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

data class PublicRoute(
    val path: String,
    val behavior: String,
    val target: String? = null,
    val export: Boolean = behavior == "page" || behavior == "asset"
)

/**
 * Canonical public route contract for Ktor and the static exporter.
 *
 * `page` and `asset` routes are exported, `redirect` routes are emitted as
 * real HTTP redirects, and `unavailable` routes deliberately remain 404s.
 * Project restoration uses /design?project=<id>; legacy
 * /create#project-<id> bookmarks are normalized by WorkspacePage.
 */
val publicRouteManifest: List<PublicRoute> = buildList {
    listOf(
        "/", "/design", "/reference-style", "/pricing", "/app/home", "/app/usage", "/app/plan",
        "/interior-design", "/layout-boost", "/exterior-design", "/garden-design",
        "/floor-restyle", "/wall-texture", "/video-walkthrough", "/floorplan-to-3d",
        "/photo-to-render", "/ai-stairs-design", "/ai-doors-design",
        "/ai-windows-design", "/ai-kitchen-design", "/ai-bathroom-design",
        "/sign-in", "/sign-up", "/sign-out", "/delete-account", "/blog",
        "/examples", "/faq", "/contact", "/compare/housora-vs-reimaginehome",
        "/compare/housora-vs-homedesigns", "/compare/housora-vs-mnml",
        "/compare/housora-vs-homestyler", "/compare/housora-vs-planner5d",
        "/enterprise", "/privacy", "/terms", "/refund-policy", "/cookies", "/projects"
    ).forEach { add(PublicRoute(it, "page")) }
    blogPostSlugs.forEach { add(PublicRoute("/blog/$it", "page")) }
    add(PublicRoute("/llms.txt", "asset"))
    add(PublicRoute("/robots.txt", "asset"))
    add(PublicRoute("/sitemap.xml", "asset"))

    listOf(
        "/create" to "/design",
        "/subscription" to "/pricing",
        "/workspace" to "/design",
        "/app" to "/app/home",
        "/floorplan-3d" to "/floorplan-to-3d",
        "/stairs-design" to "/ai-stairs-design",
        "/doors-design" to "/ai-doors-design",
        "/windows-design" to "/ai-windows-design",
        "/kitchen-design" to "/ai-kitchen-design",
        "/bathroom-design" to "/ai-bathroom-design",
        "/interior-design-examples" to "/examples",
        "/inspirations" to "/examples",
        "/referral" to "/pricing",
        "/ai-interior-design-prompts" to "/interior-design",
        "/furniture-fit-calculator" to "/interior-design",
        "/api" to "/contact",
        "/cli" to "/contact",
        "/mcp" to "/contact",
        "/partnerships" to "/contact",
        "/embed-ai-interior-design" to "/contact",
        "/case-studies" to "/enterprise",
        "/affiliates" to "/contact",
        "/answers" to "/faq",
        "/affiliate" to "/contact",
        "/b2b" to "/enterprise",
        "/cookie-policy" to "/cookies",
        "/creations" to "/projects",
        "/fit-calculator" to "/interior-design",
        "/prompt-generator" to "/interior-design",
        "/refund" to "/refund-policy"
    ).forEach { (path, target) -> add(PublicRoute(path, "redirect", target, export = false)) }

    listOf(
        "/ai-information", "/style-quiz"
    ).forEach { add(PublicRoute(it, "unavailable", export = false)) }
}.also { routes ->
    require(routes.map { it.path }.distinct().size == routes.size) { "Duplicate path in public route manifest" }
}

private fun String.jsonEscape(): String = buildString {
    this@jsonEscape.forEach { character ->
        when (character) {
            '\\' -> append("\\\\")
            '"' -> append("\\\"")
            '\n' -> append("\\n")
            '\r' -> append("\\r")
            '\t' -> append("\\t")
            else -> append(character)
        }
    }
}

private fun publicRouteManifestJson(): String = buildString {
    append("{\"version\":1,\"projectRoute\":\"/design?project={id}\",\"routes\":[")
    publicRouteManifest.forEachIndexed { index, route ->
        if (index > 0) append(',')
        append("{\"path\":\"").append(route.path.jsonEscape())
        append("\",\"behavior\":\"").append(route.behavior).append('"')
        route.target?.let { append(",\"target\":\"").append(it.jsonEscape()).append('"') }
        append(",\"export\":").append(route.export).append('}')
    }
    append("]}")
}

private fun detectImageType(bytes: ByteArray): String? {
    if (bytes.size < 4) return null
    if (bytes[0] == 0xFF.toByte() && bytes[1] == 0xD8.toByte() && bytes[2] == 0xFF.toByte()) return "image/jpeg"
    if (bytes[0] == 0x89.toByte() && bytes[1] == 0x50.toByte() && bytes[2] == 0x4E.toByte() && bytes[3] == 0x47.toByte()) return "image/png"
    if (bytes.size >= 12 && bytes[0] == 0x52.toByte() && bytes[1] == 0x49.toByte() && bytes[2] == 0x46.toByte() && bytes[3] == 0x46.toByte() && bytes[8] == 0x57.toByte() && bytes[9] == 0x45.toByte() && bytes[10] == 0x42.toByte() && bytes[11] == 0x50.toByte()) return "image/webp"
    return null
}

/**
 * Verify a Clerk session token and return the authenticated user ID (clerkId).
 * Returns null if the token is invalid or the session is inactive.
 *
 * This extracts the JWT payload, reads the `sub` (user ID) and `sid` (session ID),
 * then verifies the session is active via the Clerk backend API.
 */
private suspend fun verifyClerkSession(token: String): String? {
    try {
        val parts = token.split(".")
        if (parts.size != 3) {
            println("[Clerk Auth] Invalid JWT format: expected 3 parts, got ${parts.size}")
            return null
        }

        // Decode JWT payload
        val payloadBytes = Base64.getUrlDecoder().decode(parts[1])
        val payloadStr = String(payloadBytes, Charsets.UTF_8)
        val payload = Json.parseToJsonElement(payloadStr).jsonObject

        val sub = payload["sub"]?.jsonPrimitive?.content
        val sid = payload["sid"]?.jsonPrimitive?.content

        if (sub == null || sid == null) {
            println("[Clerk Auth] JWT missing 'sub' or 'sid' claim")
            return null
        }

        // Verify session is active via Clerk backend API
        val secretKey = ClerkConfig.secretKey
        if (secretKey.isEmpty()) {
            println("[Clerk Auth] ERROR: CLERK_SECRET_KEY not set; refusing to trust an unverified session")
            return null
        }

        val client = io.ktor.client.HttpClient(io.ktor.client.engine.java.Java)
        try {
            val response = client.get("https://api.clerk.com/v1/sessions/$sid") {
                header("Authorization", "Bearer $secretKey")
                header("Content-Type", "application/json")
            }

            if (response.status != HttpStatusCode.OK) {
                println("[Clerk Auth] Session verification failed: HTTP ${response.status.value}")
                return null
            }

            val sessionBody = response.bodyAsText()
            val sessionJson = Json.parseToJsonElement(sessionBody).jsonObject
            val status = sessionJson["status"]?.jsonPrimitive?.content

            if (status != "active") {
                println("[Clerk Auth] Session $sid is not active (status=$status)")
                return null
            }

            println("[Clerk Auth] Session verified: user=${sub.take(8)}... session=$sid status=$status")
            return sub
        } finally {
            client.close()
        }
    } catch (e: Exception) {
        println("[Clerk Auth] Session verification error: ${e.message}")
        return null
    }
}

private data class RequestWindow(val startedAt: Long, val count: Int)

private val requestWindows = ConcurrentHashMap<String, RequestWindow>()

private fun requestKey(call: ApplicationCall): String =
    call.request.headers["X-Forwarded-For"]?.substringBefore(',')?.trim()
        ?.takeIf { it.isNotBlank() }
        ?: call.request.local.remoteHost

private fun rateLimited(call: ApplicationCall, bucket: String, limit: Int, windowMs: Long = 60_000L): Boolean {
    val now = System.currentTimeMillis()
    val key = "$bucket:${requestKey(call)}"
    val window = requestWindows.compute(key) { _, current ->
        when {
            current == null || now - current.startedAt >= windowMs -> RequestWindow(now, 1)
            else -> current.copy(count = current.count + 1)
        }
    } ?: RequestWindow(now, 1)
    if (requestWindows.size > 10_000) requestWindows.entries.removeIf { now - it.value.startedAt >= windowMs }
    return window.count > limit
}

private fun appendGenerationCors(call: ApplicationCall) {
    val origin = call.request.headers[HttpHeaders.Origin] ?: return
    val allowed = setOf(WebsiteConfig.resolveUrl(), "http://localhost:8081", "http://127.0.0.1:8081")
    if (origin in allowed) {
        call.response.headers.append(HttpHeaders.AccessControlAllowOrigin, origin)
        call.response.headers.append(HttpHeaders.AccessControlAllowCredentials, "true")
        call.response.headers.append(HttpHeaders.Vary, HttpHeaders.Origin)
    }
    call.response.headers.append(HttpHeaders.AccessControlAllowMethods, "POST, OPTIONS")
    call.response.headers.append(HttpHeaders.AccessControlAllowHeaders, "Content-Type, Authorization, X-Housora-Analytics-Consent")
}

fun Application.configureRouting() {
    val staticRoot = File(EnvConfig.get("STATIC_ROOT").ifBlank { "static" })
    val uploadRoot = File(EnvConfig.get("UPLOAD_ROOT").ifBlank { "uploads" })

    routing {
        if (staticRoot.exists()) {
            staticFiles("/static", staticRoot)
        } else {
            staticResources("/static", "static")
        }
        if (uploadRoot.exists()) {
            staticFiles("/uploads", uploadRoot)
        }
        listOf("favicon.ico", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "og-image.png", "site.webmanifest").forEach { assetName ->
            get("/$assetName") {
                val asset = File(staticRoot, "meta/$assetName")
                if (asset.exists()) call.respondFile(asset) else call.respond(HttpStatusCode.NotFound)
            }
        }
        get("/route-manifest.json") {
            call.respondText(publicRouteManifestJson(), contentType = ContentType.Application.Json)
        }
        publicRouteManifest.filter { it.behavior == "redirect" }.forEach { route ->
            get(route.path) {
                val query = call.request.queryString()
                val destination = route.target!! + if (query.isBlank()) "" else "?$query"
                call.respondRedirect(destination, permanent = true)
            }
        }
        get("/") { call.respondHtml { homePage() } }
        get("/design") { call.respondHtml { workspacePage(call.request.queryParameters["project"]) } }
        get("/reference-style") { call.respondHtml { referenceStylePage(call.request.queryParameters["reference"]) } }
        get("/pricing") { call.respondHtml { pricingPage() } }
        get("/app/home") { call.respondHtml { appHomePage() } }
        get("/app/images") { call.respondHtml { workspaceImagesPage() } }
        get("/app/likes") { call.respondHtml { workspaceLikesPage() } }
        get("/app/usage") { call.respondHtml { workspaceUsagePage() } }
        get("/app/plan") { call.respondHtml { workspacePlanPage() } }

        // AI Tool Pages
        get("/interior-design") { call.respondHtml { interiorDesignPage() } }
        get("/layout-boost") { call.respondHtml { layoutBoostPage() } }
        get("/exterior-design") { call.respondHtml { exteriorDesignPage() } }
        get("/garden-design") { call.respondHtml { gardenDesignPage() } }
        get("/floor-restyle") { call.respondHtml { floorRestylePage() } }
        get("/wall-texture") { call.respondHtml { wallTexturePage() } }
        get("/video-walkthrough") { call.respondHtml { videoWalkthroughPage() } }
        get("/floorplan-to-3d") { call.respondHtml { floorplanTo3DPage() } }
        get("/photo-to-render") { call.respondHtml { photoToRenderPage() } }
        get("/ai-stairs-design") { call.respondHtml { stairsDesignPage() } }
        get("/ai-doors-design") { call.respondHtml { doorsDesignPage() } }
        get("/ai-windows-design") { call.respondHtml { windowsDesignPage() } }
        get("/ai-kitchen-design") { call.respondHtml { kitchenDesignPage() } }
        get("/ai-bathroom-design") { call.respondHtml { bathroomDesignPage() } }

        // Auth
        get("/sign-in") { call.respondHtml { signInPage() } }
        get("/sign-up") { call.respondHtml { signUpPage() } }
        get("/sign-out") { call.respondHtml { signOutPage() } }
        get("/delete-account") { call.respondHtml { deleteAccountPage() } }

        // Whop Checkout — Clerk session verified server-side, never trust browser clerkId
        post("/whop/checkout") {
            val formParameters = call.receiveParameters()
            val planId = formParameters["planId"]?.trim() ?: ""
            val termsAccepted = formParameters["termsAccepted"] == "true"
            val immediatePerformanceRequested = formParameters["immediatePerformanceRequested"] == "true"
            val legalVersion = formParameters["legalVersion"]?.trim() ?: ""

            if (planId.isEmpty()) {
                println("[Checkout] WARN: Missing planId")
                call.respondText("""{"error":"Missing planId"}""", contentType = ContentType.Application.Json)
                return@post
            }
            if (!WhopConfig.validPlanIds.contains(planId)) {
                println("[Checkout] WARN: Invalid planId: ${planId.take(20)}")
                call.respondText("""{"error":"Invalid plan ID"}""", contentType = ContentType.Application.Json)
                return@post
            }
            if (!termsAccepted || !immediatePerformanceRequested || legalVersion != "2026-08-13") {
                call.respondText(
                    """{"error":"Please review and accept the current checkout terms before continuing."}""",
                    contentType = ContentType.Application.Json
                )
                return@post
            }

            // === CRITICAL: Reject if website URL is not configured ===
            if (!WebsiteConfig.isConfigured) {
                println("[Checkout] ERROR: YOUR_WEBSITE_URL is not configured. Cannot create checkout redirect.")
                call.respondText("""{"error":"Server configuration error. Please contact support."}""", contentType = ContentType.Application.Json)
                return@post
            }

            // Verify Clerk session from Authorization header — NEVER trust browser-sent clerkId
            val authHeader = call.request.headers["Authorization"]
            val sessionToken = authHeader?.removePrefix("Bearer ")?.trim()

            val verifiedClerkId: String
            if (!sessionToken.isNullOrEmpty()) {
                val userId = verifyClerkSession(sessionToken)
                if (userId == null) {
                    println("[Checkout] WARN: Clerk session verification failed")
                    call.respondText("""{"error":"Authentication required. Please sign in again."}""", contentType = ContentType.Application.Json)
                    return@post
                }
                verifiedClerkId = userId
                println("[Checkout] Clerk session verified for user: ${verifiedClerkId.take(8)}...")
            } else {
                // In dev mode without Clerk, allow mock checkout
                if (!WhopConfig.isConfigured) {
                    println("[Checkout] Dev mode: No auth token, allowing mock checkout")
                    val mockUrl = WebsiteConfig.resolveUrl("/pricing?mock_checkout=$planId")
                    call.respondText("""{"url":"$mockUrl","mock":true}""", contentType = ContentType.Application.Json)
                    return@post
                }
                println("[Checkout] WARN: No Authorization header provided")
                call.respondText("""{"error":"Authentication required. Please sign in."}""", contentType = ContentType.Application.Json)
                return@post
            }

            if (WhopConfig.isConfigured) {
                val redirectSuccess = WebsiteConfig.resolveUrl("/pricing?checkout=success")
                val redirectCancel = WebsiteConfig.resolveUrl("/pricing?checkout=canceled")
                // Pass clerkId via client_reference_id so the webhook handler receives it from the signed event
                val checkoutUrl = "https://whop.com/checkout/$planId?d2c=true&checkout[redirect_url]=$redirectSuccess&checkout[cancel_url]=$redirectCancel&checkout[client_reference_id]=$verifiedClerkId"
                println("[Checkout] Creating Whop checkout: user=${verifiedClerkId.take(8)}... plan=$planId")
                call.respondText("""{"url":"$checkoutUrl"}""", contentType = ContentType.Application.Json)
            } else {
                println("[Checkout] Mock checkout: user=${verifiedClerkId.take(8)}... plan=$planId")
                val mockUrl = WebsiteConfig.resolveUrl("/pricing?mock_checkout=$planId")
                call.respondText("""{"url":"$mockUrl","mock":true}""", contentType = ContentType.Application.Json)
            }
        }

        // Blog
        get("/blog") { call.respondHtml { blogPage() } }
        get("/blog/{slug}") {
            val slug = call.parameters["slug"].orEmpty()
            if (blogPostExists(slug)) {
                call.respondHtml { blogArticlePage(slug) }
            } else {
                call.respondHtml(HttpStatusCode.NotFound) { blogNotFoundPage() }
            }
        }
        get("/examples") { call.respondHtml { examplesPage() } }
        get("/faq") { call.respondHtml { faqPage() } }
        get("/contact") { call.respondHtml { contactPage() } }

        // Compare Pages
        get("/compare/housora-vs-reimaginehome") { call.respondHtml { housoraVsReimagineHome() } }
        get("/compare/housora-vs-homedesigns") { call.respondHtml { housoraVsHomeDesignsAI() } }
        get("/compare/housora-vs-mnml") { call.respondHtml { housoraVsMnml() } }
        get("/compare/housora-vs-homestyler") { call.respondHtml { housoraVsHomestyler() } }
        get("/compare/housora-vs-planner5d") { call.respondHtml { housoraVsPlanner5D() } }

        get("/enterprise") { call.respondHtml { enterprisePage() } }
        get("/privacy") { call.respondHtml { privacyPage() } }
        get("/terms") { call.respondHtml { termsPage() } }
        get("/refund-policy") { call.respondHtml { refundPage() } }
        get("/cookies") { call.respondHtml { cookiePolicyPage() } }
        get("/projects") { call.respondHtml { projectsPage() } }
        get("/llms.txt") {
            call.respondText("""
# Housora AI
> AI-assisted home design concepts from your own room, exterior, or garden photo.

## About
Housora is an AI-assisted visual design tool. Users can upload a photo, choose available design options, and explore concepts while keeping the original image as a reference.

## Features
- AI Interior Design: Redesign any room with AI
- Virtual Staging: Stage empty rooms with furniture
- Style Transfer: Apply design styles (Scandinavian, Modern, Industrial, etc.)
- Multiple Room Types: Living room, bedroom, kitchen, bathroom, office, and more

## AI Tools
1. AI Interior Design - /interior-design
2. AI Layout Boost - /layout-boost
3. AI Exterior Design - /exterior-design
4. AI Garden Design - /garden-design
5. AI Walls Texture - /wall-texture
6. AI Floor Restyle - /floor-restyle
7. AI Stairs Design - /ai-stairs-design
8. AI Doors Design - /ai-doors-design
9. AI Windows Design - /ai-windows-design
10. AI Kitchen Design - /ai-kitchen-design
11. AI Bathroom Design - /ai-bathroom-design
12. AI Video Walkthrough - /video-walkthrough
13. AI Floorplan to 3D - /floorplan-to-3d
14. AI Photo to Render - /photo-to-render

## Pricing
- Standard / Starter: €14 monthly or €149 annually; 100 included images.
- Pro: €29 monthly or €299 annually; 190 included images.
- Growth: €199 monthly; 1,200 included images.
- Scale: €349 monthly; 2,250 included images.
- Unlimited: €749 monthly; 5,250 included images.
Prices, taxes, renewal terms, annual billing details, and feature limits shown at /pricing and in Whop checkout control the purchase.

## Tech Stack
- Frontend: Kotlin/Ktor (kotlinx.html DSL)
- Auth: Clerk
- Backend Database: Convex
- Payments: Whop

## Contact
- Website: ${WebsiteConfig.resolveUrl()}
- Instagram: https://www.instagram.com/housora_ai/
- Facebook: https://www.facebook.com/profile.php?id=61590655134529
- YouTube: https://www.youtube.com/@Housora_AI
- LinkedIn: https://linkedin.com/company/housoraapp
""".trimIndent(), contentType = ContentType.Text.Plain)
        }
        get("/robots.txt") {
            call.respondText("User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /design\nDisallow: /projects\nDisallow: /sign-in\nDisallow: /sign-up\nDisallow: /sign-out\nDisallow: /delete-account\nSitemap: ${WebsiteConfig.resolveUrl("/sitemap.xml")}\n", contentType = ContentType.Text.Plain)
        }
        get("/sitemap.xml") {
            val sitemapPaths = publicRouteManifest.filter { it.behavior == "page" && it.export && it.path !in setOf("/app/home", "/app/usage", "/app/plan", "/design", "/projects", "/sign-in", "/sign-up", "/sign-out", "/delete-account", "/privacy", "/terms", "/refund-policy", "/cookies") }.map { it.path }
            val xml = buildString {
                append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">")
                sitemapPaths.forEach { sitemapPath -> append("<url><loc>").append(WebsiteConfig.resolveUrl(sitemapPath)).append("</loc></url>") }
                append("</urlset>")
            }
            call.respondText(xml, contentType = ContentType.Application.Xml)
        }

        // File upload endpoint — accepts raw image bytes in body
        post("/upload") {
            if (rateLimited(call, "upload", limit = 20)) {
                call.respondText("""{"error":"Too many uploads. Please wait a minute and try again."}""", status = HttpStatusCode.TooManyRequests, contentType = ContentType.Application.Json)
                return@post
            }
            try {
                val bytes = call.receive<ByteArray>()

                if (bytes.isEmpty()) {
                    call.respondText("""{"error":"No file provided"}""", status = HttpStatusCode.BadRequest, contentType = ContentType.Application.Json)
                    return@post
                }

                // Validate file size (10MB max)
                if (bytes.size > 10 * 1024 * 1024) {
                    call.respondText("""{"error":"File too large. Maximum size is 10MB."}""", status = HttpStatusCode.PayloadTooLarge, contentType = ContentType.Application.Json)
                    return@post
                }

                // Validate file type
                val imageType = detectImageType(bytes)
                if (imageType == null) {
                    call.respondText("""{"error":"Invalid file type. Only JPG, PNG, WebP allowed."}""", status = HttpStatusCode.UnsupportedMediaType, contentType = ContentType.Application.Json)
                    return@post
                }

                // Save file
                val ext = imageType.substringAfterLast('/')
                val fileName = "${java.util.UUID.randomUUID()}.$ext"
                val uploadDir = File("uploads")
                if (!uploadDir.exists()) uploadDir.mkdirs()
                val file = File(uploadDir, fileName)
                file.writeBytes(bytes)

                println("[Upload] Saved file: $fileName (${bytes.size} bytes)")
                call.respondText("""{"storageId":"$fileName","fileName":"$fileName"}""", contentType = ContentType.Application.Json)
            } catch (e: Exception) {
                println("[Upload] Error: ${e.message}")
                call.respondText("""{"error":"Upload failed"}""", status = HttpStatusCode.BadRequest, contentType = ContentType.Application.Json)
            }
        }

        // 404 catch-all — return HTML error page
        options("/api/generate") {
            appendGenerationCors(call)
            call.respond(HttpStatusCode.NoContent)
        }

        post("/api/generate") {
            appendGenerationCors(call)
            if (rateLimited(call, "generate", limit = 6)) {
                call.respondText("""{"error":"Generation limit reached. Please wait a minute and try again."}""", status = HttpStatusCode.TooManyRequests, contentType = ContentType.Application.Json)
                return@post
            }
            val token = call.request.headers[HttpHeaders.Authorization]?.removePrefix("Bearer")?.trim()
            val guestRequest = token.isNullOrBlank()
            if (guestRequest && call.request.cookies["housora_guest_generation_used"] == "1") {
                call.respondText("""{"error":{"code":"guest_trial_used","message":"Your free guest design is used. Create an account to get 3 more generations."}}""", status = HttpStatusCode.Forbidden, contentType = ContentType.Application.Json)
                return@post
            }
            if (ClerkConfig.isConfigured && !guestRequest) {
                if (verifyClerkSession(token!!) == null) {
                    call.respondText("""{"error":"Authentication required. Please sign in again."}""", status = HttpStatusCode.Unauthorized, contentType = ContentType.Application.Json)
                    return@post
                }
            }
            if (!ImageGenerationConfig.isConfigured) {
                call.respondText("""{"error":"Add IMAGE_API_URL and IMAGE_API_KEY"}""", status = HttpStatusCode.ServiceUnavailable, contentType = ContentType.Application.Json)
                return@post
            }
            val incoming = runCatching {
                Json.parseToJsonElement(call.receiveText()).jsonObject
            }.getOrNull()
            val prompt = incoming?.get("prompt")?.jsonPrimitive?.content?.trim().orEmpty()
            val image = incoming?.get("image")?.jsonPrimitive?.content?.trim().orEmpty()
            if (prompt.isBlank() || image.isBlank()) {
                call.respondText("""{"error":"Prompt and base64 image are required."}""", status = HttpStatusCode.BadRequest, contentType = ContentType.Application.Json)
                return@post
            }
            val imageBytes = runCatching {
                val encoded = image.substringAfter(",", image)
                Base64.getDecoder().decode(encoded)
            }.getOrNull()
            if (imageBytes == null) {
                call.respondText("""{"error":"Image must be valid base64."}""", status = HttpStatusCode.BadRequest, contentType = ContentType.Application.Json)
                return@post
            }
            val client = HttpClient(Java)
            try {
                val response = client.post(ImageGenerationConfig.apiUrl) {
                    contentType(ContentType.Application.Json)
                    header(HttpHeaders.Authorization, "Bearer ${ImageGenerationConfig.apiKey}")
                    val escapedPrompt = prompt.replace("\\", "\\\\").replace("\"", "\\\"")
                    val imageArray = imageBytes.joinToString(",")
                    setBody("""{"prompt":"$escapedPrompt","image":[$imageArray]}""")
                }
                if (response.status.value !in 200..299) {
                    call.respondText("""{"error":"Image generation failed. Please try again."}""", status = HttpStatusCode.BadGateway, contentType = ContentType.Application.Json)
                } else {
                    val contentType = response.headers[HttpHeaders.ContentType]?.let { ContentType.parse(it) } ?: ContentType.Image.PNG
                    if (guestRequest) {
                        call.response.headers.append(HttpHeaders.SetCookie, "housora_guest_generation_used=1; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax")
                    }
                    call.respondBytes(response.body<ByteArray>(), contentType = contentType)
                }
            } finally {
                client.close()
            }
        }

        get("{...}") {
            call.respondHtml(HttpStatusCode.NotFound) {
                head {
                    title { +"Page Not Found - Housora" }
                    link(rel = "stylesheet", href = "/static/css/style.css")
                }
                body {
                    section("placeholder-section") {
                        div("placeholder-inner") {
                            h1("placeholder-title") { +"404 — Page Not Found" }
                            p("placeholder-desc") { +"The page you're looking for doesn't exist or has been moved." }
                            div("placeholder-links") {
                                a(href = "/", classes = "btn-primary") { +"Go to Homepage" }
                                a(href = "/create", classes = "btn-secondary") { +"Try AI Design" }
                            }
                        }
                    }
                }
            }
        }
    }
}
