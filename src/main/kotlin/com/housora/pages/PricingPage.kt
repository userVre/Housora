package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
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
            h1("pricing-title") { +"Choose your Housora plan" }
            p("pricing-subtitle") { +"Start monthly, or switch to yearly billing when you are ready to save." }
            div("billing-toggle") {
                attributes["role"] = "group"; attributes["aria-label"] = "Billing frequency"
                button(classes = "toggle-option") { id = "yearlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "false"; +"Yearly Billing" }
                button(classes = "toggle-option active") { id = "monthlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "true"; +"Monthly Billing" }
            }
            p("save-text") { id = "billing-caption"; +"Pay monthly and cancel future renewals anytime." }
            div("checkout-legal-notice") {
                h2 { +"Before checkout" }
                p { +"Review the plan price, billing period, included images, renewal, cancellation, and refund information before continuing." }
                label("checkout-legal-choice") {
                    checkBoxInput {
                        id = "checkout-terms-accepted"
                        attributes["required"] = "required"
                    }
                    span {
                        +"I have read and agree to the "
                        a(href = "/terms", target = "_blank") { attributes["rel"] = "noopener"; +"Terms & Conditions" }
                        +" and "
                        a(href = "/refund-policy", target = "_blank") { attributes["rel"] = "noopener"; +"Refund & Withdrawal Policy" }
                        +"."
                    }
                }
                label("checkout-legal-choice") {
                    checkBoxInput {
                        id = "checkout-immediate-performance"
                        attributes["required"] = "required"
                    }
                    span { +"I expressly request immediate access to Housora during the 14-day withdrawal period. I understand that, where the law permits, I may have to pay a proportionate amount for service already supplied before I withdraw. This request does not remove rights that cannot legally be waived." }
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
                    h2("plan-name") { +"Enterprise" }
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
        } }
    }
}
