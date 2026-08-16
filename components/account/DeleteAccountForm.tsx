"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export function DeleteAccountForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState("");
  const requestDeletion = useMutation(api.accountDeletion.deleteAccount);
  const { user } = useUser();
  const clerk = useClerk();
  const submit = async () => {
    if (!confirmed || !user) return;
    if (!window.confirm("Permanently delete your Housora projects, uploads, generation history, usage data, and account profile? This cannot be undone.")) return;
    setStatus("Deleting your account…");
    try { await requestDeletion({}); await user.delete(); await clerk.signOut({ redirectUrl: "/" }); }
    catch { setStatus("Account deletion could not be completed. Contact support@housora.app for help."); }
  };
  return <div className="delete-account-card"><h2>This permanently removes</h2><ul><li>Your Housora account profile</li><li>Saved projects and generation records</li><li>Uploaded files stored for your account</li><li>Usage and subscription-linking records held by Housora</li></ul><p>Billing records held by Whop may be retained independently where required for transactions, disputes, or law. Cancel future renewals separately if applicable.</p><label className="delete-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I understand this deletion is permanent and cannot be undone.</label><button type="button" className="delete-account-btn" disabled={!confirmed} onClick={() => void submit()}>Permanently delete account</button>{status && <p role="status">{status}</p>}</div>;
}
