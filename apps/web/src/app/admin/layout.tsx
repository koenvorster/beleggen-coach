import { redirect } from "next/navigation";
import { isAuthEnabled } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isAuthEnabled()) {
    const { auth } = await import("@/_auth_keycloak");
    const session = await auth();

    if (!session?.accessToken) {
      redirect("/api/auth/signin?callbackUrl=/admin/users");
    }

    // Decode roles from access token
    let roles: string[] = [];
    try {
      const b64 = session.accessToken
        .split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const payload = JSON.parse(
        Buffer.from(b64, "base64").toString("utf-8")
      ) as { realm_access?: { roles?: string[] } };
      roles = payload.realm_access?.roles ?? [];
    } catch {
      roles = [];
    }

    if (!roles.includes("admin")) {
      redirect("/");
    }
  }

  return <div>{children}</div>;
}
