package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.deleteAccountPage() {
    baseLayout("Delete Account | Housora", bodyClass = "page-account", path = "/delete-account") {
        section(classes = "legal-section") {
            div(classes = "legal-inner") {
                h1(classes = "legal-title") { +"Delete your Housora account" }
                div(classes = "legal-content") {
                    p { +"This permanently removes your sign-in account and starts deletion of Housora-controlled projects, generations, and uploads, subject to legal retention requirements and limited provider backup cycles." }
                    p { +"This action cannot be undone. Make sure you are signed in to the account you want to remove." }
                    label {
                        attributes["for"] = "deleteAccountConfirmed"
                        input(type = InputType.checkBox) { id = "deleteAccountConfirmed" }
                        +" I understand that this permanently deletes my account and cannot be undone."
                    }
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
                    const confirmation = document.getElementById('deleteAccountConfirmed');
                    const status = document.getElementById('deleteAccountStatus');
                    if (!button) return;
                    function setStatus(message, isError) {
                        if (status) {
                            status.textContent = message;
                            status.style.color = isError ? '#b42318' : '#287a3e';
                        }
                    }
                    async function deleteAccount() {
                        if (!confirmation || !confirmation.checked) {
                            setStatus('Confirm that you understand the permanent deletion before continuing.', true);
                            if (confirmation) confirmation.focus();
                            return;
                        }
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
