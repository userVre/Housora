package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

private const val CONTACT_EMAIL = "support@housora.app"
private const val LEGAL_UPDATED = "August 13, 2026"

private fun FlowContent.legalContactLink(subject: String = "Housora legal request") {
    a(href = "mailto:$CONTACT_EMAIL?subject=${subject.replace(" ", "%20")}") { +CONTACT_EMAIL }
}

fun HTML.privacyPage() {
    baseLayout("Privacy Policy | Housora", path = "/privacy") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Privacy Policy" }
                p("legal-updated") { +"Last updated: $LEGAL_UPDATED" }
                div("legal-content") {
                    p { +"This Privacy Policy explains how Housora handles personal data when you visit the website, create an account, upload content, generate design concepts, buy a plan, or contact support." }

                    h2 { +"1. Controller and contact" }
                    p { +"Housora is operated by Ismail Abelouas, trading as Housora, who is the controller of the personal data described in this Policy. For privacy requests, legal notices, or questions, email "; legalContactLink("Housora privacy request"); +"." }

                    h2 { +"2. Personal data we handle" }
                    ul {
                        li { strong { +"Account data: " }; +"name, email address, profile image, authentication identifiers, account status, and plan information supplied by you or our authentication provider." }
                        li { strong { +"Your content: " }; +"room photographs, floor plans, prompts, project names, selected design options, generated images, and related file metadata." }
                        li { strong { +"Payments and subscriptions: " }; +"plan, billing period, transaction and subscription identifiers, payment status, and limited receipt information supplied by Whop. Housora does not receive or store your full payment-card number." }
                        li { strong { +"Technical and security data: " }; +"IP address, timestamps, browser and device information, request metadata, security events, rate-limit records, and error logs." }
                        li { strong { +"Optional analytics data: " }; +"page paths and selected product events described in section 6, but only after analytics consent." }
                        li { strong { +"Communications: " }; +"support messages, refund requests, feedback, and any information you choose to include." }
                    }
                    p { +"We receive this data from you, your device, Clerk, Whop, and the infrastructure providers involved in delivering the Service." }

                    h2 { +"3. Why we use data and our legal bases" }
                    ul {
                        li { +"Contract: to create and secure your account, provide requested design features, store projects, process subscriptions, and provide support." }
                        li { +"Legitimate interests: to secure the Service, prevent fraud and abuse, diagnose faults, maintain reliable operations, and establish or defend legal claims. We balance these interests against your rights." }
                        li { +"Consent: for optional PostHog analytics and any optional marketing communication. You can withdraw consent at any time without affecting earlier lawful processing." }
                        li { +"Legal obligations: for tax, accounting, consumer-protection, payment-dispute, and lawful-authority requirements." }
                    }
                    p { +"Account, upload, prompt, and payment information is required when you ask us to provide the corresponding feature. If you do not provide it, that feature may not work. You are not required by law to create an account or provide optional analytics consent." }

                    h2 { +"4. Images, prompts, and AI processing" }
                    p { +"You keep your rights in content you upload. You authorize Housora and its processors to host, transmit, and process that content to provide the feature you requested, secure the Service, and support your account. Uploaded content is not used for advertising. Housora will not use your private uploads to train a general-purpose AI model unless we first provide a separate notice and obtain any consent required by law." }
                    p { +"Room images can reveal private information about a home. Do not upload images you do not have permission to use, confidential documents, precise security details, or identifiable people who have not agreed to the processing." }

                    h2 { +"5. Providers and recipients" }
                    p { +"We use service providers only for the functions described here. They may include Clerk for authentication, Convex for application data and file storage, Cloudflare for hosting, delivery, security, and media storage, Whop for checkout and subscriptions, PostHog for consent-based product analytics, and the configured image-generation provider for processing the image and prompt submitted for a generation request. Professional advisers and authorities may receive limited data where legally required." }
                    p { +"We do not sell personal data. We do not use uploaded room images or prompts for third-party advertising." }

                    h2 { +"6. PostHog analytics" }
                    p { +"PostHog analytics is optional and remains off until you choose Allow analytics. When enabled, Housora may record page paths without query strings and explicit product events such as tool selected, upload type and size range, generation status and duration range, checkout state, and project actions. Events can also include event time, browser or device category, and approximate location derived from network data. For signed-in users, events may be associated with a pseudonymous Clerk user identifier and plan name." }
                    p { +"Housora configures PostHog without session replay, form or click autocapture, marketing profiling, or the contents of uploaded images and prompts. Query strings are removed from analytics page URLs. You can withdraw consent at any time through Cookie settings in the footer; withdrawal stops future browser and consent-gated server analytics on that device." }

                    h2 { +"7. International transfers" }
                    p { +"Some providers may process data outside your country or the European Economic Area. Where required, transfers rely on an adequacy decision, the European Commission's Standard Contractual Clauses, or another lawful safeguard. Contact us to request information about the safeguard relevant to a particular provider." }

                    h2 { +"8. Retention and deletion" }
                    p { +"We keep account, project, upload, and generation data while your account is active and for the period reasonably needed to provide the Service, complete deletion, resolve disputes, prevent fraud, or meet legal duties. Security logs and rate-limit records are kept only for the operational period for which they are needed. Payment and transaction records may be kept for the tax, accounting, chargeback, and consumer-law periods that apply. Optional analytics data follows the retention configured for the Housora PostHog project; contact us for the current setting." }
                    p { +"You can start account deletion from the signed-in account controls or email "; legalContactLink("Delete my Housora account and data"); +". Deletion requests cover Housora account data, projects, generations, and Housora-controlled uploads, subject to legal retention exceptions and limited provider backup cycles." }

                    h2 { +"9. Your rights" }
                    p { +"Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a portable copy of your personal data. You may withdraw consent and object to processing based on legitimate interests. You may also complain to the data-protection authority where you live, work, or believe an infringement occurred." }
                    p { +"To exercise a right, email "; legalContactLink("Housora data rights request"); +". We may ask for information needed to verify that the request concerns your account. We will respond within the period required by applicable law." }

                    h2 { +"10. Security and automated decisions" }
                    p { +"We use access controls, authentication, request validation, encryption in transit, and provider security controls intended to protect data. No internet service can guarantee absolute security. Housora does not make legal or similarly significant decisions about you using solely automated processing." }

                    h2 { +"11. Children" }
                    p { +"The Service is not directed to children under 16. If local law permits a lower age for independent consent, the local rule applies. If you believe a child has provided personal data without valid authorization, contact us so we can investigate and delete it where appropriate." }

                    h2 { +"12. Changes" }
                    p { +"We may update this Policy when the Service, providers, or law changes. We will change the date above and provide additional notice when a material change requires it." }
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
                p("legal-updated") { +"Last updated: $LEGAL_UPDATED" }
                div("legal-content") {
                    p { +"These Terms govern your use of Housora. Housora is operated by Ismail Abelouas, trading as Housora. Contact: "; legalContactLink("Housora terms question"); +". By creating an account or using the Service, you agree to these Terms. Paid purchases are also subject to the Refund Policy and the information shown at checkout." }

                    h2 { +"1. The Service" }
                    p { +"Housora creates visual home-design concepts from user-provided images, floor plans, and prompts. Outputs are for exploration and inspiration. They are not architectural, engineering, construction, electrical, structural, safety, valuation, legal, or other professional advice." }

                    h2 { +"2. Eligibility and accounts" }
                    p { +"You must be at least 16, or the minimum age required to agree to these Terms where you live. You must provide accurate account information, keep access credentials secure, and promptly report unauthorized access. You are responsible for activity performed through your account unless applicable law provides otherwise." }

                    h2 { +"3. User content" }
                    p { +"You retain your rights in uploaded content. You confirm that you have permission to upload and process it and that it does not violate law, confidentiality, privacy, copyright, trademark, or other rights. You grant Housora a limited, non-exclusive license to host, copy, transmit, and process the content only to provide and secure the Service, respond to support, and comply with law." }

                    h2 { +"4. AI outputs" }
                    p { +"AI outputs may be inaccurate, incomplete, inconsistent, or different from your prompt. They may depict products that do not exist and may not preserve measurements, lighting, structure, materials, or availability. Check all measurements, products, planning rules, and safety requirements with qualified professionals before construction, purchase, publication, or reliance." }
                    p { +"Housora does not claim ownership of your uploaded content. To the extent Housora has rights in an output created for you, Housora grants you permission to use that output for lawful personal or commercial projects, subject to third-party rights, provider terms, and applicable law. Copyright protection for AI-generated material can differ by country." }

                    h2 { +"5. Acceptable use" }
                    ul {
                        li { +"Do not use Housora unlawfully, deceptively, or to infringe another person's rights." }
                        li { +"Do not upload malware, confidential or personal data without permission, or unlawful, abusive, or exploitative content." }
                        li { +"Do not bypass account, credit, rate, or security limits; scrape the Service; reverse engineer protected parts; or disrupt infrastructure." }
                        li { +"Do not present an AI concept as a certified plan, measured survey, authentic property photograph, or guaranteed outcome." }
                        li { +"Do not use the Service to make high-impact decisions about another person." }
                    }

                    h2 { +"6. Plans, credits, and contract formation" }
                    p { +"Plan prices, included image allowances, billing period, applicable taxes, renewal terms, and material limits are displayed before purchase. The checkout and confirmation identify the plan and total amount charged. Your paid contract is formed when payment is accepted and access is confirmed. Credits or included images are usage allowances, not money, and cannot be transferred or redeemed for cash. Any expiry or rollover rule must be displayed with the plan before purchase." }
                    p { +"Paid plans renew for the displayed billing period until cancelled. You authorize the payment provider to charge the payment method for each renewal after any legally required notice. You can cancel future renewals through the online account or payment-management controls. Cancellation does not itself refund a completed charge." }

                    h2 { +"7. Technical requirements and digital-service updates" }
                    p { +"Housora requires a current web browser with JavaScript, an internet connection, and a supported image format and size shown in the upload interface. Generated concepts can vary between requests and are not measurement-accurate files. We may make security, compatibility, and service updates. If a change materially harms a consumer's paid access, mandatory conformity, termination, and refund rights remain available." }

                    h2 { +"8. Consumer withdrawal, cancellation, and refunds" }
                    p { +"If mandatory consumer law gives you a cooling-off or withdrawal right, that right applies in addition to Housora's support-backed refund review. For many EU distance contracts, the period is 14 days. If you expressly request immediate supply of digital content or performance of a service, the law may require you to acknowledge when and to what extent the withdrawal right is lost or a proportionate amount becomes payable." }
                    p { +"See the Refund Policy for how to submit a withdrawal or refund request. Nothing in these Terms removes mandatory remedies for a digital service that is not supplied as agreed." }

                    h2 { +"9. Third-party services" }
                    p { +"Authentication, hosting, storage, checkout, analytics, and AI processing may be provided by third parties. Their service availability and, where presented to you, their terms may also apply. Housora remains responsible for its obligations that cannot legally be delegated." }

                    h2 { +"10. Housora intellectual property" }
                    p { +"Housora owns or licenses the Service, software, branding, interface, and original site content. Except for rights expressly granted in these Terms, no rights are transferred. You may not copy or exploit protected parts of the Service beyond what law permits." }

                    h2 { +"11. Availability, changes, and suspension" }
                    p { +"The Service may change, be interrupted, or contain errors. We may suspend access to protect security, investigate abuse, comply with law, address non-payment, or respond to a serious Terms violation. Where reasonably possible, we will provide notice and an opportunity to resolve the issue. If we permanently discontinue a paid feature during a prepaid period, mandatory refund and consumer rights remain available." }

                    h2 { +"12. Liability" }
                    p { +"Nothing in these Terms excludes or limits liability where doing so is unlawful, including liability for fraud, wilful misconduct, or death or personal injury caused by negligence. Subject to those rules, Housora is not responsible for indirect loss or decisions made by treating an AI concept as professional or measured advice. Any limitation is applied only to the maximum extent permitted by the law protecting you." }

                    h2 { +"13. Ending use and surviving terms" }
                    p { +"You may stop using the Service and cancel future renewals at any time. On account deletion or termination, content is handled under the Privacy Policy. Provisions that by their nature should survive, including payment obligations already incurred, intellectual-property rules, disclaimers, and dispute provisions, continue to apply." }

                    h2 { +"14. Changes, complaints, and disputes" }
                    p { +"We may update these Terms for legal, security, or material Service changes. We will provide notice when required, and changes do not retroactively remove accrued consumer rights. Mandatory consumer protections and the courts available to you under applicable law are not displaced by these Terms." }
                    p { +"To complain, email "; legalContactLink("Housora complaint"); +" with your account email, the issue, and the outcome you seek. We will acknowledge the complaint and respond within the period required by applicable law. You may also use any competent consumer authority, dispute body, or court available to you." }
                }
            }
        }
    }
}

fun HTML.refundPage() {
    baseLayout("Refund & Withdrawal Policy | Housora", path = "/refund-policy") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Refund & Withdrawal Policy" }
                p("legal-updated") { +"Last updated: $LEGAL_UPDATED" }
                div("legal-content") {
                    p { +"This Policy explains cancellation, Housora's optional 7-day support review, and mandatory consumer withdrawal and refund rights. A cancellation stops future renewal; it does not automatically reverse a charge already completed." }

                    h2 { +"1. Cancel future renewals" }
                    p { +"Cancel through the online account or Whop payment-management controls before the next renewal. You normally retain access until the end of the paid billing period. If you bought online, you may also request cancellation by emailing "; legalContactLink("Cancel my Housora subscription"); +". We will provide or request confirmation of cancellation." }

                    h2 { +"2. Housora's 7-day support-backed review" }
                    p { +"In addition to mandatory legal rights, you may ask Housora to review a charge within 7 days. This is a review, not an unconditional money-back guarantee. It is intended for duplicate charges, access that was not delivered, persistent technical failure, or another material billing or Service problem." }
                    p { +"Email "; legalContactLink("Housora 7-day refund review"); +" with the account email, purchase date, Whop receipt or transaction identifier, and a short description of the problem. Depending on the circumstances, we may correct access, replace affected image allowances, issue a partial or full refund, or explain why the request is not eligible. This optional review never reduces mandatory rights." }

                    h2 { +"3. EU/EEA and other mandatory withdrawal rights" }
                    p { +"Where EU/EEA consumer law applies, an online service or subscription will commonly carry a 14-day withdrawal period starting when the contract is concluded. You do not need to give a reason. Other countries may provide similar or additional rights." }
                    p { +"If you expressly request performance during the withdrawal period, a proportionate amount may be payable for service already supplied where law permits. For digital content supplied immediately, the withdrawal right may be lost only after the legally required prior express consent and acknowledgement. If Housora or checkout did not obtain what the law requires, your withdrawal rights are not removed by this Policy." }

                    h2 { +"4. How to withdraw" }
                    p { +"Before the applicable deadline, email "; legalContactLink("I withdraw from my Housora purchase"); +" and clearly state that you withdraw from the purchase. Include your name, account email, purchase date, plan, and receipt or transaction identifier so we can locate it. A reason is not required for a statutory withdrawal." }
                    p { +"You may use this model wording: ‘To Housora (support@housora.app): I hereby give notice that I withdraw from my contract for the following Housora plan: [plan]. Ordered on: [date]. Name: [name]. Account email: [email]. Date of this notice: [date].’ A signature is not needed when you send the notice by email." }

                    h2 { +"5. Service problems and refunds" }
                    p { +"If the digital service is not supplied, is materially different from what was promised, or remains defective after a reasonable opportunity to correct it, you may have rights to correction, a price reduction, termination, or refund under applicable consumer law. Report the problem promptly with information that helps us reproduce it." }

                    h2 { +"6. Refund method and timing" }
                    p { +"Approved refunds are normally sent to the original payment method through Whop or the payment provider. Statutory refunds are issued within the legally required period; where EU withdrawal law applies, this is generally no later than 14 days after valid notice. Your bank or provider may take additional time to display the credit." }

                    h2 { +"7. Contact" }
                    p { +"Cancellation, withdrawal, refund, and billing questions: "; legalContactLink("Housora billing request"); +"." }
                }
            }
        }
    }
}

fun HTML.cookiePolicyPage() {
    baseLayout("Cookie & Storage Policy | Housora", path = "/cookies") {
        section("legal-section") {
            div("legal-inner") {
                h1("legal-title") { +"Cookie & Storage Policy" }
                p("legal-updated") { +"Last updated: $LEGAL_UPDATED" }
                div("legal-content") {
                    p { +"This Policy explains cookies and similar browser storage used by Housora. Cookies are small browser files; local storage and session storage serve similar purposes. Housora does not enable optional PostHog analytics until you consent." }

                    h2 { +"1. Strictly necessary and user-requested storage" }
                    ul {
                        li { strong { +"housora-consent-v2 (local storage): " }; +"records your analytics choice, policy version, date, and expiry for up to 6 months so the site can respect it. This storage is necessary to remember refusal as well as acceptance." }
                        li { strong { +"housora-lang (local storage): " }; +"remembers a language after you actively choose it. It remains until you change the choice or clear browser storage." }
                        li { strong { +"housora_first_design_options and housora_first_design_photo (session storage): " }; +"temporarily carry the image preview and options you selected into the editor and are cleared when the browser tab session ends." }
                        li { strong { +"housora_current_project (local storage): " }; +"opens the project you selected and remains until replaced, removed, or browser storage is cleared." }
                        li { strong { +"Clerk authentication cookies and storage: " }; +"Clerk may use names such as __session, __client, and __client_uat to maintain sign-in, refresh or synchronize sessions, and protect authentication. Exact duration depends on the configured session lifetime, sign-in method, and security state; session cookies can end when the browser session ends, while update markers can persist briefly." }
                        li { strong { +"Cloudflare security and delivery storage: " }; +"may be used where strictly necessary to protect traffic, balance delivery, and prevent abuse. Duration depends on the security challenge or delivery function." }
                    }
                    p { +"These technologies support a feature you request or remember your privacy choice. Blocking them can prevent sign-in, project handoff, security checks, or saved preferences from working." }

                    h2 { +"2. Optional PostHog analytics" }
                    p { +"If you choose Allow analytics, PostHog may use local storage keys whose names begin with ph_ to maintain a pseudonymous analytics identifier and session context. Housora sends page paths and explicit product events, which may include browser/device details, approximate network location derived by the provider, tool name, file type or size range, event timing, generation status, checkout state, project actions, plan, and a pseudonymous signed-in user identifier. Housora remembers the analytics choice for up to 6 months; PostHog event retention is controlled in the Housora PostHog project." }
                    p { +"Housora disables PostHog session replay, click/form autocapture, and marketing profiling. Housora does not intentionally send uploaded image contents, prompts, form text, payment-card data, or page-query parameters to PostHog. Optional analytics storage and collection stop when you withdraw consent." }

                    h2 { +"3. Payment-provider storage" }
                    p { +"When you choose checkout, you are redirected to Whop. Whop may use its own strictly necessary, fraud-prevention, preference, or other technologies under the notice shown on its checkout domain. Housora does not control storage set on Whop's website." }

                    h2 { +"4. No marketing trackers currently" }
                    p { +"Housora does not currently enable advertising or cross-site marketing trackers. A future marketing tool will not be activated under a general advance consent; the banner and this Policy must first be updated to identify the tool, purpose, data, and choice." }

                    h2 { +"5. Make or withdraw a choice" }
                    p { +"On your first visit, Reject analytics and Allow analytics are presented together. Analytics is off by default. You can later open Cookie settings in the footer, change the analytics switch, and save. Withdrawing is free and does not prevent normal use of Housora. It stops future optional analytics on that browser; data lawfully collected before withdrawal may be retained for the applicable analytics retention period." }

                    h2 { +"6. Browser controls and contact" }
                    p { +"You can also inspect, block, or delete cookies and site storage through your browser. Browser deletion may remove your saved refusal, so the banner may ask again. Questions or requests: "; legalContactLink("Housora cookie question"); +". See the Privacy Policy for data-protection rights and provider information." }
                }
            }
        }
    }
}
