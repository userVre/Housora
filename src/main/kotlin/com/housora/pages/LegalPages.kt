package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

private const val CONTACT_EMAIL = "support@housora.app"

fun HTML.privacyPage() {
    baseLayout("Privacy Policy | Housora", path = "/privacy") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Privacy Policy" }
                p("legal-updated") { +"Last updated: July 28, 2026" }
                div("legal-content") {
                    p { +"This Privacy Policy explains how Housora collects and uses information when you use the Housora web application and related services (the Service)." }
                    h2 { +"1. Who operates Housora" }
                    p { +"Housora is operated by Ismail Abelouas. For legal notices, privacy requests, or service questions, contact: $CONTACT_EMAIL." }
                    h2 { +"2. Information we collect" }
                    ul {
                        li { +"Account information, such as your name, email address, profile image, and authentication identifiers." }
                        li { +"Content you submit, including room photos, floor plans, prompts, project names, and generated designs." }
                        li { +"Subscription and transaction information. Payments are handled by our payment provider; we do not store full card numbers." }
                        li { +"Technical information such as IP address, browser, device, error logs, and security events." }
                        li { +"Support messages and other information you choose to send us." }
                    }
                    h2 { +"3. How we use information" }
                    ul {
                        li { +"To authenticate accounts and provide, save, and secure the Service." }
                        li { +"To process uploaded images and prompts and return requested AI design outputs." }
                        li { +"To process subscriptions, prevent abuse, communicate service changes, and provide support." }
                        li { +"To diagnose errors and improve reliability, usability, and safety." }
                        li { +"To comply with legal obligations and enforce our Terms." }
                    }
                    h2 { +"4. Legal bases" }
                    p { +"Where GDPR applies, we rely on contract performance for account and design features, legitimate interests for security and service improvement, consent for optional cookies or marketing, and legal obligations where required." }
                    h2 { +"5. Service providers" }
                    p { +"Housora may use Clerk for authentication, Convex for application data and credits, Whop for subscriptions, Cloudflare for hosting and delivery, PostHog for optional analytics, and an image-generation provider when image generation is enabled. Providers process information only as needed to provide their services and under their applicable terms." }
                    h2 { +"6. Images and AI processing" }
                    p { +"You keep ownership of photos and other content you upload. You authorize Housora and its processors to host and process that content only to provide the requested features, protect the Service, and support your account. Do not upload images you do not have permission to use or images containing people who have not agreed to this use." }
                    h2 { +"7. Retention and deletion" }
                    p { +"We keep account, project, uploaded-image, and generation information while your account is active or as needed to provide the Service. You can start account deletion from the signed-in account controls or contact $CONTACT_EMAIL. We may retain limited records where required by law, for fraud prevention, payment disputes, or accounting." }
                    h2 { +"8. Your rights" }
                    p { +"Depending on your location, you may have rights to access, correct, delete, restrict, object to, or receive a copy of your personal data, and to withdraw consent. Contact $CONTACT_EMAIL. You may also complain to your local data protection authority." }
                    h2 { +"9. International transfers and security" }
                    p { +"Service providers may process information in countries outside your own. We use appropriate contractual or legal safeguards where required. We use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security." }
                    h2 { +"10. Children" }
                    p { +"The Service is not directed to children under 16. If you believe a child has provided personal information, contact us so we can investigate and delete it where appropriate." }
                    h2 { +"11. Changes and contact" }
                    p { +"We may update this Policy when the Service or law changes. The date above shows when it was last revised. Questions and privacy requests: $CONTACT_EMAIL." }
                }
            }
        }
    }
}

fun HTML.termsPage() {
    baseLayout("Terms & Conditions | Housora", path = "/terms") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Terms & Conditions" }
                p("legal-updated") { +"Last updated: July 28, 2026" }
                div("legal-content") {
                    p { +"These Terms govern your use of Housora. Housora is operated by Ismail Abelouas. Contact: $CONTACT_EMAIL. Please review these Terms together with the Refund Policy before using paid features." }
                    h2 { +"1. The Service" }
                    p { +"Housora provides tools for creating visual home-design concepts from user-provided images, floor plans, and prompts. Outputs are suggestions for planning and inspiration, not architectural, engineering, construction, safety, valuation, or professional design advice." }
                    h2 { +"2. Accounts" }
                    p { +"You must provide accurate information, keep your account secure, and promptly tell us about unauthorized use. You must be at least 16, or the minimum age required where you live." }
                    h2 { +"3. User content" }
                    p { +"You retain your rights in uploaded content. You confirm that you have permission to upload it and that it does not violate law, privacy, copyright, trademark, or other rights. You grant Housora a limited, non-exclusive license to host, copy, transmit, and process it only to operate and improve the Service, respond to support requests, and prevent abuse." }
                    h2 { +"4. AI outputs" }
                    p { +"AI outputs can be inaccurate, incomplete, or inconsistent. Check measurements, materials, product details, planning rules, and safety requirements with qualified professionals before making decisions or spending money. You are responsible for reviewing outputs before using or sharing them." }
                    h2 { +"5. Acceptable use" }
                    ul {
                        li { +"Do not use Housora unlawfully or to infringe another person's rights." }
                        li { +"Do not upload malware, private information without permission, or harmful or abusive content." }
                        li { +"Do not bypass limits, scrape the Service, reverse engineer it, or interfere with its security." }
                        li { +"Do not represent AI concepts as certified plans or guaranteed outcomes." }
                    }
                    h2 { +"6. Plans, credits, and payments" }
                    p { +"The current plans are Standard (100 images, €14 monthly or €149 annually), Pro (190 images, €29 monthly or €299 annually), Growth (1,200 images, €199 monthly or €2,099 annually), Scale (2,250 images, €349 monthly or €3,799 annually), and Unlimited (5,250 images, €749 monthly or €7,999 annually). Prices, taxes, renewal terms, and feature limits shown at checkout control the purchase. Paid plans renew according to the displayed billing period until cancelled. Payments are processed by Whop. Mandatory consumer rights are not affected." }
                    h2 { +"7. Cancellation and refunds" }
                    p { +"You may cancel through the account or payment-management controls provided by Housora. Cancellation normally takes effect at the end of the current paid period. Refunds are handled under the Refund Policy and applicable consumer law. Where a right of withdrawal applies to a digital service, we will obtain any legally required express request and acknowledgement before immediate performance." }
                    h2 { +"8. Intellectual property" }
                    p { +"Housora owns or licenses the Service, software, branding, interface, and original site content. Except for the rights expressly granted here, no rights are transferred. Housora does not claim ownership of your uploaded content. Subject to law and these Terms, you may use outputs generated from your content for your own projects." }
                    h2 { +"9. Availability and liability" }
                    p { +"The Service is provided on an availability basis and may change, be interrupted, or contain errors. To the maximum extent permitted by law, Housora is not liable for indirect or consequential loss. Nothing limits liability that cannot legally be limited, including fraud or personal injury caused by negligence." }
                    h2 { +"10. Suspension and termination" }
                    p { +"We may suspend or terminate access for security, legal, abuse, non-payment, or serious Terms violations. You may stop using the Service at any time. After termination, we may delete content according to the Privacy Policy and applicable retention duties." }
                    h2 { +"11. Governing law and contact" }
                    p { +"These Terms are subject to applicable mandatory consumer-protection laws. Questions about these Terms: $CONTACT_EMAIL." }
                }
            }
        }
    }
}

fun HTML.refundPage() {
    baseLayout("Refund Policy | Housora", path = "/refund-policy") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Refund Policy" }
                p("legal-updated") { +"Last updated: July 28, 2026" }
                div("legal-content") {
                    p { +"This policy applies to paid Housora plans unless a different term is shown at checkout or required by law." }
                    h2 { +"Cancellation" }
                    p { +"Cancel before the next renewal to avoid the next charge. You normally keep paid access until the end of the current billing period." }
                    h2 { +"Refund requests" }
                    p { +"For a support-backed refund review, contact $CONTACT_EMAIL within 7 days of the charge with your account email, purchase date, Whop receipt, and a description of the problem. We may offer a correction, replacement images, a partial refund, or another fair remedy. This review window does not remove any mandatory refund or withdrawal rights." }
                    h2 { +"Consumer rights" }
                    p { +"Nothing here removes mandatory consumer rights. If a digital service begins immediately after purchase, we will handle any required consent and withdrawal disclosures under the law that applies to you." }
                    h2 { +"Contact" }
                    p { +"Refund and billing questions: $CONTACT_EMAIL." }
                }
            }
        }
    }
}

fun HTML.cookiePolicyPage() {
    baseLayout("Cookie Policy | Housora", path = "/cookies") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Cookie Policy" }
                p("legal-updated") { +"Last updated: July 28, 2026" }
                div("legal-content") {
                    h2 { +"1. What cookies are" }
                    p { +"Cookies and similar technologies store or read small pieces of information on your device. Some are needed for the site to work; others are optional." }
                    h2 { +"2. Categories" }
                    ul {
                        li { +"Strictly necessary: authentication, security, session management, consent preferences, and basic routing. These cannot be disabled through the site." }
                        li { +"Preferences: remembers choices such as interface or upload settings, if enabled." }
                        li { +"Analytics: helps us understand visits and errors only after you consent, if analytics is enabled." }
                        li { +"Marketing: used only if we later add marketing or advertising tools and you consent." }
                    }
                    h2 { +"3. Current third parties" }
                    p { +"Clerk may set authentication-related storage, Convex may support application state, Cloudflare may use security or delivery technologies, Whop may use payment-session storage, and PostHog may use optional analytics storage only after analytics consent. The exact names and durations can change as the configuration changes." }
                    h2 { +"4. Your choices" }
                    p { +"You can block or delete cookies in your browser. Optional cookies should be enabled only after consent where required. Blocking necessary storage can prevent sign-in, uploads, subscriptions, or other features from working." }
                    h2 { +"5. Updates and contact" }
                    p { +"We will update this page when our cookie configuration changes. Questions: $CONTACT_EMAIL. See the Privacy Policy for information about personal data." }
                }
            }
        }
    }
}
