import { cookies } from "next/headers";
import { SubmissionsDashboard } from "@/components/submissions-dashboard";
import {
  isSubmissionsPasswordConfigured,
  isValidSignedAuthCookieValue,
  SUBMISSIONS_COOKIE_NAME,
} from "@/lib/submissions-auth";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const cookieStore = await cookies();
  const isConfigured = isSubmissionsPasswordConfigured();
  const isAuthenticated = isValidSignedAuthCookieValue(
    cookieStore.get(SUBMISSIONS_COOKIE_NAME)?.value,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <SubmissionsDashboard
          isConfigured={isConfigured}
          initialAuthenticated={isAuthenticated}
        />
      </div>
    </main>
  );
}
