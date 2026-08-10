package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.faqPage() {
    baseLayout("FAQ | Housora AI Interior Design") {
        section(classes = "faq-page-section") {
            div(classes = "faq-page-inner") {
                h1(classes = "faq-page-title") { attributes["data-i18n"] = "faq.title"; +"Frequently Asked Questions" }
                p(classes = "faq-page-subtitle") { attributes["data-i18n"] = "faq.subtitle"; +"Clear answers about Housora, image uploads, plans, and account controls." }
                val faqs = listOf(
                    "What is Housora?" to "Housora is an AI-assisted visual design tool. Upload a room, exterior, or garden photo, choose the available options, and explore a new design direction while keeping the original image as a reference.",
                    "Is Housora free to use?" to "Housora lets you explore the product before choosing a paid plan. The current image allowance, price, limits, and renewal terms are shown on the pricing page and in Whop checkout before you pay.",
                    "What image types can I upload?" to "Housora currently accepts JPEG, PNG, and WebP images. If your phone saves photos in another format, export the image to JPEG or PNG first.",
                    "Will the result preserve my room?" to "The tool is designed to use your photo as the visual reference, but AI results can change details or proportions. Treat the result as a concept, not a measured plan or professional construction advice.",
                    "Do you sell the furniture shown in an image?" to "Housora currently creates visual concepts. It does not promise a live furniture catalog, retailer price comparison, product availability, or direct purchasing unless those features are explicitly enabled in the product.",
                    "What plans are available?" to "Standard includes 100 images, Pro 190, Growth 1,200, Scale 2,250, and Unlimited 5,250. Monthly and annual prices are shown on the pricing page and confirmed by Whop at checkout.",
                    "How do I choose or cancel a plan?" to "Plans are purchased through Whop. Use the billing controls available from your Whop purchase to cancel future renewals, or contact support@housora.app with the account email used for the purchase if you need help.",
                    "How do I request a refund?" to "Email support@housora.app with your account email, purchase date, Whop receipt or transaction reference, and the reason for the request. Refunds are reviewed under the Refund Policy and applicable consumer law.",
                    "How do I delete my account?" to "Open Delete Account from the sidebar while signed in and confirm the request. If the self-service control cannot complete the request, email support@housora.app and include the account email.",
                    "Is my uploaded image professional advice?" to "No. Housora outputs are visual inspiration only. Check measurements, structure, safety, planning rules, materials, and installation details with a qualified professional before building or buying."
                )
                div(classes = "faq-category") {
                    h2(classes = "faq-category-title") { attributes["data-i18n"] = "faq.about"; +"About Housora" }
                    div(classes = "faq-list") {
                        faqs.forEachIndexed { index, (question, answer) ->
                            div(classes = "faq-item") {
                                div(classes = "faq-question") {
                                    attributes["role"] = "button"
                                    attributes["tabindex"] = "0"
                                    attributes["aria-expanded"] = "false"
                                    attributes["aria-controls"] = "faq-answer-$index"
                                    span { +question }
                                    span(classes = "faq-toggle") { +"+" }
                                }
                                div(classes = "faq-answer hidden") {
                                    id = "faq-answer-$index"
                                    p { +answer }
                                }
                            }
                        }
                    }
                }
                div(classes = "faq-still-questions") {
                    h2 { +"Still Have Questions?" }
                    p { +"Contact "; a(href = "mailto:support@housora.app") { +"support@housora.app" }; +" for account, billing, or privacy help." }
                }
            }
        }
    }
}
