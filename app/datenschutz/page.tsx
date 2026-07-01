import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getLegalSiteConfig } from "@/lib/legal/site";

export const metadata: Metadata = {
  title: "Datenschutz — Poolbar Ausweis-Generator",
};

export default function DatenschutzPage() {
  const legal = getLegalSiteConfig();

  return (
    <LegalLayout title="Datenschutzerklärung">
      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          1. Verantwortlicher
        </h2>
        <p>
          {legal.entityName}
          <br />
          {legal.address}
          <br />
          E-Mail:{" "}
          <a
            href={`mailto:${legal.email}`}
            className="text-lime-400 hover:text-lime-300"
          >
            {legal.email}
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          2. Zweck der Anwendung
        </h2>
        <p>
          Diese interne Web-Anwendung dient der Erstellung von Ausweisen für
          Mitarbeitende und berechtigte Personen im Rahmen des Poolbar
          Festivals. Dazu werden hochgeladene Datensätze und Fotos verarbeitet
          und als PDF exportiert.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          3. Verarbeitete personenbezogene Daten
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Vor- und Nachname</li>
          <li>Bereich und Rolle</li>
          <li>Ausweis-ID und Gültigkeitsdatum (MHD)</li>
          <li>Passfoto (Bilddatei aus dem Upload-ZIP)</li>
          <li>Bei aktiviertem Login: Benutzername und Session-Daten</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          4. Rechtsgrundlage
        </h2>
        <p>
          Die Verarbeitung erfolgt zur Vorbereitung und Durchführung des
          Festivals und der damit verbundenen Einsätze, insbesondere auf
          Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertrag / vorvertragliche
          Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
          an einer sicheren, nachvollziehbaren Ausweisvergabe).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          5. Speicherdauer
        </h2>
        <p>
          Hochgeladene Datensätze und Fotos werden ausschließlich zur
          unmittelbaren Verarbeitung im Arbeitsspeicher des Servers genutzt und
          nach Abschluss der Anfrage (Validierung, Vorschau oder Export)
          <strong> nicht dauerhaft gespeichert</strong>. Es gibt kein Archiv
          hochgeladener Dateien in der Anwendung.
        </p>
        <p>
          Generierte PDFs verbleiben auf dem Endgerät der autorisierten
          Nutzerin bzw. des autorisierten Nutzers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          6. Hosting und Auftragsverarbeiter
        </h2>
        <p>
          Der Betrieb erfolgt über {legal.hostingProvider} (
          {legal.hostingLocation}). Dabei können personenbezogene Daten im
          Rahmen der technischen Bereitstellung verarbeitet werden (z. B.
          Server-Logfiles, IP-Adressen).
        </p>
        <p>
          Mit dem Hosting-Anbieter ist bzw. wird ein Vertrag zur
          Auftragsverarbeitung gemäß Art. 28 DSGVO abgeschlossen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          7. Cookies und Session
        </h2>
        <p>
          Bei aktiviertem Login setzt die Anwendung technisch notwendige
          Session-Cookies ein, um die Anmeldung aufrechtzuerhalten. Es werden
          keine Tracking- oder Marketing-Cookies eingesetzt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          8. Zugriffsbeschränkung
        </h2>
        <p>
          Die Anwendung ist nur für autorisierte Personen bestimmt. Der Zugriff
          ist durch Login geschützt (sofern in der Produktionsumgebung
          aktiviert).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          9. Ihre Rechte
        </h2>
        <p>Sie haben im Rahmen der DSGVO insbesondere folgende Rechte:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Auskunft (Art. 15 DSGVO)</li>
          <li>Berichtigung (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Anfragen richten Sie bitte an{" "}
          <a
            href={`mailto:${legal.email}`}
            className="text-lime-400 hover:text-lime-300"
          >
            {legal.email}
          </a>
          . Beschwerderecht bei der österreichischen Datenschutzbehörde.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-neutral-100">
          10. Stand
        </h2>
        <p>Juli 2026</p>
      </section>
    </LegalLayout>
  );
}
