"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function EmailVerificationPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const isInvalidToken = !token;
  const [state, setState] = useState<"loading" | "success" | "error">(isInvalidToken ? "error" : "loading");
  const [message, setMessage] = useState(isInvalidToken ? "This verification link is invalid." : "Verifying your email…");

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/email-verification/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string; message?: string };
        setState(response.ok ? "success" : "error");
        setMessage(payload.message ?? payload.error ?? "Unable to verify this email.");
      })
      .catch(() => {
        setState("error");
        setMessage("Unable to verify this email. Please try again later.");
      });
  }, [token]);

  return <div className="bg-background-secondary flex flex-grow items-center justify-center p-4"><div className="w-full max-w-md"><Card><CardHeader className="text-center"><CardTitle className="font-headings text-text-primary text-3xl font-bold">Email verification</CardTitle><CardDescription>{message}</CardDescription></CardHeader><CardContent className="text-center"><Link href={state === "success" ? "/dashboard" : "/login"} className="text-accent hover:text-accent-hover font-medium">{state === "loading" ? "Please wait" : state === "success" ? "Go to Dashboard" : "Back to Sign In"}</Link></CardContent></Card></div></div>;
}
