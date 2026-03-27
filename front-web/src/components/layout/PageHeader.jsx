import { ArrowLeft } from "lucide-react";

/**
 * Standard page heading with optional back link and action area.
 */
function PageHeader({ title, subtitle, backHref, actions = null }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        {backHref ? (
          <a
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primaryDark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
