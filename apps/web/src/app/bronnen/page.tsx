"use client";

import { useState, useMemo } from "react";

type Niveau = "Beginner" | "Gevorderd" | "Expert";

interface Bron {
  naam: string;
  emoji: string;
  beschrijving: string;
  tags: string[];
  url: string;
  niveau: Niveau;
}

type Categorie = "Alle" | "Podcasts" | "YouTube" | "Websites" | "Tools" | "Communities" | "Boeken" | "Experten";

const podcasts: Bron[] = [
  {
    naam: "De Beursvoyeurs",
    emoji: "🎙️",
    beschrijving:
      "Wekelijkse podcast van De Tijd over Belgische beurzen, actualiteit en beleggingsstrategie. Sterk voor Belgisch perspectief en interviews met experts.",
    tags: ["Belgisch", "Actueel", "Gevorderd"],
    url: "https://www.tijd.be/dossiers/podcast-de-beursvoyeurs.html",
    niveau: "Gevorderd",
  },
  {
    naam: "Het ABC van Beleggen (VFB)",
    emoji: "📚",
    beschrijving:
      "Educatieve podcast van de Vlaamse Federatie van Beleggers. Perfect voor beginners die stap voor stap willen leren wat ETFs, spreiding en langetermijnbeleggen zijn.",
    tags: ["Belgisch", "Beginner", "ETF", "Educatief"],
    url: "https://www.vfb.be/podcast",
    niveau: "Beginner",
  },
  {
    naam: "Fintastisch",
    emoji: "✨",
    beschrijving:
      "Luchtige maar informatieve gesprekken over financiën, beleggen en persoonlijk vermogensbeheer voor een breed Belgisch publiek.",
    tags: ["Belgisch", "Beginner", "Financiën"],
    url: "https://fintastisch.be",
    niveau: "Beginner",
  },
  {
    naam: "Trends Beleggen Podcast",
    emoji: "📈",
    beschrijving:
      "Dagelijks beursnieuws, analyses en inzichten vanuit Belgisch perspectief door de redactie van Trends.",
    tags: ["Belgisch", "Actueel", "Gevorderd"],
    url: "https://trends.knack.be/podcasts/beleggen-podcasts/",
    niveau: "Gevorderd",
  },
  {
    naam: "Jong Beleggen, de podcast",
    emoji: "🔥",
    beschrijving:
      "De populairste Nederlandstalige beleggingspodcast. Milou & Pim bespreken hun eigen beleggingsreis — ETFs, spreiding, brokers — op een toegankelijke manier. Enorm populair in België én Nederland.",
    tags: ["Nederlands", "ETF", "Beginner", "DCA"],
    url: "https://jongbeleggendepodcast.nl",
    niveau: "Beginner",
  },
  {
    naam: "Beleggen met Rowan Nijboer",
    emoji: "🎓",
    beschrijving:
      "Rowan is docent beleggen en expert in indexfondsen en ETFs. Praktische verdieping voor wie al de basis kent en meer wil begrijpen.",
    tags: ["Nederlands", "ETF", "Indexfondsen", "Gevorderd"],
    url: "https://www.rowannijboer.nl/podcast",
    niveau: "Gevorderd",
  },
  {
    naam: "De Lange Termijn",
    emoji: "📊",
    beschrijving:
      "Zware focus op ETF-selectie, historische rendementen en risicoprofielen. Behandelen geregeld top-ETF lijsten en vergelijkingen.",
    tags: ["Nederlands", "ETF", "Analyse", "Gevorderd"],
    url: "https://www.delangetermijn.nl",
    niveau: "Gevorderd",
  },
  {
    naam: "Voorkennis (Beleggers Belangen)",
    emoji: "💡",
    beschrijving:
      "Up-to-date beleggingsnieuws en ETF-besprekingen vanuit Nederland met relevante inzichten voor Belgische beleggers.",
    tags: ["Nederlands", "Actueel", "ETF"],
    url: "https://www.beleggersbelangen.nl/podcast",
    niveau: "Gevorderd",
  },
];

const youtube: Bron[] = [
  {
    naam: "The FIRE Belgium Show",
    emoji: "🇧🇪",
    beschrijving:
      "Sébastien Aguilar (oprichter Curvo) bereikt financiële onafhankelijkheid op zijn 33ste. Belgisch-specifiek advies over ETFs, brokers, belastingen en FIRE.",
    tags: ["Belgisch", "FIRE", "ETF", "Belastingen"],
    url: "https://firebelgium.com/show/",
    niveau: "Beginner",
  },
  {
    naam: "Ben Felix",
    emoji: "🔬",
    beschrijving:
      "CFA-charterholder die evidence-based beleggen uitlegt op basis van academisch onderzoek. De meest onderbouwde ETF-uitleg op YouTube.",
    tags: ["Engels", "ETF", "Academisch", "Expert"],
    url: "https://www.youtube.com/@BenFelixCSI",
    niveau: "Expert",
  },
  {
    naam: "The Plain Bagel",
    emoji: "🥯",
    beschrijving:
      "CFA Richard Coffin legt ETF-basics, marktmechanismen en beleggingsmythes uit in heldere geanimeerde video's. Uitstekend voor beginners.",
    tags: ["Engels", "ETF", "Beginner", "Educatief"],
    url: "https://www.youtube.com/@ThePlainBagel",
    niveau: "Beginner",
  },
  {
    naam: "Jonas Vermeulen – FIRE Community EU",
    emoji: "🌱",
    beschrijving:
      "Belgische FIRE-content met specifieke ETF-gids voor België en Nederland. Maakt de 'ETF Kickstart List' — 11 concrete ETF-aanbevelingen voor Belgische beginners.",
    tags: ["Belgisch", "FIRE", "ETF", "Beginner"],
    url: "https://firecommunity.eu",
    niveau: "Beginner",
  },
  {
    naam: "Saxo Bank België",
    emoji: "💼",
    beschrijving:
      "Officieel kanaal van Saxo Bank België met educatieve content over ETFs, marktanalyse en investeringsstrategieën voor Belgische beleggers.",
    tags: ["Belgisch", "Broker", "Educatief"],
    url: "https://www.youtube.com/@saxobank",
    niveau: "Gevorderd",
  },
  {
    naam: "Patrick Boyle",
    emoji: "📐",
    beschrijving:
      "Voormalig hedgefondsmanager die complexe financiële concepten toegankelijk uitlegt. Diepgang over markten, economie en beleggingsstrategieën.",
    tags: ["Engels", "Gevorderd", "Markten", "Economie"],
    url: "https://www.youtube.com/@PBoyle",
    niveau: "Expert",
  },
];

const websites: Bron[] = [
  {
    naam: "curvo.eu",
    emoji: "🔁",
    beschrijving:
      "Belgische investeringsapp én kennisbank. Backtesting tool, ETF-checklist voor Belgen, pensioenspaarsimulatoren en uitgebreide guides over TOB, brokers en FIRE.",
    tags: ["Belgisch", "ETF", "FIRE", "Tools", "Belgische belastingen"],
    url: "https://curvo.eu",
    niveau: "Beginner",
  },
  {
    naam: "justetf.com",
    emoji: "🔎",
    beschrijving:
      "De meest complete ETF-screener voor Europa. Filter op TER, replicatiemethode, domicilium, grootte en meer. Onmisbaar voor ETF-vergelijking.",
    tags: ["Europa", "ETF", "Screener", "Analyse"],
    url: "https://www.justetf.com",
    niveau: "Gevorderd",
  },
  {
    naam: "firebelgium.com",
    emoji: "🔥",
    beschrijving:
      "Centrale hub voor de Belgische FIRE-community. Guides, tools, FIRE-getal calculator en actieve Facebook-groepen in NL, FR en EN.",
    tags: ["Belgisch", "FIRE", "Community"],
    url: "https://firebelgium.com",
    niveau: "Beginner",
  },
  {
    naam: "backtest.curvo.eu",
    emoji: "📉",
    beschrijving:
      "Gratis backtest tool voor Europese ETF-portefeuilles. Simuleer historische rendementen van jouw ETF-mix van 2000 tot nu.",
    tags: ["Belgisch", "ETF", "Backtesting", "Tools"],
    url: "https://backtest.curvo.eu",
    niveau: "Gevorderd",
  },
  {
    naam: "tob-aangifte.be",
    emoji: "📋",
    beschrijving:
      "Officiële Belgische overheidstool voor het aangeven van de beurstaks (TOB). Verplicht als je bij een buitenlandse broker (Degiro, Trade Republic) handelt.",
    tags: ["Belgisch", "Belastingen", "TOB", "Officieel"],
    url: "https://eservices.minfin.fgov.be/tob/",
    niveau: "Beginner",
  },
  {
    naam: "De Tijd — Beleggen",
    emoji: "📰",
    beschrijving:
      "Betrouwbare Belgische financiële krant met diepgaande analyses, marktnieuws en beleggingsgidsen. Betaalmuur voor meeste artikels.",
    tags: ["Belgisch", "Nieuws", "Analyse"],
    url: "https://www.tijd.be/beleggen",
    niveau: "Gevorderd",
  },
  {
    naam: "Morningstar — ETF Research",
    emoji: "⭐",
    beschrijving:
      "Onafhankelijke ETF-ratings, analyst reviews en historische data voor duizenden ETFs wereldwijd. Gratis basisversie beschikbaar.",
    tags: ["Internationaal", "ETF", "Analyse", "Ratings"],
    url: "https://www.morningstar.be",
    niveau: "Gevorderd",
  },
  {
    naam: "VFB — Vlaamse Federatie van Beleggers",
    emoji: "🏛️",
    beschrijving:
      "Non-profit voor Belgische particuliere beleggers. Educatie, events, workshops en de ABC van Beleggen podcast. Ledenvoordelen en onafhankelijk advies.",
    tags: ["Belgisch", "Educatief", "Community", "Non-profit"],
    url: "https://www.vfb.be",
    niveau: "Beginner",
  },
];

const communities: Bron[] = [
  {
    naam: "r/FIREBelgium",
    emoji: "🔴",
    beschrijving:
      "Actieve Reddit-community voor Belgische FIRE-volgers. Vragen over brokers, belastingen, ETF-keuze en persoonlijke FIRE-reizen.",
    tags: ["Belgisch", "FIRE", "Reddit", "Community"],
    url: "https://www.reddit.com/r/FIREBelgium/",
    niveau: "Beginner",
  },
  {
    naam: "FIRE Belgium Facebook (NL)",
    emoji: "👥",
    beschrijving:
      "Nederlandstalige Facebook-groep van de FIRE Belgium community. Duizenden actieve leden die tips, resultaten en vragen delen.",
    tags: ["Belgisch", "FIRE", "Facebook", "Community"],
    url: "https://firebelgium.com",
    niveau: "Beginner",
  },
  {
    naam: "r/eupersonalfinance",
    emoji: "🌍",
    beschrijving:
      "Europese Reddit-community voor persoonlijke financiën. Engelstalig maar veel Belgische leden. Sterk voor ETF-discussies en broker-vergelijkingen.",
    tags: ["Europees", "ETF", "Reddit", "Engels"],
    url: "https://www.reddit.com/r/eupersonalfinance/",
    niveau: "Gevorderd",
  },
  {
    naam: "Bogleheads Forum",
    emoji: "📖",
    beschrijving:
      "De oorspronkelijke passive investing community, gebaseerd op de filosofie van Jack Bogle (oprichter Vanguard). Engelstalig, enorm kennisrijk.",
    tags: ["Internationaal", "ETF", "Indexbeleggen", "Engels"],
    url: "https://www.bogleheads.org/forum/",
    niveau: "Gevorderd",
  },
  {
    naam: "Jong Beleggen Community",
    emoji: "💬",
    beschrijving:
      "Nederlandse gemeenschap rond de Jong Beleggen podcast. Actief op Discord en via hun website. Ook populair bij Belgische beleggers.",
    tags: ["Nederlands", "ETF", "Community", "Beginner"],
    url: "https://jongbeleggendepodcast.nl/community",
    niveau: "Beginner",
  },
];

const boeken: Bron[] = [
  {
    naam: "Ik zal het je gewoon vertellen",
    emoji: "📗",
    beschrijving:
      "Michiel Panhuysen. Het meest populaire Nederlandstalige boek over eenvoudig beleggen via ETFs. Praktisch, toegankelijk en actie-gericht.",
    tags: ["Nederlands", "ETF", "Beginner", "Bestseller"],
    url: "https://www.bol.com",
    niveau: "Beginner",
  },
  {
    naam: "De Kleine Almanak van het Geluk",
    emoji: "📘",
    beschrijving:
      "Michaël Van Droogenbroeck. Belgisch boek over eenvoudig en verstandig omgaan met geld — sparen, beleggen en FIRE.",
    tags: ["Belgisch", "Geld", "Beginner"],
    url: "https://www.bol.com",
    niveau: "Beginner",
  },
  {
    naam: "The Little Book of Common Sense Investing",
    emoji: "📙",
    beschrijving:
      "John Bogle. De bijbel van passief beleggen via indexfondsen. Kort, krachtig en tijdloos. Vertaald in meerdere talen.",
    tags: ["Engels", "Indexfondsen", "Klassiek", "ETF"],
    url: "https://www.bol.com",
    niveau: "Beginner",
  },
  {
    naam: "A Random Walk Down Wall Street",
    emoji: "📕",
    beschrijving:
      "Burton Malkiel. Het definitieve argument voor passief beleggen. Bewijs dat actief beheer de markt niet verslaat op lange termijn.",
    tags: ["Engels", "Klassiek", "Wetenschappelijk"],
    url: "https://www.bol.com",
    niveau: "Gevorderd",
  },
  {
    naam: "Your Money or Your Life",
    emoji: "💚",
    beschrijving:
      "Vicki Robin & Joe Dominguez. Het originele FIRE-boek. Bewustwording over de relatie tussen tijd, geld en vrijheid.",
    tags: ["Engels", "FIRE", "Mindset", "Klassiek"],
    url: "https://www.bol.com",
    niveau: "Beginner",
  },
  {
    naam: "The Psychology of Money",
    emoji: "🧠",
    beschrijving:
      "Morgan Housel. Briljant boek over gedrag en geld. Verklaart waarom goede beleggingsbeslissingen emotioneel moeilijk zijn.",
    tags: ["Engels", "Gedrag", "Mindset", "Bestseller"],
    url: "https://www.bol.com",
    niveau: "Beginner",
  },
];

const tools: Bron[] = [
  {
    naam: "JustETF",
    emoji: "🔍",
    beschrijving:
      "De onbetwiste nr. 1 voor Europese beleggers. Filter op TER, fondsgrootte, replicatiemethode, domicilium en distributiepolitiek. Onmisbaar om de juiste ETF te kiezen.",
    tags: ["Europees", "ETF", "Screener", "Gratis"],
    url: "https://www.justetf.com/en-be/",
    niveau: "Beginner",
  },
  {
    naam: "Curvo Backtester",
    emoji: "📉",
    beschrijving:
      "Simuleer historische rendementen van je ETF-portefeuille van 2000 tot nu. Belgisch gericht, vergelijkt op rendement, kosten en duurzaamheid.",
    tags: ["Belgisch", "ETF", "Backtesting", "Gratis"],
    url: "https://backtest.curvo.eu",
    niveau: "Beginner",
  },
  {
    naam: "Test-Aankoop Invest",
    emoji: "🏷️",
    beschrijving:
      "Onafhankelijke Belgische ETF-lijst van Test-Aankoop met meer dan 1.000 producten. Nuttig voor rendement- en risicoanalyse zonder commercieel belang.",
    tags: ["Belgisch", "ETF", "Onafhankelijk", "Analyse"],
    url: "https://www.test-aankoop.be/invest",
    niveau: "Gevorderd",
  },
  {
    naam: "Morningstar",
    emoji: "⭐",
    beschrijving:
      "Diepgaande star ratings en analistenrapporten over fondsen en ETFs. Sterk voor het analyseren van intrinsieke waarde en langetermijnkwaliteit.",
    tags: ["Internationaal", "ETF", "Analyse", "Ratings"],
    url: "https://www.morningstar.be",
    niveau: "Gevorderd",
  },
  {
    naam: "TradingView",
    emoji: "📊",
    beschrijving:
      "De standaard voor technische analyse en koersgrafieken. Uitgebreide data over aandelen, ETFs en indices wereldwijd. Gratis basisversie.",
    tags: ["Internationaal", "Grafieken", "Technisch", "Gratis"],
    url: "https://www.tradingview.com",
    niveau: "Gevorderd",
  },
  {
    naam: "Sharesight",
    emoji: "📋",
    beschrijving:
      "Uitstekend voor het bijhouden van je portfolio als doe-het-zelf belegger. Tracked dividend, fiscale gevolgen en performance nauwkeurig.",
    tags: ["Portfolio", "Dividend", "Fiscaal", "DYI"],
    url: "https://www.sharesight.com",
    niveau: "Gevorderd",
  },
  {
    naam: "Snowball Analytics",
    emoji: "❄️",
    beschrijving:
      "Gespecialiseerd voor dividendbeleggers. Visualiseer je inkomstenstroom, dividenddistributie en groei over tijd.",
    tags: ["Dividend", "Portfolio", "Visualisatie"],
    url: "https://snowball-analytics.com",
    niveau: "Gevorderd",
  },
  {
    naam: "ETFdb.com",
    emoji: "🗄️",
    beschrijving:
      "Uitgebreide screeningtools en real-time nieuws over wereldwijde ETFs. Realtime Ratings op basis van liquiditeit, kosten en volatiliteit.",
    tags: ["Internationaal", "ETF", "Screener", "Ratings"],
    url: "https://etfdb.com",
    niveau: "Expert",
  },
  {
    naam: "Finviz",
    emoji: "🗺️",
    beschrijving:
      "Uitstekend voor het snel screenen van aandelen en het visualiseren van markttrends via heatmaps. Ideaal om snel een marktoverzicht te krijgen.",
    tags: ["Internationaal", "Aandelen", "Heatmap", "Screener"],
    url: "https://finviz.com",
    niveau: "Expert",
  },
];

const experten: Bron[] = [
  {
    naam: "Geert Noels — Econopolis",
    emoji: "🏰",
    beschrijving:
      "Belgische econoom en oprichter van Econopolis. Auteur van Econoshock, Gigantisme en Capitalism XXL. Pleit voor langetermijn, megatrends en onafhankelijk denken. Kritisch over blinde ETF-trackers met te veel concentratie.",
    tags: ["Belgisch", "Econoom", "Langetermijn", "Megatrends"],
    url: "https://www.econopolis.be",
    niveau: "Gevorderd",
  },
  {
    naam: "Michaël Van Droogenbroeck — VRT NWS",
    emoji: "📺",
    beschrijving:
      "Voornaamste financieel journalist bij VRT NWS. Co-auteur van 'ABC van Beleggen' (met Ewald Pironet) — het toonaangevende Belgische beginners-boek. Kernboodschap: 'Beleggen is geen sprint maar een marathon.'",
    tags: ["Belgisch", "VRT", "Beginner", "Boek"],
    url: "https://www.vrt.be/vrtnws/nl/",
    niveau: "Beginner",
  },
  {
    naam: "Chris Sugira — VRT MAX / Money Time",
    emoji: "🎙️",
    beschrijving:
      "Fondsenanalist (Belfius) en financieel expert bij VRT. Auteur van 'De economie van je leven'. Bekend van 50-30-20 regel en Money Time podcast. Focust op toegankelijke financiële educatie voor iedereen.",
    tags: ["Belgisch", "VRT", "Podcast", "Beginner", "50-30-20"],
    url: "https://www.vrt.be/vrtmax/",
    niveau: "Beginner",
  },
  {
    naam: "Paul D'Hoore — Dividendfilosofie",
    emoji: "💰",
    beschrijving:
      "Voormalig vaste beurscommentator VRT (tot 2007). Bekend om zijn dividendfilosofie: investeer in kwaliteitsbedrijven die consequent dividend verhogen en herbeleggen. 'Beurspaniek is vaak je vriend.'",
    tags: ["Belgisch", "Dividend", "Langetermijn", "Kwaliteit"],
    url: "https://www.bol.com/nl/nl/s/paul-d-hoore/",
    niveau: "Gevorderd",
  },
  {
    naam: "Ben Felix — Common Sense Investing",
    emoji: "🔬",
    beschrijving:
      "CFA-charterholder en portfoliomanager. Meest evidence-based ETF-kanaal op YouTube. Baseert alles op academisch onderzoek. Onmisbaar voor wie echt wil begrijpen waarom passief beleggen werkt.",
    tags: ["Engels", "ETF", "Academisch", "Expert"],
    url: "https://www.youtube.com/@BenFelixCSI",
    niveau: "Expert",
  },
  {
    naam: "JL Collins — The Simple Path to Wealth",
    emoji: "📗",
    beschrijving:
      "Amerikaanse belegger die de kracht van één brede index-ETF (VTSAX-equivalent) verdedigt. Zijn 'stock series' blog is gratis en tijdloos. Kernboodschap: simpel is beter.",
    tags: ["Engels", "ETF", "FIRE", "Simpel"],
    url: "https://jlcollinsnh.com",
    niveau: "Beginner",
  },
];

const alleBronnen: Record<Exclude<Categorie, "Alle">, Bron[]> = {
  Podcasts: podcasts,
  YouTube: youtube,
  Websites: websites,
  Tools: tools,
  Communities: communities,
  Boeken: boeken,
  Experten: experten,
};

const tabConfig: { label: Categorie; emoji: string }[] = [
  { label: "Alle", emoji: "" },
  { label: "Podcasts", emoji: "🎙️" },
  { label: "YouTube", emoji: "📺" },
  { label: "Websites", emoji: "🌐" },
  { label: "Tools", emoji: "🛠️" },
  { label: "Communities", emoji: "👥" },
  { label: "Boeken", emoji: "📚" },
  { label: "Experten", emoji: "🎓" },
];

const niveauKleuren: Record<Niveau, string> = {
  Beginner: "bg-green-100 text-green-800",
  Gevorderd: "bg-orange-100 text-orange-800",
  Expert: "bg-purple-100 text-purple-800",
};

function tagKleur(tag: string): string {
  if (tag === "Belgisch") return "bg-blue-100 text-blue-800";
  if (tag === "ETF") return "bg-orange-100 text-orange-800";
  if (tag === "Beginner") return "bg-green-100 text-green-800";
  if (tag === "FIRE") return "bg-red-100 text-red-800";
  if (tag === "Gratis") return "bg-emerald-100 text-emerald-800";
  if (tag === "Screener") return "bg-violet-100 text-violet-800";
  if (tag === "Dividend") return "bg-yellow-100 text-yellow-800";
  if (tag === "VRT") return "bg-indigo-100 text-indigo-800";
  if (tag === "Academisch") return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-700";
}

function BronKaart({ bron }: { bron: Bron }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{bron.emoji}</span>
          <h3 className="font-semibold text-gray-900 leading-tight">{bron.naam}</h3>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${niveauKleuren[bron.niveau]}`}
        >
          {bron.niveau}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{bron.beschrijving}</p>
      <div className="flex flex-wrap gap-1.5">
        {bron.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagKleur(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>
      <a
        href={bron.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        Bezoeken →
      </a>
    </div>
  );
}

export default function BronnenPage() {
  const [actieveTab, setActieveTab] = useState<Categorie>("Alle");
  const [zoekterm, setZoekterm] = useState("");
  const [niveauFilter, setNiveauFilter] = useState<"Alle" | Niveau>("Alle");

  const gefilterdeBronnen = useMemo(() => {
    const bronnenLijst: Bron[] =
      actieveTab === "Alle"
        ? Object.values(alleBronnen).flat()
        : alleBronnen[actieveTab];

    return bronnenLijst.filter((bron) => {
      const zoekMatch =
        zoekterm === "" ||
        bron.naam.toLowerCase().includes(zoekterm.toLowerCase()) ||
        bron.tags.some((tag) => tag.toLowerCase().includes(zoekterm.toLowerCase())) ||
        bron.beschrijving.toLowerCase().includes(zoekterm.toLowerCase());

      const niveauMatch = niveauFilter === "Alle" || bron.niveau === niveauFilter;

      return zoekMatch && niveauMatch;
    });
  }, [actieveTab, zoekterm, niveauFilter]);

  const totaalAantal = Object.values(alleBronnen).flat().length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Bronnen &amp; aanbevelingen 📚</h1>
        <p className="text-gray-600 max-w-2xl">
          Een gecureerde selectie van{" "}
          <span className="font-semibold text-blue-700">{totaalAantal} betrouwbare bronnen</span>{" "}
          voor Belgische en Europese beleggers. Begin met de bronnen gemarkeerd als{" "}
          <span className="inline-flex items-center gap-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              Beginner
            </span>
          </span>{" "}
          — ze zijn speciaal geselecteerd voor wie net start. Geen affiliate links.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabConfig.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => setActieveTab(label)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              actieveTab === label
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {emoji && <span className="mr-1">{emoji}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Zoek op naam, tag of beschrijving..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <div className="flex gap-2">
          {(["Alle", "Beginner", "Gevorderd", "Expert"] as const).map((n) => (
            <button
              key={n}
              onClick={() => setNiveauFilter(n)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                niveauFilter === n
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Resultaten teller */}
      <p className="text-sm text-gray-500">
        {gefilterdeBronnen.length === 0
          ? "Geen bronnen gevonden."
          : `${gefilterdeBronnen.length} bron${gefilterdeBronnen.length !== 1 ? "nen" : ""} gevonden`}
      </p>

      {/* Kaarten grid */}
      {gefilterdeBronnen.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gefilterdeBronnen.map((bron) => (
            <BronKaart key={`${bron.naam}-${bron.url}`} bron={bron} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Probeer een andere zoekterm of filter.</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        Deze bronnenlijst is puur informatief en vormt geen financieel advies. Raadpleeg altijd een
        erkend financieel adviseur voor persoonlijk beleggingsadvies.
      </p>
    </div>
  );
}
