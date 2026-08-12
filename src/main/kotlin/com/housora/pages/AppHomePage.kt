package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.appHomePage() {
    baseLayout("Housora App | Home", bodyClass = "page-app-home", path = "/app/home") {
        section("app-home-section") {
            div("app-home-header") {
                div {
                    span("app-eyebrow") { +"HOUSORA APP" }
                    h1 { +"What will you design today?" }
                    p { +"Start a new room concept or continue exploring your saved designs." }
                }
                a(href = "/design#editor", classes = "btn-primary") { +"NEW DESIGN" }
            }
            div("app-home-primary") {
                div("app-home-primary-copy") {
                    span("app-card-label") { +"START A NEW DESIGN" }
                    h2 { +"Turn a room photo into a clear direction." }
                    p { +"Upload your room, choose a style, and generate a photorealistic concept." }
                    a(href = "/design#editor", classes = "btn-primary") { +"CREATE YOUR FIRST DESIGN" }
                }
                img(src = "/static/images/room-after.jpg", alt = "AI redesigned living room")
            }
            div("app-home-grid") {
                a(href = "/projects", classes = "app-home-card") { span { +"MY PROJECTS" }; h3 { +"Saved designs" }; p { +"Return to your previous rooms and compare directions." } }
                a(href = "/interior-design", classes = "app-home-card") { span { +"POPULAR TOOL" }; h3 { +"AI Interior Design" }; p { +"Redesign any room while preserving its architecture." } }
                a(href = "/reference-style", classes = "app-home-card") { span { +"NEW" }; h3 { +"Reference Style" }; p { +"Use an image you love to guide your room redesign." } }
            }
        }
    }
}
