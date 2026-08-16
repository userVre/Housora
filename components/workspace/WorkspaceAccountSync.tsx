"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function WorkspaceAccountSync() {
  const { user } = useUser();
  const sync = useMutation(api.users.createOrUpdateUser);
  useEffect(() => {
    if (!user) return;
    void sync({ clerkId: user.id, email: user.primaryEmailAddress?.emailAddress || "", name: user.fullName || undefined }).catch(() => undefined);
  }, [sync, user]);
  return null;
}
