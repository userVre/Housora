package com.housora.pages

import kotlinx.html.*
import kotlinx.html.dom.*
import com.housora.templates.baseLayout

fun HTML.deleteAccountPage() {
    baseLayout("Delete Account | Housora") {
        section(classes = "legal-section") {
            div(classes = "legal-inner") {
                h1(classes = "legal-title") { +"Delete your Housora account" }
                div(classes = "legal-content") {
                    p { +"This permanently removes your Clerk account. Your projects and generated files may require separate retention or deletion processing." }
                    p { +"This action cannot be undone. Make sure you are signed in to the account you want to remove." }
                    button(classes = "btn-primary btn-large") {
                        id = "deleteAccountButton"
                        attributes["type"] = "button"
                        +"DELETE ACCOUNT"
                    }
                    p {
                        id = "deleteAccountStatus"
                        attributes["role"] = "status"
                    }
                    p { +"If the button cannot complete the request, email support@housora.app from the account email." }
                }
            }
        }
        script {
            unsafe {
                +"""
                (function() {
                    const button = document.getElementById('deleteAccountButton');
                    const status = document.getElementById('deleteAccountStatus');
                    if (!button) return;
                    function setStatus(message, isError) {
                        if (status) {
                            status.textContent = message;
                            status.style.color = isError ? '#b42318' : '#287a3e';
                        }
                    }
                    async function deleteAccount() {
                        if (!confirm('Delete your Housora account permanently?')) return;
                        if (!window.Clerk || !window.Clerk.user) {
                            setStatus('Please sign in first.', true);
                            return;
                        }
                        button.disabled = true;
                        setStatus('Deleting your account…', false);
                        try {
                            await window.Clerk.user.delete();
                            try { await window.Clerk.signOut(); } catch (_) {}
                            window.location.replace('/');
                        } catch (e) {
                            button.disabled = false;
                            const clerkMessage = e && e.errors && e.errors[0] && (e.errors[0].longMessage || e.errors[0].message);
                            setStatus(clerkMessage || 'Account deletion is not enabled for this Clerk instance. Enable user account deletion in Clerk, or contact support@housora.app.', true);
                        }
                    }
                    button.addEventListener('click', deleteAccount);
                })();
                """
            }
        }
    }
}
