package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout
import com.housora.WhopConfig

fun HTML.enterprisePage() {
    baseLayout("Growth, Scale & Unlimited Plans | Housora AI") {
        section(classes = "enterprise-hero") {
            div(classes = "enterprise-hero-inner") {
                h1(classes = "enterprise-hero-subtitle") { +"More room to create for larger projects" }
                p { +"Choose a higher image allowance when your projects need more exploration." }
                a(href = "/pricing", classes = "enterprise-back-link") { +"< Back to all plans" }
            }
        }
        section(classes = "pricing-section") {
            div(classes = "pricing-inner") {
                div(classes = "pricing-grid") {
                    val plans = listOf(
                        Triple("Growth", "€199", WhopConfig.enterpriseGrowthMonthly to WhopConfig.enterpriseGrowthYearly),
                        Triple("Scale", "€349", WhopConfig.enterpriseScaleMonthly to WhopConfig.enterpriseScaleYearly),
                        Triple("Unlimited", "€749", WhopConfig.enterpriseUnlimitedMonthly to WhopConfig.enterpriseUnlimitedYearly)
                    )
                    val images = listOf("1,200", "2,250", "5,250")
                    plans.forEachIndexed { index, (name, price, ids) ->
                        div(classes = "pricing-card") {
                            h2("plan-name") { +name }
                            div("plan-price") {
                                span("price-current") { +price }
                                span("price-period") { +" / month" }
                            }
                            if (index == 2) {
                                div("enterprise-slider-container") {
                                    input(type = InputType.range, classes = "enterprise-price-slider") {
                                        id = "enterpriseSlider"
                                        min = "750"
                                        max = "2250"
                                        step = "500"
                                    value = "749"
                                        attributes["aria-label"] = "Unlimited plan monthly price"
                                    }
                                    div("slider-labels") {
                                        span { +"€749" }; span { +"€1,249" }; span { +"€1,749" }; span { +"€2,249" }
                                    }
                                    div("slider-credits") { +"35,000 images / month" }
                                }
                            }
                            a(href = "/enterprise?plan=${name.lowercase()}", classes = "btn-primary btn-full whop-checkout") {
                                attributes["data-plan-monthly"] = ids.first
                                attributes["data-plan-yearly"] = ids.second
                                attributes["data-plan-type"] = name.lowercase()
                                +"GET ${name.uppercase()}"
                            }
                            ul("plan-features") {
                                li { span("check") { +"✓" }; +" ${images[index]} included images" }
                                li { span("check") { +"✓" }; +" Access to Housora design tools" }
                                li { span("check") { +"✓" }; +" Support by email" }
                            }
                        }
                    }
                }
                p("guarantee-text") { +"7-day support-backed refund review · "; a(href = "/refund-policy") { +"Refund policy" } }
            }
        }
    }
}
