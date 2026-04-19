import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bronnen & Referenties — BeleggenCoach",
  description: "Betrouwbare bronnen voor Belgische en Europese beleggers. Geen affiliate links.",
};

interface ResourceLink {
  emoji: string;
  name: string;
  url: string;
  description: string;
}

const marktdataLinks: ResourceLink[] = [
  {
    emoji: "📈",
    name: "Euronext",
    url: "https://www.euronext.com/nl",
    description: "Europese beurs, ETF-koersen",
  },
  {
    emoji: "📊",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com",
    description: "Koersen, grafieken, nieuws",
  },
  {
    emoji: "💱",
    name: "XE Currency",
    url: "https://www.xe.com",
    description: "Wisselkoersen EUR/USD/GBP",
  },
  {
    emoji: "🌍",
    name: "Investing.com",
    url: "https://www.investing.com",
    description: "Marktoverzicht, indices, ETF's",
  },
];

const etfToolLinks: ResourceLink[] = [
  {
    emoji: "🔍",
    name: "JustETF",
    url: "https://www.justetf.com/nl",
    description: "Beste ETF-screener voor Europa. Filter op kosten, categorie, domicilie.",
  },
  {
    emoji: "📉",
    name: "Tracking Differences",
    url: "https://www.trackingdifferences.com",
    description: "Werkelijke tracking difference vs. opgegeven TER. Essentieel voor echte kostenvergelijking.",
  },
  {
    emoji: "📦",
    name: "ETFdb",
    url: "https://etfdb.com",
    description: "Amerikaanse ETF-database, handig voor vergelijkingen",
  },
  {
    emoji: "🇧🇪",
    name: "FSMA ETF-lijst",
    url: "https://www.fsma.be",
    description: "Belgische toezichthouder, lijst van goedgekeurde financiële producten",
  },
];

const nieuwsLinks: ResourceLink[] = [
  {
    emoji: "🗞️",
    name: "De Tijd",
    url: "https://www.tijd.be",
    description: "Belgisch financieel dagblad (NL)",
  },
  {
    emoji: "📰",
    name: "L'Echo",
    url: "https://www.lecho.be",
    description: "Belgisch financieel dagblad (FR)",
  },
  {
    emoji: "🌐",
    name: "Financial Times",
    url: "https://www.ft.com",
    description: "Internationaal, diepgaande analyse",
  },
  {
    emoji: "📡",
    name: "Bloomberg",
    url: "https://www.bloomberg.com",
    description: "Wereldwijd marktnieuws",
  },
  {
    emoji: "🇧🇪",
    name: "Spaargids",
    url: "https://www.spaargids.be",
    description: "Vergelijking Belgische spaar- en beleggingsproducten",
  },
];

interface Broker {
  naam: string;
  type: string;
  transactiekosten: string;
  bewaarloon: string;
  etfs: string;
  opmerkingen: string;
}

const brokers: Broker[] = [
  {
    naam: "DEGIRO",
    type: "Online broker",
    transactiekosten: "Vanaf €1 + €1,75/jaar/beurs",
    bewaarloon: "Gratis",
    etfs: "Ruim aanbod",
    opmerkingen: "Populairste in België voor beginners",
  },
  {
    naam: "Bolero (KBC)",
    type: "Online broker",
    transactiekosten: "Vanaf €7,50",
    bewaarloon: "Gratis",
    etfs: "Euronext focus",
    opmerkingen: "Belgisch, goede klantenservice",
  },
  {
    naam: "Trade Republic",
    type: "Neobroker",
    transactiekosten: "€1 flat",
    bewaarloon: "Gratis",
    etfs: "Beperkt maar groeiend",
    opmerkingen: "Eenvoudig, geschikt voor maandelijks inleggen",
  },
  {
    naam: "Saxo Bank",
    type: "Online broker",
    transactiekosten: "Vanaf €3",
    bewaarloon: "0,12%/jaar",
    etfs: "Zeer breed",
    opmerkingen: "Meer geavanceerd",
  },
  {
    naam: "Bux Zero",
    type: "Neobroker",
    transactiekosten: "Gratis (base)",
    bewaarloon: "Gratis",
    etfs: "Beperkt",
    opmerkingen: "Simpelste interface",
  },
];

interface Book {
  emoji: string;
  title: string;
  author: string;
  description: string;
}

const boeken: Book[] = [
  {
    emoji: "📗",
    title: "The Little Book of Common Sense Investing",
    author: "John C. Bogle",
    description: "Bijbel van passief beleggen",
  },
  {
    emoji: "📘",
    title: "The Simple Path to Wealth",
    author: "JL Collins",
    description: "Eenvoudig en krachtig voor beginners",
  },
  {
    emoji: "📙",
    title: "A Random Walk Down Wall Street",
    author: "Burton Malkiel",
    description: "Klassiek werk over marktefficiëntie",
  },
  {
    emoji: "📕",
    title: "Uw geld of uw leven",
    author: "Vicki Robin",
    description: "Nederlandstalig, over financiële onafhankelijkheid",
  },
];

const podcasts: ResourceLink[] = [
  {
    emoji: "🎙️",
    name: "Rational Reminder",
    url: "https://rationalreminder.ca",
    description: "Canadees, evidence-based beleggen",
  },
  {
    emoji: "🎙️",
    name: "De Ondernemers",
    url: "https://deondernemers.be",
    description: "Belgische financiële podcast",
  },
];

const youtubeLinks: ResourceLink[] = [
  {
    emoji: "▶️",
    name: "Ben Felix",
    url: "https://www.youtube.com/@BenFelixCSI",
    description: "Factor investing, kritisch en onderbouwd",
  },
  {
    emoji: "▶️",
    name: "The Plain Bagel",
    url: "https://www.youtube.com/@ThePlainBagel",
    description: "Toegankelijk, beginner-vriendelijk",
  },
  {
    emoji: "▶️",
    name: "Hamish Hodder",
    url: "https://www.youtube.com/@HamishHodder",
    description: "ETF-analyse",
  },
];

const communityLinks: ResourceLink[] = [
  {
    emoji: "💬",
    name: "Bogleheads Forum",
    url: "https://www.bogleheads.org/forum",
    description: "Actieve community rond passief beleggen",
  },
  {
    emoji: "🇧🇪",
    name: "Reddit r/BEFire",
    url: "https://www.reddit.com/r/BEFire",
    description: "Belgische FIRE-community (Financial Independence)",
  },
];

function LinkGrid({ links }: { links: ResourceLink[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-start gap-3 hover:border-primary-300 border border-transparent transition-all group"
        >
          <span className="text-xl">{link.emoji}</span>
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-primary-600">{link.name}</p>
            <p className="text-sm text-gray-500">{link.description}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function BronnenPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Bronnen &amp; referenties 🔗</h1>
        <p className="text-gray-500">
          Betrouwbare bronnen voor Belgische en Europese beleggers. Geen affiliate links.
        </p>
      </header>

      {/* Section 1: Live marktdata */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          📈 Live marktdata
        </h2>
        <LinkGrid links={marktdataLinks} />
      </section>

      {/* Section 2: ETF-tools */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          🔍 ETF-tools
        </h2>
        <LinkGrid links={etfToolLinks} />
      </section>

      {/* Section 3: Financieel nieuws */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          🗞️ Financieel nieuws
        </h2>
        <LinkGrid links={nieuwsLinks} />
      </section>

      {/* Section 4: Brokers vergelijking */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          🏦 Brokers vergelijking
        </h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Broker</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Transactiekosten</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Bewaarloon</th>
                <th className="px-4 py-3 font-semibold text-gray-700">ETF&apos;s</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker, i) => (
                <tr
                  key={broker.naam}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">{broker.naam}</td>
                  <td className="px-4 py-3 text-gray-600">{broker.type}</td>
                  <td className="px-4 py-3 text-gray-600">{broker.transactiekosten}</td>
                  <td className="px-4 py-3 text-gray-600">{broker.bewaarloon}</td>
                  <td className="px-4 py-3 text-gray-600">{broker.etfs}</td>
                  <td className="px-4 py-3 text-gray-500">{broker.opmerkingen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          Tarieven zijn indicatief en kunnen wijzigen. Controleer altijd de actuele tarieven op de
          website van de broker.
        </p>
      </section>

      {/* Section 5: Leermateriaal */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          📚 Leermateriaal
        </h2>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Boeken</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {boeken.map((book) => (
              <div key={book.title} className="card flex items-start gap-3">
                <span className="text-xl">{book.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900">&ldquo;{book.title}&rdquo;</p>
                  <p className="text-sm text-gray-500">
                    {book.author} — {book.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Podcasts</h3>
          <LinkGrid links={podcasts} />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">YouTube</h3>
          <LinkGrid links={youtubeLinks} />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Community</h3>
          <LinkGrid links={communityLinks} />
        </div>
      </section>
    </div>
  );
}
