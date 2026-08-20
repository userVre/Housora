package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.placeholderPage(title: String, heading: String, description: String) {
    baseLayout("Housora - $title") {
        section("placeholder-section") {
            div("placeholder-inner") {
                h1("placeholder-title") { +heading }
                p("placeholder-desc") { +description }
                p("placeholder-coming") { +"This page is coming soon. In the meantime, try our AI design tools!" }
                div("placeholder-links") {
                    a(href = "/", classes = "btn-primary") { +"Go to Homepage" }
                    a(href = "/interior-design", classes = "btn-secondary") { +"Try AI Interior Design" }
                }
            }
        }
    }
}

fun HTML.projectsPage() {
    baseLayout("My Projects | Housora", bodyClass = "page-projects", path = "/projects") {
        section("projects-page") {
            div("projects-content") {
                div("projects-header") {
                    div {
                        h1 { attributes["data-i18n"] = "nav.my_projects"; +"My Projects" }
                        p { +"Keep your room ideas together and return to them whenever you like." }
                    }
                    button(classes = "projects-new-btn") {
                        attributes["id"] = "newProjectBtn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "misc.new_project"
                        +"New Project"
                    }
                }
                p("projects-message") {
                    attributes["id"] = "projectsMessage"
                }
                div("projects-auth-gate") {
                    attributes["id"] = "projectsAuthGate"
                    h2 { attributes["data-i18n"] = "misc.sign_in_projects"; +"Sign in to access your projects" }
                    p { attributes["data-i18n"] = "misc.sign_in_projects_desc"; +"Your saved designs will appear here once you sign in." }
                    button(classes = "projects-signin-btn") {
                        attributes["id"] = "projectsSignInBtn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "nav.sign_in"
                        +"Sign in"
                    }
                }
                div("projects-grid") { attributes["id"] = "projectsGrid" }
                div("projects-empty") {
                    attributes["id"] = "projectsEmpty"
                    h2 { attributes["data-i18n"] = "misc.no_projects"; +"No projects yet" }
                    p { attributes["data-i18n"] = "misc.no_projects_desc"; +"Create a project, then save a generated design to it." }
                }
            }
        }
        script { unsafe { +"""
            window.addEventListener('DOMContentLoaded', function() {
                if (window.initHousoraProjects) window.initHousoraProjects();
            });
        """ } }
    }
}
fun HTML.inspirationsPage() = placeholderPage("Inspirations", "Inspirations", "Browse thousands of room designs for inspiration. Coming soon!")
fun HTML.referralPage() = placeholderPage("Referral", "Referral program", "Housora does not currently offer a referral or affiliate rewards program.")
fun HTML.promptGeneratorPage() = placeholderPage("Prompt Generator", "AI Prompt Generator", "Generate the perfect design prompt for any room. Coming soon!")
fun HTML.fitCalculatorPage() = placeholderPage("Fit Calculator", "Fit Calculator", "Calculate the perfect furniture size for your room. Coming soon!")
fun HTML.apiPage() = placeholderPage("API", "Housora API", "Integrate Housora AI into your apps. API documentation coming soon!")
fun HTML.cliPage() = placeholderPage("CLI", "Housora CLI", "Use Housora from the command line. CLI tool coming soon!")
fun HTML.mcpPage() = placeholderPage("MCP", "Housora MCP", "Model Context Protocol integration. Coming soon!")
fun HTML.partnershipsPage() = placeholderPage("Partnerships", "Partnerships", "Partner with Housora to bring AI design to your customers. Coming soon!")
fun HTML.b2bPage() = placeholderPage("B2B Clients", "B2B Solutions", "Enterprise design solutions for teams and businesses. Coming soon!")
fun HTML.affiliatePage() = placeholderPage("Affiliate Program", "Affiliate Program", "Housora does not currently offer an affiliate program.")
fun HTML.answersPage() = placeholderPage("Answers", "Design Answers", "Expert answers to your interior design questions. Coming soon!")
fun HTML.aiInformationPage() = placeholderPage("AI Information", "AI Information", "Learn how Housora AI works and the technology behind it. Coming soon!")

fun HTML.signOutPage() {
    baseLayout("Housora - Signing Out") {
        section("auth-page") {
            div("auth-container") {
                div("auth-left") {
                    h1("auth-heading") { +"SIGNING OUT" }
                    p("auth-subtext") { +"You are being signed out..." }
                    div("clerk-loading-content") {
                        div("loading-spinner") {}
                        p { +"Please wait..." }
                    }
                }
            }
        }
        script { unsafe { +"""
            (function() {
                var started = false;
                function doSignOut() {
                    if (started) return;
                    started = true;
                    function finish() {
                        try { localStorage.removeItem('housora_current_project'); } catch (_) {}
                        window.location.replace('/');
                    }
                    if (window.Clerk && typeof window.Clerk.signOut === 'function') {
                        Promise.resolve(window.Clerk.signOut()).then(finish).catch(finish);
                    } else finish();
                }
                if (window.housoraAuthState && window.housoraAuthState.status === 'ready') doSignOut();
                else window.addEventListener('clerk:ready', doSignOut, { once: true });
                setTimeout(doSignOut, 3000);
            })();
        """ } }
    }
}
