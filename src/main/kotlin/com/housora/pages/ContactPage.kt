package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.contactPage() {
    baseLayout("Contact | Housora AI Interior Design", bodyClass = "page-contact", path = "/contact") {
        section(classes = "contact-page-section") {
            div(classes = "contact-page-inner") {
                span(classes = "contact-eyebrow") { +"CONTACT HOUSORA" }
                h1(classes = "contact-page-title") { +"Let’s talk about your space" }
                p(classes = "contact-page-subtitle") { +"Product questions, account help, and billing support are available through our official social channels." }

                div(classes = "contact-content-block contact-social-block") {
                    h2 { +"Send us a message" }
                    p { +"Choose the channel you already use. For account or billing help, mention the email connected to Housora and keep your Whop receipt ready. Never send a password or payment card number." }
                    div(classes = "contact-social-cards") {
                        a(href = "https://www.instagram.com/housora_ai/", target = "_blank", classes = "contact-social-card") {
                            attributes["rel"] = "noopener noreferrer"
                            span(classes = "contact-social-icon") { +"◎" }
                            div { strong { +"Instagram" }; small { +"@housora_ai" } }
                            span { +"Send a message ↗" }
                        }
                        a(href = "https://www.facebook.com/profile.php?id=61590655134529", target = "_blank", classes = "contact-social-card") {
                            attributes["rel"] = "noopener noreferrer"
                            span(classes = "contact-social-icon") { +"f" }
                            div { strong { +"Facebook" }; small { +"Housora" } }
                            span { +"Send a message ↗" }
                        }
                        a(href = "https://www.youtube.com/@Housora_AI", target = "_blank", classes = "contact-social-card") {
                            attributes["rel"] = "noopener noreferrer"
                            span(classes = "contact-social-icon") { +"▶" }
                            div { strong { +"YouTube" }; small { +"@Housora_AI" } }
                            span { +"View channel ↗" }
                        }
                    }
                }

                div(classes = "contact-support-note") {
                    div { strong { +"For the fastest help" }; p { +"Tell us which Housora page or tool you were using and what you expected to happen. Response times can vary." } }
                    a(href = "/faq") { +"Check common answers →" }
                }

                div(classes = "contact-content-block contact-company-block") {
                    h2 { +"Company information" }
                    p { +"Housora is operated by Ismail Abelouas, trading as Housora." }
                    p {
                        +"For service operator, privacy controller, and contractual information, see the "
                        a(href = "/terms") { +"Terms" }
                        +" and "
                        a(href = "/privacy") { +"Privacy Policy" }
                        +"."
                    }
                }
            }
        }
    }
}
