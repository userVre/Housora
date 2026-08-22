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
                        +"Create project"
                    }
                }
                p("projects-message") { id = "projectsMessage" }
                div("projects-toolbar") { id = "projectsToolbar"; attributes["hidden"] = "hidden"
                    label { span("sr-only") { +"Search projects" }; textInput { id = "projectsSearch"; placeholder = "Search projects" } }
                    select { id = "projectsSort"; attributes["aria-label"] = "Sort projects"; option { value = "updated"; +"Recently edited" }; option { value = "name"; +"Name" } }
                }
                div("projects-skeleton-grid") { id = "projectsSkeletons"; attributes["aria-hidden"] = "true"; repeat(3) { article("project-skeleton") { div {}; span {}; i {} } } }
                div("projects-error") { id = "projectsError"; attributes["hidden"] = "hidden"; attributes["role"] = "alert"; h2 { +"We couldn’t load your projects" }; p { +"Check your connection. Your saved work is safe." }; button { id = "projectsRetry"; type = ButtonType.button; +"Retry" } }
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
                    p { +"Projects keep each room, its source photo, and generated directions together so you can continue later." }
                    button(classes = "projects-empty-cta btn-primary") { id = "projectsEmptyCreateBtn"; type = ButtonType.button; +"Create your first project" }
                }
                div("project-dialog-backdrop") { id = "projectDialogBackdrop"; hidden = true
                    div("project-dialog") {
                        attributes["role"] = "dialog"; attributes["aria-modal"] = "true"; attributes["aria-labelledby"] = "projectDialogTitle"
                        button(classes = "project-dialog-close") { id = "projectDialogClose"; type = ButtonType.button; attributes["aria-label"] = "Close create project dialog"; +"×" }
                        span("workspace-eyebrow") { +"NEW PROJECT" }
                        h2 { id = "projectDialogTitle"; +"Name your project" }
                        p { +"Start with a simple name. You can add your room photo and first design next." }
                        label { htmlFor = "projectNameInput"; +"Project name" }
                        textInput(classes = "project-dialog-input") { id = "projectNameInput"; attributes["maxlength"] = "120"; attributes["autocomplete"] = "off"; attributes["placeholder"] = "For example, Living room refresh" }
                        p("project-dialog-error") { id = "projectDialogError"; attributes["role"] = "alert"; attributes["aria-live"] = "polite" }
                        div("project-dialog-actions") {
                            button(classes = "project-dialog-cancel") { id = "projectDialogCancel"; type = ButtonType.button; +"Cancel" }
                            button(classes = "project-dialog-submit") { id = "projectDialogSubmit"; type = ButtonType.button; +"Create project" }
                        }
                    }
                }
            }
        }
    }
}
