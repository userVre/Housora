package com.housora.pages

import com.housora.templates.baseLayout
import kotlinx.html.*

private fun HTML.workspaceLibraryPage(kind: String) {
    val images = kind == "images"
    val heading = if (images) "My images" else "My likes"
    val description = if (images) {
        "Every design you create is kept here, ready to download or revisit."
    } else {
        "Keep the design directions you love close while you decide what to make next."
    }
    val emptyHeading = if (images) "No images yet" else "No saved designs yet"
    val emptyCopy = if (images) {
        "Create your first design and it will appear here automatically."
    } else {
        "Use the heart on a generated design to save it here."
    }
    val cta = if (images) "Create your first design" else "Explore AI tools"
    baseLayout("$heading | Housora", path = "/app/$kind") {
        section("workspace-library-page") {
            header("workspace-library-page-header") {
                span("workspace-eyebrow") { +if (images) "YOUR LIBRARY" else "SAVED DESIGNS" }
                h1 { +heading }
                p { +description }
            }
            p("workspace-library-status") { id = "workspaceLibraryStatus"; attributes["role"] = "status"; attributes["aria-live"] = "polite"; +"Loading your library…" }
            div("workspace-library-grid") { id = "workspaceLibraryGrid" }
            div("workspace-library-empty") { id = "workspaceLibraryEmpty"; hidden = true
                div("workspace-empty-art") { span { if (images) +"▧" else +"♡" } }
                div {
                    span { +if (images) "YOUR FIRST DESIGN" else "YOUR SAVED IDEAS" }
                    h2 { +emptyHeading }
                    p { +emptyCopy }
                    a(href = "/interior-design", classes = "workspace-inline-cta") { +cta }
                }
            }
        }
    }
}

fun HTML.workspaceImagesPage() = workspaceLibraryPage("images")
fun HTML.workspaceLikesPage() = workspaceLibraryPage("likes")
