package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.creationsPage() {
    baseLayout("AI Interior Design Gallery | Housora AI") {
        section(classes = "creations-hero") {
            div(classes = "creations-hero-inner") {
                h1(classes = "creations-hero-title") { +"AI Interior Design Gallery" }
                p(classes = "creations-hero-sub") { +"Real rooms redesigned by Housora users. Click any room to redesign it in one click." }
            }
        }
        section(classes = "creations-grid-section") {
            div(classes = "creations-grid-inner") {
                div(classes = "creations-grid") {
                    data class Creation(val img: String, val title: String, val author: String, val count: Int)
                    val creations = listOf(
                        Creation("/static/images/interior-after.jpg", "SHIPLAP ROOM REDESIGN", "Anna M.", 7),
                        Creation("/static/images/room-after.jpg", "MODERN LIVING ROOM MAKEOVER", "Clara F.", 4),
                        Creation("/static/images/kitchen-after.jpg", "OPEN PLAN LIVING & KITCHEN", "Tom B.", 6),
                        Creation("/static/images/bathroom-after.jpg", "SPA BATHROOM DESIGN", "David L.", 4),
                        Creation("/static/images/exterior-after.jpg", "HOME EXTERIOR MAKEOVER", "Alex D.", 6),
                        Creation("/static/images/garden-after.jpg", "MODERN GARDEN DESIGN", "Matus K.", 5),
                        Creation("/static/images/layout-after.jpg", "NYC STUDIO 5 WAYS", "Sophie L.", 6),
                        Creation("/static/images/walls-texture-after.jpg", "WALL TEXTURE STUDY", "James P.", 5),
                        Creation("/static/images/interior-before.jpg", "ROOM REDESIGN BEFORE", "Julia R.", 6),
                        Creation("/static/images/kitchen-after.jpg", "KITCHEN DESIGN VARIATIONS", "Mark T.", 5),
                        Creation("/static/images/garden-after.jpg", "MODERN GARDEN TERRACE DESIGN", "Sophie V.", 6),
                        Creation("/static/images/interior-after.jpg", "EUROPEAN APARTMENT \u2014 5 STYLES", "Sophie L.", 5)
                    )
                    creations.forEach { creation ->
                        div(classes = "creation-card") {
                            div(classes = "creation-img") {
                                img(src = creation.img, alt = creation.title) {
                                    attributes["width"] = "400"
                                    attributes["height"] = "260"
                                    attributes["loading"] = "lazy"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                                div(classes = "creation-count") {
                                    i("lucide copy") {}
                                    span { +"${creation.count}" }
                                }
                            }
                            h3(classes = "creation-title") { +creation.title }
                            p(classes = "creation-author") { +creation.author }
                        }
                    }
                }
            }
        }
    }
}
