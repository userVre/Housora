import { SignUp } from "@clerk/nextjs";
import { SiteShell } from "@/components/layout/SiteShell";

export default function SignUpPage() { return <SiteShell bodyClass="auth-page"><section className="auth-page-section"><div className="auth-page-intro"><span className="auth-eyebrow">CREATE YOUR ACCOUNT</span><h1>Start exploring your next design direction</h1><p>Your projects and private uploads stay connected to your account.</p></div><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" /></section></SiteShell>; }
