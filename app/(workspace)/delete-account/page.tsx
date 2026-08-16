import { SiteShell } from "@/components/layout/SiteShell";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
export default function DeleteAccountPage() { return <SiteShell workspace><section className="delete-account-page"><div className="delete-account-inner"><span className="workspace-eyebrow">ACCOUNT</span><h1>Delete your Housora account</h1><p>Review everything below before continuing.</p><DeleteAccountForm /></div></section></SiteShell>; }
