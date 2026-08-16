import { SignIn } from "@clerk/nextjs";
import { SiteShell } from "@/components/layout/SiteShell";

export default function SignInPage() { return <SiteShell bodyClass="auth-page"><section className="auth-page-section"><div className="auth-page-intro"><span className="auth-eyebrow">WELCOME</span><h1>Sign in to access your Housora workspace</h1><p>Continue securely with your existing account.</p></div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" /></section></SiteShell>; }
