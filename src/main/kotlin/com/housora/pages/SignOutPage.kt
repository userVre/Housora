package com.housora.pages

import com.housora.templates.baseLayout
import kotlinx.html.*

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
        script {
            unsafe {
                +"""
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
                """
            }
        }
    }
}
