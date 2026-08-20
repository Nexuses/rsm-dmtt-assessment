"use client";

import dynamic from "next/dynamic";

const CybersecurityAssessmentForm = dynamic(
  () =>
    import("@/components/cybersecurity-assessment-form").then(
      (mod) => mod.CybersecurityAssessmentForm,
    ),
  { ssr: false },
);

export default function Page() {
  return (
    <main className="container mx-auto px-4 pb-8">
      <CybersecurityAssessmentForm />
    </main>
  );
}
