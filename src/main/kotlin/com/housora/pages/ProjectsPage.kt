package com.housora.pages

import com.housora.templates.baseLayout
import kotlinx.html.*

fun HTML.projectsPage() {
    baseLayout("My Projects | Housora", path = "/projects") {
        section("projects-page") {
            div("projects-content") {
                div("projects-header") {
                    div {
                        h1 { attributes["data-i18n"] = "nav.my_projects"; +"My Projects" }
                        p { +"Keep your design ideas together and return to them whenever you like." }
                    }
                    button(classes = "projects-new-btn") {
                        id = "newProjectBtn"
                        attributes["type"] = "button"
                        +"Choose a tool"
                    }
                }
                p("projects-message") { id = "projectsMessage" }
                div("projects-auth-gate") {
                    id = "projectsAuthGate"
                    h2 { attributes["data-i18n"] = "misc.sign_in_projects"; +"Sign in to access your projects" }
                    p { attributes["data-i18n"] = "misc.sign_in_projects_desc"; +"Your saved designs will appear here once you sign in." }
                    button(classes = "projects-signin-btn") {
                        id = "projectsSignInBtn"
                        attributes["type"] = "button"
                        attributes["data-i18n"] = "nav.sign_in"
                        +"Sign in"
                    }
                }
                div("projects-grid") { id = "projectsGrid" }
                div("projects-empty") {
                    id = "projectsEmpty"
                    h2 { attributes["data-i18n"] = "misc.no_projects"; +"No projects yet" }
                    p { +"Choose an AI tool and save your first generated design here." }
                }
            }
        }
        script {
            unsafe {
                +"""
                window.addEventListener('DOMContentLoaded', function() {
                    if (window.initHousoraProjects) window.initHousoraProjects();
                });
                """
            }
        }
    }
}
