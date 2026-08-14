package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.comparePage(competitorName: String, description: String, features: List<Triple<String, Boolean, Boolean>>, whySection: String) {
    val slug = when (competitorName) {
        "ReimagineHome" -> "reimaginehome"
        "HomeDesigns AI" -> "homedesigns"
        "mnml.ai" -> "mnml"
        "Homestyler" -> "homestyler"
        else -> "planner5d"
    }
    baseLayout("Housora vs $competitorName | Housora AI", path = "/compare/housora-vs-$slug") {
        section(classes = "compare-page-section") {
            div(classes = "compare-page-inner") {
                p(classes = "compare-breadcrumb") { +"COMPARISON \u00B7 2026" }
                div(classes = "compare-page-layout") {
                    div(classes = "compare-page-left") {
                        h1(classes = "compare-page-title") { +"Housora AI vs $competitorName" }
                        p(classes = "compare-page-desc") { +description }
                        a(href = "/create#designStudio", classes = "btn-primary btn-large") { +"Start now "; i("lucide arrow-right") {} }
                        p(classes = "compare-page-meta") { +"Product capabilities can change. Confirm current availability on each provider's website before purchasing." }
                    }
                    div(classes = "compare-page-right") {
                        div(classes = "comparison-table-wrapper") {
                        table(classes = "comparison-table") {
                            thead {
                                tr {
                                    th { +"AI TOOL" }
                                    th(classes = "highlight") { +"HOUSORA AI" }
                                    th { +competitorName.uppercase() }
                                }
                            }
                            tbody {
                                features.forEach { (feature, housora, competitor) ->
                                    tr {
                                        td { +feature }
                                        td(classes = "highlight") {
                                            span(if (housora) "check-mark" else "cross-mark") {
                                                +(if (housora) "\u2713" else "\u2717")
                                            }
                                        }
                                        td {
                                            span(if (competitor) "check-mark" else "cross-mark") {
                                                +(if (competitor) "\u2713" else "\u2717")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        }
                    }
                }
                div(classes = "compare-why-section") {
                    h2(classes = "compare-why-title") { +whySection }
                }
                div(classes = "compare-cta") {
                    h2 { +"See which workflow fits your project" }
                    p { +"Try Housora with your own room photo, then compare the result and workflow for yourself." }
                    div(classes = "cta-buttons") {
                        a(href = "/design", classes = "btn-primary btn-large") { +"Try Housora Free" }
                        a(href = "/pricing", classes = "btn-secondary") { +"View Pricing" }
                    }
                }
            }
        }
    }
}

fun HTML.housoraVsReimagineHome() = comparePage(
    "ReimagineHome",
    "Both products help people explore room-design ideas from images. This overview focuses on the workflow and the design tools each product currently presents.",
    listOf(
        Triple("AI Interior Design", true, true),
        Triple("AI Layout Boost", true, false),
        Triple("AI Exterior Design", true, true),
        Triple("AI Garden Design", true, true),
        Triple("AI Walls Texture", true, false),
        Triple("AI Floor Restyle", true, false),
        Triple("AI Video Walkthrough", true, false)
    ),
    "How do the Housora and ReimagineHome workflows differ?"
)

fun HTML.housoraVsHomeDesignsAI() = comparePage(
    "HomeDesigns AI",
    "Both products offer AI-assisted home-design workflows. Compare the tools that matter to your project and verify current plan details before choosing.",
    listOf(
        Triple("AI Interior Design", true, true),
        Triple("AI Layout Boost", true, false),
        Triple("AI Exterior Design", true, true),
        Triple("AI Garden Design", true, true),
        Triple("AI Walls Texture", true, false),
        Triple("AI Floor Restyle", true, false),
        Triple("AI Video Walkthrough", true, false)
    ),
    "How do the workflows differ?"
)

fun HTML.housoraVsMnml() = comparePage(
    "mnml.ai",
    "Both products approach AI home design differently. This overview helps you compare their visible workflows and supported design categories.",
    listOf(
        Triple("AI Interior Design", true, true),
        Triple("AI Layout Boost", true, false),
        Triple("AI Exterior Design", true, false),
        Triple("AI Garden Design", true, false),
        Triple("AI Walls Texture", true, false),
        Triple("AI Floor Restyle", true, false),
        Triple("AI Video Walkthrough", true, false)
    ),
    "How do the workflows differ?"
)

fun HTML.housoraVsHomestyler() = comparePage(
    "Homestyler",
    "Housora focuses on photo-based design concepts, while Homestyler offers a broader design workspace. Compare the workflow that best fits your project.",
    listOf(
        Triple("AI Interior Design", true, false),
        Triple("AI Layout Boost", true, false),
        Triple("AI Exterior Design", true, false),
        Triple("AI Garden Design", true, false),
        Triple("AI Walls Texture", true, false),
        Triple("AI Floor Restyle", true, false),
        Triple("AI Video Walkthrough", true, false)
    ),
    "How do the workflows differ?"
)

fun HTML.housoraVsPlanner5D() = comparePage(
    "Planner 5D",
    "Planner 5D and Housora take different approaches to home design. This overview compares Housora's photo-based workflow with a more traditional planning experience.",
    listOf(
        Triple("AI Interior Design", true, false),
        Triple("AI Layout Boost", true, false),
        Triple("AI Exterior Design", true, false),
        Triple("AI Garden Design", true, false),
        Triple("AI Walls Texture", true, false),
        Triple("AI Floor Restyle", true, false),
        Triple("AI Video Walkthrough", true, false)
    ),
    "How do the workflows differ?"
)
