package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout
import com.housora.WhopConfig

private data class HousoraPlan(
    val name: String,
    val monthlyOriginal: String,
    val monthlyPromo: String,
    val annualOriginal: String,
    val annualPromo: String,
    val annualEquivalent: String,
    val monthlyId: String,
    val yearlyId: String,
    val planType: String,
    val features: List<Pair<String, Boolean>>,
    val popular: Boolean = false
)

fun HTML.pricingPage() {
    val plans = listOf(
        HousoraPlan("Standard", "\$20", "\$9.99", "\$16.67", "\$99.99", "\$8.33", WhopConfig.standardMonthly, WhopConfig.standardYearly, "standard", listOf(
            "100 generations per month" to true,
            "1 variation per generation" to true,
            "4K image exports" to true,
            "No watermark on images" to true,
            "Up to 10 saved projects" to true,
            "Email support" to true
        )),
        HousoraPlan("Pro", "\$49", "\$24.99", "\$40.83", "\$244.99", "\$20.42", WhopConfig.proMonthly, WhopConfig.proYearly, "pro", listOf(
            "190 generations per month" to true,
            "Up to 4 variations per generation" to true,
            "4K image exports" to true,
            "No watermark on images" to true,
            "Up to 30 saved projects" to true,
            "Priority support" to true
        ), popular = true)
    )

    baseLayout("Pricing & Plans | Housora", bodyClass = "page-pricing", path = "/pricing") {
        section("pricing-section") { div("pricing-inner") {
            h1("pricing-title") { +"Plans for every project" }
            p("pricing-subtitle") { +"From one room to full-home projects, choose the plan that fits your next direction." }
            div("pricing-billing-shell") {
                div("pricing-billing-copy") {
                    p("pricing-billing-label") { +"CHOOSE YOUR BILLING" }
                    p("save-text") { id = "billing-caption"; +"Pay monthly and cancel future renewals anytime." }
                }
                div("billing-toggle") {
                    attributes["role"] = "group"; attributes["aria-label"] = "Billing frequency"
                    button(classes = "toggle-option active") { id = "monthlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "true"; +"Monthly" }
                    button(classes = "toggle-option") { id = "yearlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "false"; +"Yearly"; span("billing-value-note") { +"2 months free" } }
                }
            }
            div("checkout-legal-notice") {
                id = "checkout-legal-notice"
                attributes["hidden"] = "hidden"
                attributes["tabindex"] = "-1"
                attributes["role"] = "dialog"
                attributes["aria-modal"] = "true"
                attributes["aria-labelledby"] = "checkout-legal-title"
                div("checkout-legal-dialog") {
                    button(classes = "checkout-legal-close") {
                        id = "checkout-legal-close"
                        type = ButtonType.button
                        attributes["aria-label"] = "Close checkout confirmation"
                        +"×"
                    }
                    h2 { id = "checkout-legal-title"; +"Confirm before checkout" }
                    p { +"You’ll review the final amount and payment method securely with Whop." }
                    div("checkout-legal-choice") {
                        checkBoxInput {
                            id = "checkout-terms-accepted"
                            attributes["required"] = "required"
                        }
                        label {
                            htmlFor = "checkout-terms-accepted"
                            +"I agree to the "
                            a(href = "/terms", target = "_blank") { attributes["rel"] = "noopener"; +"Terms & Conditions" }
                            +" and "
                            a(href = "/refund-policy", target = "_blank") { attributes["rel"] = "noopener"; +"Refund & Withdrawal Policy" }
                            +"."
                        }
                    }
                    div("checkout-legal-choice") {
                        checkBoxInput {
                            id = "checkout-immediate-performance"
                            attributes["required"] = "required"
                        }
                        label {
                            htmlFor = "checkout-immediate-performance"
                            +"I request immediate access to Housora. Where the law permits, I understand this can affect my withdrawal rights for digital services already supplied."
                        }
                    }
                    p("checkout-legal-error") {
                        id = "checkout-legal-error"
                        attributes["role"] = "alert"
                        attributes["aria-live"] = "polite"
                        attributes["hidden"] = "hidden"
                    }
                    button(classes = "btn-primary checkout-legal-continue") {
                        id = "checkout-legal-continue"
                        type = ButtonType.button
                        +"CONTINUE TO SECURE CHECKOUT"
                    }
                }
            }
            div("pricing-grid pricing-grid-three") {
                plans.forEach { plan ->
                    div(classes = "pricing-card pricing-card--${plan.planType}${if (plan.popular) " card-popular" else ""}") {
                        if (plan.popular) div("popular-badge") { +"MOST POPULAR" }
                        div("plan-name-row") {
                            h2("plan-name") { +plan.name }
                            if (plan.popular) span("plan-value-badge") { +"BEST VALUE" }
                        }
                        p("plan-description") { +(if (plan.name == "Standard") "For one room at a time" else "For whole homes and client work") }
                        div("plan-offer") {
                            span("plan-offer-label") { +"50% OFF" }
                            span { +"Launch promotion" }
                        }
                        div("plan-price plan-price--offer") {
                            span("price-original price-original-monthly") { +plan.monthlyOriginal }
                            span("price-original price-original-annual") { +plan.annualOriginal }
                            span("price-monthly") { +plan.monthlyPromo }
                            span("price-annual") { +plan.annualEquivalent }
                            span("price-period") {
                                attributes["data-billing-period"] = "month-equivalent"
                                attributes["data-i18n"] = "pricing.per_month"
                                +" / month"
                            }
                        }
                        p("annual-equivalent") {
                            span("monthly-billing-note") { +"Billed monthly · cancel anytime" }
                            span("yearly-billing-note") { +"Billed yearly · ${plan.annualPromo} per year" }
                        }
                        a(href = "/pricing?plan=${plan.planType}", classes = "btn-primary btn-full whop-checkout") {
                            attributes["aria-controls"] = "checkout-legal-notice"
                            attributes["data-plan-monthly"] = plan.monthlyId
                            attributes["data-plan-yearly"] = plan.yearlyId
                            attributes["data-plan-type"] = plan.planType
                            +"GET ${plan.name.uppercase()}"
                        }
                        ul("plan-features") {
                            plan.features.forEach { (feature, included) ->
                                li(classes = if (included) "feature-included" else "feature-unavailable") {
                                    span(classes = if (included) "check" else "cross") { if (included) +"✓" else +"✕" }
                                    +" $feature"
                                }
                            }
                        }
                        p("cancel-text") { +"Billed securely by Whop · cancel future renewals anytime" }
                    }
                }
                div("pricing-card pricing-card-enterprise pricing-card--enterprise") {
                    div("enterprise-label") { +"FOR TEAMS" }
                    h2("plan-name") { +"Enterprise" }
                    p("plan-description") { +"For teams, agencies and developers" }
                    div("plan-offer plan-offer--enterprise") {
                        span("plan-offer-label") { +"TEAM PLAN" }
                        span { +"Built for client work" }
                    }
                    div("plan-price plan-price--offer") {
                        span("price-monthly") { +"\$99.99" }
                        span("price-annual") { +"\$83.33" }
                        span("price-period") {
                            attributes["data-billing-period"] = "month-equivalent"
                            +" / month"
                        }
                    }
                    p("annual-equivalent") {
                        span("monthly-billing-note") { +"Billed monthly · team workspace access" }
                        span("yearly-billing-note") { +"Billed yearly · \$999.99 per year" }
                    }
                    a(href = "/pricing?plan=enterprise", classes = "btn-primary btn-full whop-checkout") {
                        attributes["aria-controls"] = "checkout-legal-notice"
                        attributes["data-plan-monthly"] = WhopConfig.enterpriseGrowthMonthly
                        attributes["data-plan-yearly"] = WhopConfig.enterpriseGrowthYearly
                        attributes["data-plan-type"] = "enterprise"
                        +"GET ENTERPRISE"
                    }
                    ul("plan-features") {
                        li { span("check") { +"✓" }; +" 1,500 generations per month" }
                        li { span("check") { +"✓" }; +" Up to 4 variations per generation" }
                        li { span("check") { +"✓" }; +" 4K image exports" }
                        li { span("check") { +"✓" }; +" No watermark on images" }
                        li { span("check") { +"✓" }; +" Shared workspace access" }
                        li { span("check") { +"✓" }; +" Unlimited saved projects" }
                        li { span("check") { +"✓" }; +" Priority support" }
                    }
                    p("cancel-text") { +"Billed securely by Whop · cancel future renewals anytime" }
                }
            }
            p("guarantee-text") { +"7-day support-backed refund review · "; a(href = "/refund-policy") { +"Refund policy" } }
            section("pricing-output-section") {
                h2 { +"What your plan actually produces" }
                p("pricing-output-subtitle") { +"Explore real Housora directions before choosing your plan." }
                div("pricing-output-grid") {
                    val outputs = listOf(
                        Triple("Living Room", "/static/images/room-after.jpg", "Warm Scandinavian living room"),
                        Triple("Bedroom", "/static/images/room-bedroom.jpg", "Calm modern bedroom"),
                        Triple("Kitchen", "/static/images/kitchen-after.jpg", "Contemporary wood kitchen"),
                        Triple("Bathroom", "/static/images/bathroom-after.jpg", "Modern spa bathroom"),
                        Triple("Home Office", "/static/images/room-home-office-v2.png", "Focused home office"),
                        Triple("Exterior", "/static/images/exterior-after.jpg", "Modern home exterior"),
                        Triple("Garden", "/static/images/garden-after.jpg", "Layered garden direction"),
                        Triple("Dining Room", "/static/images/room-dining.jpg", "Soft contemporary dining room"),
                        Triple("Reading Room", "/static/images/gallery-arched.jpg", "Warm minimal reading room"),
                        Triple("Walk-in Closet", "/static/images/gallery-dark-walnut.jpg", "Classic walnut walk-in"),
                        Triple("Stairs", "/static/images/stairs-after.jpg", "Beige hall and staircase"),
                        Triple("Balcony", "/static/images/interior-balcony.jpg", "Rattan lounge balcony")
                    )
                    outputs.forEach { (room, image, title) ->
                        a(href = "/examples", classes = "pricing-output-card") {
                            img(src = image, alt = title) {
                                attributes["loading"] = "eager"
                                attributes["width"] = "640"
                                attributes["height"] = "480"
                            }
                            div("pricing-output-card-caption") {
                                strong { +title }
                                span { +room }
                            }
                        }
                    }
                }
            }

            section("pricing-faq-section") {
                h2 { +"Frequently asked questions" }
                val questions = listOf(
                    "How do credits work?" to "Credits are used for generations and refresh at the start of each billing cycle.",
                    "How many images can I generate?" to "Standard includes 100 images and Pro includes 190 images per cycle.",
                    "Is my subscription renewed automatically?" to "Yes. You can cancel future renewals from your billing controls at any time.",
                    "Can I change my plan after I subscribe?" to "Yes. Upgrade or downgrade from your account billing settings.",
                    "Can I get a refund?" to "See the refund policy or contact support with your payment receipt.",
                    "Do you offer plans for teams and agencies?" to "Yes. Enterprise plans support shared workflows and higher allowances."
                )
                div("pricing-faq-list") {
                    questions.forEachIndexed { index, (question, answer) ->
                        details(classes = "pricing-faq-item") {
                            if (index == 0) attributes["open"] = "open"
                            summary { +question }
                            p { +answer }
                        }
                    }
                }
            }
        } }
    }
}
