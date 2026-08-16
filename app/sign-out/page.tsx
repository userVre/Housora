"use client";
import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
export default function SignOutPage() { const { signOut } = useClerk(); useEffect(() => { void signOut({ redirectUrl: "/" }); }, [signOut]); return <main className="auth-page-section"><h1>Signing you out…</h1></main>; }
