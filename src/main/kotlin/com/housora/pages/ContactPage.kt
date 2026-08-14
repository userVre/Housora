package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.contactPage() {
    baseLayout("Contact | Housora AI Interior Design") {
        section(classes = "contact-page-section") {
            div(classes = "contact-page-inner") {
                h1(classes = "contact-page-title") { attributes["data-i18n"] = "contact.title"; +"Contact Us" }
                p(classes = "contact-page-subtitle") { attributes["data-i18n"] = "contact.subtitle"; +"We'd love to hear from you" }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.get_in_touch"; +"Get In Touch" }
                    p { attributes["data-i18n"] = "contact.get_in_touch_desc"; +"Have a question about your subscription, AI interior design, virtual staging, or your account? We\u2019re here to help." }
                }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.email"; +"Email" }
                    p { attributes["data-i18n"] = "contact.email_desc"; +"The best way to reach us is by email. Response times can vary." }
                    a(href = "mailto:support@housora.app", classes = "contact-email-link") { +"support@housora.app" }
                }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.billing"; +"Subscription & Billing" }
                    p { attributes["data-i18n"] = "contact.billing_desc1"; +"For questions about your plan, credits, billing, upgrades, or cancellations \u2014 email us at " }
                    a(href = "mailto:support@housora.app") { +"support@housora.app" }
                    p { attributes["data-i18n"] = "contact.billing_desc2"; +" with your account email and we\u2019ll assist you promptly." }
                }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.social"; +"Social Media" }
                    p { attributes["data-i18n"] = "contact.social_desc"; +"Follow us and send us a message on our social channels:" }
                    ul(classes = "contact-social-links") {
                        li { +"Instagram - "; a(href = "https://instagram.com/housoraapp", target = "_blank") { +"@housoraapp" } }
                        li { +"TikTok - "; a(href = "https://tiktok.com/@housoraapp", target = "_blank") { +"@housoraapp" } }
                        li { +"LinkedIn - "; a(href = "https://linkedin.com/company/housoraapp", target = "_blank") { +"Housora" } }
                    }
                }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.company"; +"Company Information" }
                    p { attributes["data-i18n"] = "contact.company_name"; +"Housora is operated by Ismail Abelouas, trading as Housora." }
                    p {
                        +"For the service operator, privacy controller, and contractual information, see the "
                        a(href = "/terms") { +"Terms" }
                        +" and "
                        a(href = "/privacy") { +"Privacy Policy" }
                        +"."
                    }
                }

                div(classes = "contact-content-block") {
                    h2 { attributes["data-i18n"] = "contact.response_time"; +"Response Time" }
                    p { attributes["data-i18n"] = "contact.response_desc"; +"Include your account email and Whop receipt for subscription or billing questions so we can locate the purchase." }
                }
            }
        }
    }
}
