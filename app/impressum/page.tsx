import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getLegalSiteConfig } from "@/lib/legal/site";

export const metadata: Metadata = {
  title: "Impressum — Poolbar Ausweis-Generator",
};

export default function ImpressumPage() {
  const legal = getLegalSiteConfig();

  return (
    <LegalLayout title="Impressum">
      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          {legal.entityName}
        </h2>
        <p>Sitz / Büro- und Rechnungsadresse</p>
        <p>{legal.address}</p>
        <p>
          E-Mail:{" "}
          <a
            href={`mailto:${legal.email}`}
            className="text-lime-400 hover:text-lime-300"
          >
            {legal.email}
          </a>
        </p>
        <p>
          Website:{" "}
          <a
            href={`https://${legal.website.replace(/^https?:\/\//, "")}`}
            className="text-lime-400 hover:text-lime-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            {legal.website}
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          Vertreten durch
        </h2>
        <p>{legal.representative}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">UID-Nummer</h2>
        <p>{legal.uid}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          Aufsichtsbehörde
        </h2>
        <p>{legal.supervisoryAuthority}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          Inhaltlich Verantwortlicher gemäß § 55 Abs. 2 RStV
        </h2>
        <p>{legal.contentResponsible}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          Haftung für Inhalte
        </h2>
        <p>
          Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt.
          Dennoch übernehmen wir keine Gewähr für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">Urheberrecht</h2>
        <p>
          Die Inhalte und Werke in dieser Anwendung unterliegen dem
          österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung und
          Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen der
          schriftlichen Zustimmung des jeweiligen Rechteinhabers.
        </p>
      </section>
    </LegalLayout>
  );
}
