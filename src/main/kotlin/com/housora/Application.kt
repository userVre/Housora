package com.housora

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import com.housora.plugins.configureRouting
import io.github.cdimascio.dotenv.dotenv
import java.util.Base64

object EnvConfig {
    private val dotenv = dotenv { ignoreIfMissing = true }
    fun get(key: String): String = dotenv[key] ?: ""
}

object ClerkConfig {
    private val rawKey = EnvConfig.get("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY")
    val publishableKey: String = rawKey.trim()
    val secretKey: String = EnvConfig.get("CLERK_SECRET_KEY").trim()
    val jwtIssuerDomain: String = EnvConfig.get("CLERK_JWT_ISSUER_DOMAIN").trim()
    val frontendApiDomain: String = runCatching {
        val encoded = when {
            rawKey.startsWith("pk_test_") -> rawKey.removePrefix("pk_test_")
            rawKey.startsWith("pk_live_") -> rawKey.removePrefix("pk_live_")
            else -> ""
        }
        String(Base64.getUrlDecoder().decode(encoded), Charsets.UTF_8).trimEnd('$')
    }.getOrDefault("")
    val isConfigured: Boolean = publishableKey.startsWith("pk_")

    init {
        println("[Clerk] Initializing Clerk configuration...")
        when {
            publishableKey.isEmpty() ->
                println("[Clerk] WARN: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Authentication will not work.")
            !publishableKey.startsWith("pk_") ->
                println("[Clerk] WARN: Publishable key has invalid format (expected pk_test_ or pk_live_). Got: ${publishableKey.take(15)}...")
            publishableKey.startsWith("pk_test_") ->
                println("[Clerk] OK: Publishable key loaded (test mode): ${publishableKey.take(20)}...")
            publishableKey.startsWith("pk_live_") ->
                println("[Clerk] OK: Publishable key loaded (live mode): ${publishableKey.take(20)}...")
        }
        if (secretKey.isEmpty()) {
            println("[Clerk] WARN: CLERK_SECRET_KEY is not set. Server-side session verification will not work.")
        } else {
            println("[Clerk] OK: Secret key loaded (${secretKey.take(8)}...)")
        }
        if (jwtIssuerDomain.isEmpty()) {
            println("[Clerk] WARN: CLERK_JWT_ISSUER_DOMAIN is not set.")
        } else {
            println("[Clerk] OK: JWT issuer domain: $jwtIssuerDomain")
        }
    }
}

object ConvexConfig {
    private val rawUrl = EnvConfig.get("EXPO_PUBLIC_CONVEX_URL")
    val siteUrl: String = EnvConfig.get("EXPO_PUBLIC_CONVEX_SITE_URL")
    val deployment: String = EnvConfig.get("CONVEX_DEPLOYMENT")
    val url: String = rawUrl.trim().trimEnd('/')
    val isConfigured: Boolean = url.startsWith("https://") && url.endsWith(".convex.cloud")

    init {
        println("[Convex] Initializing Convex configuration...")
        when {
            url.isEmpty() ->
                println("[Convex] WARN: EXPO_PUBLIC_CONVEX_URL is not set.")
            !isConfigured ->
                println("[Convex] WARN: Convex URL has unexpected format: $url")
            else ->
                println("[Convex] OK: Convex URL loaded: ${url.take(30)}...")
        }
    }
}

object ImageGenerationConfig {
    val apiUrl: String = EnvConfig.get("IMAGE_API_URL").trim()
    val apiKey: String = EnvConfig.get("IMAGE_API_KEY").trim()
    val isConfigured: Boolean = apiUrl.startsWith("https://") && apiKey.isNotEmpty()
}

/** Public browser configuration only. Never put a PostHog personal/private API key here. */
object PostHogConfig {
    private val configuredProjectKey: String = EnvConfig.get("VITE_POSTHOG_KEY").trim()
    // Only the public phc_ project key may be rendered into browser HTML. A
    // private PostHog API key must never be exposed, even if an env var is
    // accidentally misconfigured.
    val projectKey: String = configuredProjectKey.takeIf { it.startsWith("phc_") }.orEmpty()
    // Require an explicit region/host so a missing setting cannot silently send
    // EU visitor analytics to the US endpoint.
    val host: String = EnvConfig.get("VITE_POSTHOG_HOST")
        .ifBlank { EnvConfig.get("POSTHOG_HOST") }
        .trim()
        .removeSuffix("/")
    val isConfigured: Boolean = projectKey.isNotBlank() && host.startsWith("https://")
}

object WhopConfig {
    val apiKey: String = EnvConfig.get("WHOP_API_KEY").trim()
    val webhookSecret: String = EnvConfig.get("WHOP_WEBHOOK_SECRET").trim()
    val productId: String = EnvConfig.get("WHOP_PRODUCT_ID").trim()

    // Standard
    val standardMonthly: String = EnvConfig.get("WHOP_STANDARD_MONTHLY_PLAN_ID").trim()
    val standardYearly: String = EnvConfig.get("WHOP_STANDARD_YEARLY_PLAN_ID").trim()

    // Pro
    val proMonthly: String = EnvConfig.get("WHOP_PRO_MONTHLY_PLAN_ID").trim()
    val proYearly: String = EnvConfig.get("WHOP_PRO_YEARLY_PLAN_ID").trim()

    // Enterprise - Growth
    val enterpriseGrowthMonthly: String = EnvConfig.get("WHOP_ENTREPRISE_STARTER_MONTHLY_PLAN_ID").trim()
    val enterpriseGrowthYearly: String = EnvConfig.get("WHOP_ENTREPRISE_STARTER_YEARLY_PLAN_ID").trim()

    // Enterprise - Scale
    val enterpriseScaleMonthly: String = EnvConfig.get("WHOP_ENTREPRISE_PLUS_MONTHLY_PLAN_ID").trim()
    val enterpriseScaleYearly: String = EnvConfig.get("WHOP_ENTREPRISE_PLUS_YEARLY_PLAN_ID").trim()

    // Enterprise - Unlimited
    val enterpriseUnlimitedMonthly: String = EnvConfig.get("WHOP_ENTREPRISE_PRO_MONTHLY_PLAN_ID").trim()
    val enterpriseUnlimitedYearly: String = EnvConfig.get("WHOP_ENTREPRISE_MAX_YEARLY_PLAN_ID").trim()

    val isConfigured: Boolean = apiKey.startsWith("apik_")

    val validPlanIds: Set<String> = setOf(
        standardMonthly, standardYearly,
        proMonthly, proYearly,
        enterpriseGrowthMonthly, enterpriseGrowthYearly,
        enterpriseScaleMonthly, enterpriseScaleYearly,
        enterpriseUnlimitedMonthly, enterpriseUnlimitedYearly
    ).filter { it.isNotEmpty() }.toSet()

    init {
        println("[Whop] Initializing Whop configuration...")
        when {
            apiKey.isEmpty() ->
                println("[Whop] WARN: WHOP_API_KEY is not set. Subscriptions will use mock mode.")
            !apiKey.startsWith("apik_") ->
                println("[Whop] WARN: WHOP_API_KEY has invalid format.")
            else ->
                println("[Whop] OK: Whop API key loaded (${apiKey.take(12)}...)")
        }
        if (webhookSecret.isEmpty()) {
            println("[Whop] ERROR: WHOP_WEBHOOK_SECRET is not set. Webhook signature verification WILL FAIL.")
            println("[Whop] ERROR: Set WHOP_WEBHOOK_SECRET in .env to your Whop webhook signing secret.")
            println("[Whop] ERROR: You can find this in Whop Dashboard > Settings > Webhooks.")
            println("[Whop] ERROR: Webhooks will be rejected with 500 until this is configured.")
        } else {
            println("[Whop] OK: Webhook secret loaded (${webhookSecret.take(8)}...)")
        }
        if (validPlanIds.isEmpty()) {
            println("[Whop] WARN: No valid Whop plan IDs configured.")
        } else {
            println("[Whop] OK: ${validPlanIds.size} plan IDs loaded.")
        }
    }
}

object WebsiteConfig {
    private val rawUrl = EnvConfig.get("YOUR_WEBSITE_URL").trim()
    val url: String = rawUrl

    val isConfigured: Boolean get() {
        return url.isNotEmpty() && url != "YOUR_WEBSITE_URL" && url.startsWith("http")
    }

    init {
        println("[Website] Initializing website URL configuration...")
        if (!isConfigured) {
            println("[Website] ERROR: YOUR_WEBSITE_URL is not configured or still equals the placeholder 'YOUR_WEBSITE_URL'.")
            println("[Website] ERROR: Set YOUR_WEBSITE_URL in .env to a valid URL (e.g. https://housora.app).")
            println("[Website] ERROR: Checkout redirects, canonical URLs, and Open Graph URLs will fall back to http://localhost:8081.")
            println("[Website] ERROR: THIS MUST BE SET before deployment to production.")
        } else {
            println("[Website] OK: Website URL: $url")
        }
    }

    fun resolveUrl(path: String = ""): String {
        val base = if (isConfigured) url else "http://localhost:8081"
        return if (path.isEmpty()) base else "${base.trimEnd('/')}/${path.trimStart('/')}"
    }
}

fun main() {
    val port = EnvConfig.get("PORT").toIntOrNull() ?: 8081
    println("[Server] Starting Housora AI server on port $port...")
    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    println("[Server] Configuring routing...")
    configureRouting()
    println("[Server] Housora AI server is ready.")
}
