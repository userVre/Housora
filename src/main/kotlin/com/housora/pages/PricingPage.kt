package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout
import com.housora.WhopConfig

private data class HousoraPlan(
    val name: String,
    val monthly: String,
    val annualTotal: String,
    val annualEquivalent: String,
    val monthlyId: String,
    val yearlyId: String,
    val planType: String,
    val features: List<Pair<String, Boolean>>,
    val popular: Boolean = false
)

fun HTML.pricingPage() {
    val plans = listOf(
        HousoraPlan("Standard", "€14", "€149", "€12.42", WhopConfig.standardMonthly, WhopConfig.standardYearly, "standard", listOf(
            "100 included images" to true,
            "Access to Housora design tools" to true,
            "Save and manage projects" to true,
            "Standard export quality" to true,
            "Email support" to true
        )),
        HousoraPlan("Pro", "€29", "€299", "€24.92", WhopConfig.proMonthly, WhopConfig.proYearly, "pro", listOf(
            "190 included images" to true,
            "Access to Housora design tools" to true,
            "Save and manage projects" to true,
            "Priority support" to true
        ), popular = true)
    )

    baseLayout("Pricing & Plans | Housora", bodyClass = "page-pricing", path = "/pricing") {
        section("pricing-section") { div("pricing-inner") {
            h1("pricing-title") { +"Plans for every project" }
            p("pricing-subtitle") { +"From one room to full-home projects, choose the plan that fits your next direction." }
            div("billing-toggle") {
                attributes["role"] = "group"; attributes["aria-label"] = "Billing frequency"
                button(classes = "toggle-option active") { id = "monthlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "true"; +"Monthly Billing" }
                button(classes = "toggle-option") { id = "yearlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "false"; +"Yearly" }
            }
            p("save-text") { id = "billing-caption"; +"Pay monthly and cancel future renewals anytime." }
            div("checkout-legal-notice") {
                h2 { +"Before checkout" }
                p { +"Review the plan price, billing period, included images, renewal, cancellation, and refund information before continuing." }
                div("checkout-legal-choice") {
                    checkBoxInput {
                        id = "checkout-terms-accepted"
                        attributes["required"] = "required"
                    }
                    label {
                        htmlFor = "checkout-terms-accepted"
                        +"I have read and agree to the "
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
                        +"I expressly request immediate access to Housora during the 14-day withdrawal period. I understand that, where the law permits, I may have to pay a proportionate amount for service already supplied before I withdraw. This request does not remove rights that cannot legally be waived."
                    }
                }
                p("checkout-legal-error") {
                    id = "checkout-legal-error"
                    attributes["role"] = "alert"
                    attributes["aria-live"] = "polite"
                    attributes["hidden"] = "hidden"
                }
            }
            div("pricing-grid pricing-grid-three") {
                plans.forEach { plan ->
                    div(classes = if (plan.popular) "pricing-card card-popular" else "pricing-card") {
                        if (plan.popular) div("popular-badge") { +"MOST POPULAR" }
                        h2("plan-name") { +plan.name }
                        p("plan-description") { +(if (plan.name == "Standard") "For one room at a time" else "For whole homes and client work") }
                        div("plan-price") {
                            span("price-monthly") { +plan.monthly }
                            span("price-annual") { +plan.annualEquivalent }
                            span("price-period") {
                                attributes["data-billing-period"] = "month"
                                attributes["data-i18n"] = "pricing.per_month"
                                +" / month"
                            }
                        }
                        p("annual-equivalent") {
                            span("annual-total-label") { +"Annual total: " }
                            span("annual-total") { +plan.annualTotal }
                        }
                        a(href = "/pricing?plan=${plan.planType}", classes = "btn-primary btn-full whop-checkout") {
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
                div("pricing-card pricing-card-enterprise") {
                    div("enterprise-label") { +"CUSTOM DEAL" }
                    h2("plan-name") { +"Enterprise" }
                    p("plan-description") { +"For teams, agencies and developers" }
                    div("plan-price") { span("price-current") { +"Custom" }; span("enterprise-price-suffix") { +" plans" } }
                    p("annual-equivalent") { +"Growth, Scale, and Unlimited tiers with higher allowances." }
                    a(href = "/enterprise", classes = "btn-primary btn-full") { +"SEE ENTERPRISE PLANS" }
                    ul("plan-features") {
                        li { span("check") { +"✓" }; +" Access to Housora design tools" }
                        li { span("check") { +"✓" }; +" Support by email" }
                        li { span("check") { +"✓" }; +" Higher included image allowances" }
                    }
                    p("cancel-text") { +"Talk to us about the right workspace size." }
                }
            }
            p("guarantee-text") { +"7-day support-backed refund review · "; a(href = "/refund-policy") { +"Refund policy" } }
            div("plan-status-card") { id = "planStatus"; h3 { +"Your current plan" }; p { +"Sign in to see your Housora plan, remaining credits, and billing status." } }
            div("billing-help") { id = "billing-help"; h2 { +"Manage your plan or request a refund" }; p { +"Subscriptions are processed by Whop. Use Whop's billing controls to cancel future renewals. For a refund request or billing problem, email "; a(href = "mailto:support@housora.app?subject=Housora%20billing%20or%20refund%20request") { +"support@housora.app" }; +" with your Whop receipt." } }

            section("pricing-output-section") {
                h2 { +"What your plan actually produces" }
                p("pricing-output-subtitle") { +"Explore real Housora directions before choosing your plan." }
                div("pricing-output-grid") {
                    val outputs = listOf(
                        Triple("Living Room", "/static/images/room-after.jpg", "Warm Scandinavian living room"),
                        Triple("Bedroom", "/static/images/room-bedroom.jpg", "Calm modern bedroom"),
                        Triple("Kitchen", "/static/images/kitchen-after.jpg", "Contemporary wood kitchen"),
                        Triple("Bathroom", "/static/images/bathroom-after.jpg", "Modern spa bathroom"),
                        Triple("Home Office", "/static/images/gallery-modern.jpg", "Focused home office"),
                        Triple("Exterior", "/static/images/exterior-after.jpg", "Modern home exterior"),
                        Triple("Garden", "/static/images/garden-after.jpg", "Layered garden direction"),
                        Triple("Dining Room", "/static/images/room-dining.jpg", "Soft contemporary dining room"),
                        Triple("Home Office", "/static/images/gallery-modern.jpg", "Warm minimal home office"),
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
