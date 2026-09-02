import Image from "next/image";
import { RSM_LOGO_URL } from "@/lib/brand";

type Props = {
  title?: string;
  description?: string;
  size?: "default" | "compact";
};

export function SubmissionsPageHeading({
  title = "Submissions",
  description,
  size = "default",
}: Props) {
  const logoHeight = size === "compact" ? 36 : 44;

  return (
    <div className="flex items-center gap-4">
      <div className="flex shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
        <Image
          src={RSM_LOGO_URL}
          alt="RSM"
          width={106}
          height={logoHeight}
          className="h-auto w-auto object-contain"
          style={{ maxHeight: logoHeight }}
          priority
        />
      </div>
      <div className="min-w-0 border-l border-slate-200 pl-4">
        <h1
          className={
            size === "compact"
              ? "text-2xl font-semibold text-[#1b3a57]"
              : "text-3xl font-semibold text-[#1b3a57]"
          }
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
