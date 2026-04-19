import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer & Juridische Informatie — BeleggenCoach",
  description: "Wettelijke informatie over de aard van de dienst, MiFID II, GDPR en toepasselijk recht.",
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Disclaimer &amp; juridische informatie
        </h1>
        <p className="text-gray-500">
          Lees deze pagina zorgvuldig door voordat u gebruikmaakt van BeleggenCoach.
        </p>
      </header>

      {/* Section 1: Aard van de dienst */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">1. Aard van de dienst</h2>
        <p className="text-sm text-gray-600">
          BeleggenCoach is een educatief platform dat informatie aanbiedt over beleggen, ETF&apos;s
          en persoonlijke financiën. Alle inhoud — inclusief simulaties, vergelijkingen, scores en
          uitleg — is uitsluitend bedoeld ter educatie en informatieverstrekking.
        </p>
        <p className="text-sm text-gray-600">
          Het platform vervangt geen professioneel financieel advies en mag niet worden
          geïnterpreteerd als een aanbeveling om bepaalde financiële producten te kopen, verkopen
          of aan te houden.
        </p>
      </section>

      {/* Section 2: Geen MiFID II-advies */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">2. Geen MiFID II-beleggingsadvies</h2>
        <p className="text-sm text-gray-600">
          BeleggenCoach is <strong>geen vergunde beleggingsadviseur</strong> in de zin van de
          MiFID II-richtlijn (Markets in Financial Instruments Directive). Wij beschikken niet over
          een vergunning van de FSMA (Autoriteit voor Financiële Diensten en Markten) om
          beleggingsadvies te verlenen.
        </p>
        <p className="text-sm text-gray-600">
          Voor persoonlijk beleggingsadvies raden wij u aan contact op te nemen met een erkend
          financieel adviseur die beschikt over een geldige FSMA-vergunning. Een lijst van vergunde
          adviseurs is beschikbaar op{" "}
          <a
            href="https://www.fsma.be"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            www.fsma.be
          </a>
          .
        </p>
      </section>

      {/* Section 3: Geen garantie op rendement */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">3. Geen garantie op rendement</h2>
        <p className="text-sm text-gray-600">
          Alle simulaties en rendementsprojecties op dit platform zijn{" "}
          <strong>puur indicatief</strong> en gebaseerd op hypothetische, vaste
          rendementspercentages. Werkelijke beleggingsresultaten zijn afhankelijk van
          marktomstandigheden, inflatie, kosten en andere factoren die niet zijn opgenomen in de
          simulaties.
        </p>
        <p className="text-sm text-gray-600">
          <strong>
            In het verleden behaalde resultaten bieden geen garantie voor de toekomst.
          </strong>{" "}
          Beleggen brengt risico&apos;s met zich mee, waaronder het risico uw volledige inleg te
          verliezen.
        </p>
      </section>

      {/* Section 4: GDPR */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">4. Gegevensbescherming (GDPR)</h2>
        <p className="text-sm text-gray-600">
          BeleggenCoach slaat uw persoonlijk profiel en beleggingsvoorkeuren momenteel{" "}
          <strong>uitsluitend lokaal op</strong> in de browser (localStorage). Er worden geen
          persoonsgegevens verstuurd naar externe servers of derde partijen.
        </p>
        <p className="text-sm text-gray-600">
          U kunt uw lokaal opgeslagen gegevens op elk moment verwijderen door de browsercache te
          wissen. Bij toekomstige uitbreidingen van het platform met accountfunctionaliteit of
          cloudopslag zal dit privacybeleid worden bijgewerkt conform de AVG/GDPR-vereisten.
        </p>
      </section>

      {/* Section 5: Toepasselijk recht */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">5. Toepasselijk recht</h2>
        <p className="text-sm text-gray-600">
          Op het gebruik van BeleggenCoach is het <strong>Belgisch recht</strong> van toepassing.
          Eventuele geschillen vallen onder de exclusieve bevoegdheid van de Belgische rechtbanken.
        </p>
        <p className="text-sm text-gray-600">
          Wij behouden ons het recht voor deze disclaimer op elk moment te wijzigen. De meest
          recente versie is steeds beschikbaar op deze pagina.
        </p>
      </section>

      {/* Section 6: Contact */}
      <section className="card space-y-3">
        <h2 className="text-lg font-bold text-gray-900">6. Contact</h2>
        <p className="text-sm text-gray-600">
          Voor vragen over deze disclaimer, de inhoud van het platform of gegevensbescherming kunt
          u ons bereiken via het algemene contactadres van BeleggenCoach. Wij streven ernaar uw
          vraag binnen 5 werkdagen te beantwoorden.
        </p>
      </section>

      <p className="text-xs text-gray-400 text-center pb-4">
        Laatste wijziging: januari 2026 · BeleggenCoach · Belgisch recht van toepassing
      </p>
    </div>
  );
}
