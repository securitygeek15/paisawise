"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";

export default function HomePage() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
