package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.signUpPage() {
    baseLayout("Housora - Sign Up", bodyClass = "page-auth", path = "/sign-up") {
        section("auth-page") {
            div("auth-container") {
                div("auth-left") {
                    div("auth-logo-icon") {
                        unsafe {
                            +"""<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8h16v24l-8-5-8 5V8z" fill="#1a1a1a"/><path d="M24 8h8v16h-8" fill="#1a1a1a"/></svg>"""
                        }
                    }
                    span("auth-brand-name") { +"HOUSORA" }
                    h1("auth-heading") { attributes["data-i18n"] = "auth.create_account"; +"CREATE YOUR HOUSORA ACCOUNT" }
                    p("auth-subtext") { attributes["data-i18n"] = "auth.start_journey"; +"Start your FREE room design journey" }

                    div("auth-social-buttons") {
                        button(classes = "auth-social-btn google-btn") {
                            attributes["id"] = "clerk-google-btn"
                            attributes["type"] = "button"
                            attributes["data-i18n"] = "auth.continue_google"
                            unsafe {
                                +"""<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>"""
                            }
                            +"Continue with Google"
                        }
                        button(classes = "auth-social-btn apple-btn") {
                            attributes["id"] = "clerk-apple-btn"
                            attributes["type"] = "button"
                            attributes["data-i18n"] = "auth.continue_apple"
                            unsafe {
                                +"""<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#000"/></svg>"""
                            }
                            +"Continue with Apple"
                        }
                    }

                    div("auth-divider") {
                        span { attributes["data-i18n"] = "auth.or"; +"OR" }
                    }

                    div("auth-email-form") {
                        label("auth-email-label") { htmlFor = "clerk-email-input"; attributes["data-i18n"] = "auth.email"; +"EMAIL" }
                        p("auth-field-help") { id = "clerk-email-help"; +"Use an address you can access to create and recover your account." }
                        input(type = InputType.email, classes = "auth-email-input") {
                            attributes["id"] = "clerk-email-input"
                            attributes["placeholder"] = "you@example.com"
                            attributes["aria-label"] = "Email address"
                            attributes["data-i18n-placeholder"] = "auth.email_placeholder"
                            attributes["required"] = "required"
                            attributes["autocomplete"] = "email"
                            attributes["aria-describedby"] = "clerk-email-help clerk-email-error"
                        }
                        p("auth-field-error") { id = "clerk-email-error"; attributes["role"] = "alert"; attributes["aria-live"] = "polite" }
                        button(classes = "auth-email-btn") {
                            attributes["id"] = "clerk-email-btn"
                            attributes["type"] = "button"
                            attributes["data-i18n"] = "auth.continue_email"
                            +"CONTINUE WITH EMAIL"
                        }
                    }

                    p("auth-safe-notice") {
                        attributes["data-i18n"] = "auth.data_safe"
                        +"We use security controls to protect your account and private uploads."
                    }

                    p("auth-legal-notice") {
                        +"By creating an account, you agree to the "
                        a(href = "/terms", target = "_blank") { attributes["rel"] = "noopener"; +"Terms & Conditions" }
                        +" and acknowledge the "
                        a(href = "/privacy", target = "_blank") { attributes["rel"] = "noopener"; +"Privacy Policy" }
                        +"."
                    }

                    p("auth-switch") {
                        +"Already have an account? "
                        a(href = "/sign-in") { +"Sign in" }
                    }
                }
                div("auth-right") {
                    div("auth-showcase") {
                        div("auth-comparison") {
                            div("auth-comparison-img") {
                                img(src = "/static/images/signin-before-after-v2.png", alt = "The same living room before and after a warm minimal Housora redesign") {
                                    attributes["width"] = "1122"
                                    attributes["height"] = "1402"
                                    attributes["loading"] = "eager"
                                    attributes["onerror"] = "this.style.opacity='0.3';this.alt='Image not available'"
                                }
                                span("auth-comparison-tag tag-before") { +"BEFORE" }
                                span("auth-comparison-tag tag-after") { +"AFTER" }
                            }
                        }
                        div("auth-stats-bar") {
                            div("auth-stat") {
                                span("auth-stat-number") { +"Explore" }
                                span("auth-stat-label") { +"ROOMS REDESIGNED" }
                            }
                            div("auth-stat") {
                                span("auth-stat-number") { +"NEW" }
                                span("auth-stat-label") { +"TRUSTED USERS" }
                            }
                            div("auth-stat") {
                                span("auth-stat-number") { +"Explore" }
                                span("auth-stat-label") { +"YOUR SPACE" }
                            }
                        }
                        div("auth-review") {
                            div("auth-review-stars") {
                                span("star") { +"★" }
                                span("star") { +"★" }
                                span("star") { +"★" }
                                span("star") { +"★" }
                                span("star") { +"★" }
                                span("auth-review-count") { +" Product preview" }
                            }
                            p("auth-review-text") { +"Explore a visual direction from your own room photo." }
                            span("auth-review-author") { +"Housora product example" }
                        }
                    }
                }
            }
        }

        // Auth-specific script — Clerk SDK is already loaded by baseLayout.
        // Listen for the clerk:ready event dispatched by Layout.kt.
        script {
            unsafe {
                +"""
                (function() {
                    function bindAuthButtons() {
                        var googleBtn = document.getElementById('clerk-google-btn');
                        var appleBtn = document.getElementById('clerk-apple-btn');
                        var emailBtn = document.getElementById('clerk-email-btn');
                        var emailInput = document.getElementById('clerk-email-input');
                        var emailError = document.getElementById('clerk-email-error');

                        if (googleBtn && googleBtn.dataset.authBound !== 'true') {
                            googleBtn.dataset.authBound = 'true';
                            googleBtn.addEventListener('click', function() {
                                if (window.HousoraAnalytics) window.HousoraAnalytics.track('signup_started', { method: 'google' });
                                window.housoraOpenAuth('signup');
                            });
                        }
                        if (appleBtn && appleBtn.dataset.authBound !== 'true') {
                            appleBtn.dataset.authBound = 'true';
                            appleBtn.addEventListener('click', function() {
                                if (window.HousoraAnalytics) window.HousoraAnalytics.track('signup_started', { method: 'apple' });
                                window.housoraOpenAuth('signup');
                            });
                        }
                        if (emailBtn && emailInput && emailBtn.dataset.authBound !== 'true') {
                            emailBtn.dataset.authBound = 'true';
                            emailBtn.addEventListener('click', function() {
                                var email = emailInput.value.trim();
                                if (email && emailInput.checkValidity()) {
                                    if (emailError) emailError.textContent = '';
                                    emailInput.removeAttribute('aria-invalid');
                                    if (window.HousoraAnalytics) window.HousoraAnalytics.track('signup_started', { method: 'email' });
                                    window.housoraOpenAuth('signup');
                                } else {
                                    emailInput.focus();
                                    emailInput.setAttribute('aria-invalid', 'true');
                                    if (emailError) emailError.textContent = email ? 'Enter a valid email address.' : 'Enter your email address.';
                                }
                            });
                            emailInput.addEventListener('input', function() {
                                emailInput.removeAttribute('aria-invalid');
                                if (emailError) emailError.textContent = '';
                            });
                            emailInput.addEventListener('keydown', function(event) {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    emailBtn.click();
                                }
                            });
                        }
                    }

                    bindAuthButtons();
                    if (window.Clerk && window.Clerk.user !== undefined) {
                        bindAuthButtons();
                    }

                    window.addEventListener('clerk:ready', function(e) {
                        var Clerk = e.detail.clerk;
                        if (Clerk.user) {
                            var requested = new URLSearchParams(window.location.search).get('redirect') || '/app/home';
                            var destination = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/app/home';
                            window.location.href = destination;
                            return;
                        }
                        bindAuthButtons();
                    });
                })();
                """
            }
        }
    }
}
