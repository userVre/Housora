package com.housora.pages

import kotlinx.html.*
import com.housora.WhopConfig
import com.housora.templates.baseLayout

private data class WorkspacePlanOption(
    val key: String,
    val name: String,
    val monthly: String,
    val annualEquivalent: String,
    val annualTotal: String,
    val images: String,
    val description: String,
    val monthlyId: String = "",
    val yearlyId: String = ""
)

fun HTML.workspacePlanPage() {
    val plans = listOf(
        WorkspacePlanOption("free", "Free", "€0", "€0", "€0", "5 images", "Try the complete Housora workflow."),
        WorkspacePlanOption("standard", "Standard", "€14", "€12.42", "€149", "100 images", "For regular room and home projects.", WhopConfig.standardMonthly, WhopConfig.standardYearly),
        WorkspacePlanOption("pro", "Pro", "€29", "€24.92", "€299", "190 images", "For creators with more spaces to design.", WhopConfig.proMonthly, WhopConfig.proYearly)
    )
    baseLayout("Plan & Usage | Housora", bodyClass = "page-workspace-plan", path = "/app/plan") {
        section("workspace-plan-page") {
            div("workspace-plan-header") { span("workspace-eyebrow") { +"PLAN & USAGE" }; h1 { +"Choose the plan that fits your ideas" }; p { +"See your remaining images, compare allowances, and upgrade from your workspace." } }
            div("workspace-current-plan") {
                div { span { +"CURRENT PLAN" }; h2 { attributes["id"] = "workspace-plan-page-name"; +"Free" }; p { attributes["id"] = "workspace-plan-page-usage"; +"Loading your usage…" } }
                div("workspace-plan-page-track") { span { attributes["id"] = "workspace-plan-page-progress" } }
            }
            div("workspace-billing-panel") {
                div("workspace-billing-heading") {
                    div { h2 { +"Billing frequency" }; p { attributes["id"] = "billing-caption"; +"Pay monthly and cancel future renewals anytime." } }
                    div("billing-toggle") {
                        attributes["role"] = "group"; attributes["aria-label"] = "Billing frequency"
                        button(classes = "toggle-option") { id = "yearlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "false"; +"Yearly" }
                        button(classes = "toggle-option active") { id = "monthlyBtn"; type = ButtonType.button; attributes["aria-pressed"] = "true"; +"Monthly" }
                    }
                }
                div("workspace-checkout-consent") {
                    h3 { +"Before checkout" }
                    label("checkout-legal-choice") {
                        checkBoxInput { id = "checkout-terms-accepted"; attributes["required"] = "required" }
                        span { +"I agree to the "; a(href = "/terms", target = "_blank") { attributes["rel"] = "noopener"; +"Terms" }; +" and "; a(href = "/refund-policy", target = "_blank") { attributes["rel"] = "noopener"; +"Refund & Withdrawal Policy" }; +"." }
                    }
                    label("checkout-legal-choice") {
                        checkBoxInput { id = "checkout-immediate-performance"; attributes["required"] = "required" }
                        span { +"I request immediate access during the withdrawal period and understand that proportionate charges may apply where permitted by law." }
                    }
                    p("checkout-legal-error") { id = "checkout-legal-error"; attributes["role"] = "alert"; attributes["aria-live"] = "polite"; attributes["hidden"] = "hidden" }
                }
            }
            div("workspace-plan-grid") {
                plans.forEachIndexed { index, plan ->
                    div(classes = "workspace-plan-card${if (index == 2) " is-featured" else ""}") {
                        attributes["data-plan-key"] = plan.key
                        if (index == 2) span("workspace-plan-badge") { +"MOST POPULAR" }
                        h2 { +plan.name }
                        div("workspace-plan-price") {
                            span("price-monthly") { +plan.monthly }
                            span("price-annual") { attributes["hidden"] = "hidden"; +plan.annualEquivalent }
                            span("price-period") { attributes["data-billing-period"] = "month"; +" / month" }
                        }
                        p("workspace-plan-annual") {
                            span("annual-total-label") { attributes["hidden"] = "hidden"; +"Annual total: " }
                            span("annual-total") { attributes["hidden"] = "hidden"; +plan.annualTotal }
                        }
                        strong { +plan.images }; p { +plan.description }
                        ul { li { +"All Housora AI design tools" }; li { +"Save and manage projects" }; li { +if (index > 0) "Standard export quality" else "Start with no payment" } }
                        span("workspace-plan-current-label") {
                            if (index != 0) attributes["hidden"] = "hidden"
                            +"Current plan"
                        }
                        if (index > 0) a(href = "/app/plan", classes = "workspace-plan-action whop-checkout") {
                            attributes["data-plan-monthly"] = plan.monthlyId
                            attributes["data-plan-yearly"] = plan.yearlyId
                            attributes["data-plan-type"] = plan.key
                            +"Choose ${plan.name}"
                        }
                    }
                }
            }
            p("workspace-plan-footnote") { +"Need higher allowances? "; a(href = "/enterprise") { +"Explore Enterprise plans" }; +". Billing and refund details are shown before checkout." }
        }
    }
}
