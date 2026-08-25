"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TelegramLinkButton } from "./TelegramLinkButton";
import { toast } from "@/lib/hooks/use-toast";

type Profile = { name: string | null; email: string; emailVerified: boolean; telegramId: string | null; telegramVerified: boolean };

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account/profile", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result: Profile | null) => { setProfile(result); setName(result?.name ?? ""); })
      .catch(() => setProfile(null));
    return () => controller.abort();
  }, []);

  async function handleSaveName() {
    const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const result = (await response.json()) as Profile | { error?: string };
    if (!response.ok || !("email" in result)) { toast.error("error" in result ? result.error ?? "Unable to update profile." : "Unable to update profile."); return; }
    setProfile(result);
    setName(result.name ?? "");
    setIsEditing(false);
    toast.success("Profile updated.");
  }

  if (!profile) return <div className="rounded-lg bg-white p-6 shadow-md">Loading profile…</div>;
  return <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-lg font-semibold">{profile.name || "Unnamed user"}</p><p className="text-gray-600">{profile.email}</p><p className="mt-1 text-xs text-gray-500">Email verification will be available with password recovery.</p></div><Button variant="secondary" onClick={() => setIsEditing((value) => !value)}>{isEditing ? "Cancel" : "Edit name"}</Button></div>
    {isEditing && <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="Display name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className="w-full rounded border border-gray-300 px-3 py-2" /><Button onClick={handleSaveName}>Save</Button></div>}
    <div className="border-t border-gray-200 pt-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-lg font-semibold">Telegram Account</p><p className="text-sm text-gray-500">{profile.telegramId && profile.telegramVerified ? "Connected and verified." : "Connect Telegram with a one-time secure link."}</p></div>{profile.telegramId && profile.telegramVerified ? <span className="text-sm font-medium text-green-700">Connected</span> : <TelegramLinkButton />}</div></div>
  </div>;
}
