package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.workspaceUsagePage() {
    baseLayout("Usage | Housora", bodyClass = "page-workspace-usage", path = "/app/usage") {
        section("workspace-usage-page") {
            div("workspace-usage-page-header") {
                div {
                    span("workspace-eyebrow") { +"WORKSPACE" }
                    h1 { +"Usage" }
                    p { +"Track your image allowance and understand what remains in your current plan." }
                }
                div("workspace-usage-period") {
                    label { +"Period" }
                    div("workspace-usage-period-value") {
                        attributes["aria-label"] = "Usage period: current billing cycle"
                        +"Current billing cycle"
                    }
                }
            }
            div("workspace-usage-summary workspace-usage-loading") { attributes["id"] = "workspaceUsageSummary"; attributes["aria-busy"] = "true"
                div("workspace-usage-metric workspace-usage-metric-primary") { span { +"CURRENT ALLOWANCE" }; strong { span("workspace-value-skeleton") { attributes["id"] = "usage-used-value"; attributes["aria-label"] = "Loading used images" }; +" of "; span("workspace-value-skeleton") { attributes["id"] = "usage-allowance-value"; attributes["aria-label"] = "Loading image allowance" } }; p { +"generations used this billing period" } }
                div("workspace-usage-metric") { span { +"REMAINING" }; strong("workspace-value-skeleton") { attributes["id"] = "usage-remaining-value"; attributes["aria-label"] = "Loading remaining images" }; p { attributes["id"] = "usage-remaining-caption"; +"Loading your allowance…" } }
            }
            div("workspace-load-error") { id = "workspaceUsageError"; attributes["hidden"] = "hidden"; attributes["role"] = "alert"; span { +"Usage is temporarily unavailable." }; button { id = "workspaceUsageRetry"; type = ButtonType.button; +"Retry" } }
            div("workspace-usage-panel") {
                div("workspace-usage-panel-heading") {
                    div { h2 { +"Image usage" }; p { +"Your allowance for the current billing cycle." } }
                    span { attributes["id"] = "usage-percent-label"; +"— used" }
                }
                div("workspace-usage-large-track") { attributes["role"] = "progressbar"; attributes["aria-label"] = "Image allowance used"; attributes["aria-valuemin"] = "0"; attributes["aria-valuemax"] = "100"; attributes["aria-valuenow"] = "0"; span { attributes["id"] = "usage-large-progress" } }
                div("workspace-usage-legend") {
                    span { i("is-used") {}; +"Used" }
                    span { i("is-remaining") {}; +"Remaining" }
                }
                div("workspace-usage-breakdown") {
                    div { span { +"ACTIVITY" }; strong { +"AI design generations" } }
                    div { span { +"USAGE" }; strong { attributes["id"] = "usage-breakdown-used"; +"— images" } }
                    div { span { +"COST" }; strong { +"1 image per generation" } }
                }
            }
            div("workspace-usage-footer-grid") {
                div("workspace-usage-plan-card") {
                    span("workspace-eyebrow") { +"PLAN DETAILS" }
                    h2 { attributes["id"] = "usage-plan-name"; +"Free" }
                    div("workspace-usage-detail-list") {
                        div { span { +"Status" }; strong { attributes["id"] = "usage-plan-status"; +"Active" } }
                        div { span { +"Billing cycle" }; strong { attributes["id"] = "usage-billing-cycle"; +"Current cycle" } }
                        div { span { +"Renews or ends" }; strong { attributes["id"] = "usage-plan-end"; +"—" } }
                    }
                }
                div("workspace-usage-upgrade-card") {
                    span("workspace-eyebrow") { +"NEED MORE IMAGES?" }
                    h2 { +"Keep your design work moving." }
                    p { +"Compare Standard, Pro, and higher allowances without losing your current projects." }
                    a(href = "/app/plan", classes = "workspace-primary-action") { +"Compare plans" }
                }
            }
        }
    }
}
