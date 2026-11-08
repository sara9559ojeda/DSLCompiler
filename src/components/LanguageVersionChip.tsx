import { useEffect, useState } from "react";
import { checkLanguageVersion, LOCAL_LANGUAGE_VERSION, type VersionStatus } from "../api/languageVersion.js";

/**
 * Shows the language version the preview compiles with and, once the backend
 * answers, whether it runs the same one. A mismatch is surfaced because the
 * preview (Web Worker) and the exports/AI would then disagree.
 */
export function LanguageVersionChip({ check = checkLanguageVersion }: { readonly check?: () => Promise<VersionStatus> }): JSX.Element {
  const [status, setStatus] = useState<VersionStatus>({ kind: "checking" });

  useEffect(() => {
    let active = true;
    void check().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, [check]);

  if (status.kind === "mismatch") {
    return (
      <li className="site-footer__chip--warn" role="status">
        Lenguaje {status.local}: el servidor usa {status.backend}
      </li>
    );
  }
  return (
    <li title={status.kind === "match" ? "El navegador y el servidor usan la misma versión" : undefined}>
      Lenguaje {LOCAL_LANGUAGE_VERSION}
      {status.kind === "match" ? <span className="visually-hidden"> (coincide con el servidor)</span> : null}
    </li>
  );
}
