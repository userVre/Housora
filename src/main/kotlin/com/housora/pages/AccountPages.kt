package com.housora.pages

import kotlinx.html.*
import com.housora.templates.baseLayout

fun HTML.deleteAccountPage() {
    baseLayout("Delete Account | Housora", bodyClass = "page-account", path = "/delete-account") {
        section(classes = "legal-section") {
            div(classes = "legal-inner") {
                h1(classes = "legal-title") { +"Delete your Housora account" }
                div(classes = "legal-content") {
                    p { +"This permanently removes your sign-in account, projects, uploaded source photos, and generated images from Housora-controlled systems. Payment records required for tax, fraud prevention, or legal compliance may be retained for the required period, and encrypted backups expire on provider schedules." }
                    p { +"Export any designs you need first. For your protection, Clerk may ask you to sign in again before deletion." }
                    a(href = "/projects", classes = "btn-secondary") { +"Review and export projects" }
                    label { attributes["for"] = "deleteAccountTyped"; +"Type DELETE to continue"
                        textInput { id = "deleteAccountTyped"; attributes["autocomplete"] = "off"; attributes["spellcheck"] = "false" }
                    }
                    label { attributes["for"] = "deleteAccountConfirmed"; checkBoxInput { id = "deleteAccountConfirmed" }; +" I understand this cannot be undone." }
                    button(classes = "btn-primary btn-large account-delete-danger") {
                        id = "deleteAccountButton"
                        attributes["type"] = "button"
                        attributes["disabled"] = "disabled"
                        +"Review account deletion"
                    }
                    p {
                        id = "deleteAccountStatus"
                        attributes["role"] = "status"
                    }
                    p { +"If deletion fails, you can retry without losing access to your account." }
                }
            }
        }
        script {
            unsafe {
                +"""
                (function() {
                    const button = document.getElementById('deleteAccountButton');
                    const confirmation = document.getElementById('deleteAccountConfirmed');
                    const typed = document.getElementById('deleteAccountTyped');
                    const status = document.getElementById('deleteAccountStatus');
                    if (!button) return;
                    function syncButton() { button.disabled = !(confirmation && confirmation.checked && typed && typed.value.trim() === 'DELETE'); }
                    confirmation?.addEventListener('change', syncButton);
                    typed?.addEventListener('input', syncButton);
                    function setStatus(message, isError) {
                        if (status) {
                            status.textContent = message;
                            status.style.color = isError ? '#b42318' : '#287a3e';
                        }
                    }
                    async function deleteAccount() {
                        if (!confirmation || !confirmation.checked || !typed || typed.value.trim() !== 'DELETE') {
                            setStatus('Type DELETE and confirm that you understand the permanent deletion.', true);
                            if (typed) typed.focus();
                            return;
                        }
                        if (!confirm('Final review: permanently delete this account and its Housora projects, uploads, and generated images?')) return;
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
                            setStatus(clerkMessage || 'We could not delete the account. Reauthenticate if requested, then try again.', true);
                        }
                    }
                    button.addEventListener('click', deleteAccount);
                })();
                """
            }
        }
    }
}
