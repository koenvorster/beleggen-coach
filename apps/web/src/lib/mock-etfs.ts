// Fallback voor dev zonder backend — wordt vervangen door API
// Gebruik api.etfs.list() uit @/lib/api in productie-code.

export type ETFCategory =
  | "Aandelen Wereld"
  | "Aandelen VS"
  | "Aandelen EM"
  | "Aandelen Europa"
  | "Obligaties";

export interface MockETF {
  ticker: string;
  name: string;
  isin: string;
  issuer: string;
  ter: number;
  category: ETFCategory;
  description: string;
  accumulating: boolean;
  numHoldings: number;
  beginnerScore: number;
  disciplineScore: number;
  riskScore: { rustig: number; licht: number; accepteer: number };
  beginnerScoreExplanation: string;
}

export const MOCK_ETFS: MockETF[] = [
  {
    ticker: "IWDA",
    name: "iShares MSCI World",
    isin: "IE00B4L5Y983",
    issuer: "iShares (BlackRock)",
    ter: 0.0020,
    category: "Aandelen Wereld",
    description:
      "Belegt in ruim 1.600 grote en middelgrote bedrijven uit 23 ontwikkelde landen. Ideaal als kernpositie voor langetermijnbeleggers.",
    accumulating: true,
    numHoldings: 1600,
    beginnerScore: 88,
    disciplineScore: 90,
    riskScore: { rustig: 40, licht: 80, accepteer: 95 },
    beginnerScoreExplanation:
      "Uitstekende spreiding, lage kosten en zeer eenvoudig te begrijpen. Perfect voor beginners die een brede basis willen.",
  },
  {
    ticker: "VWCE",
    name: "Vanguard FTSE All-World Acc",
    isin: "IE00BK5BQT80",
    issuer: "Vanguard",
    ter: 0.0022,
    category: "Aandelen Wereld",
    description:
      "Dekt zowel ontwikkelde als opkomende markten — meer dan 3.700 bedrijven wereldwijd. Accumulerend voor automatisch herbeleggen.",
    accumulating: true,
    numHoldings: 3700,
    beginnerScore: 92,
    disciplineScore: 93,
    riskScore: { rustig: 38, licht: 82, accepteer: 92 },
    beginnerScoreExplanation:
      "Maximale spreiding wereldwijd, inclusief opkomende markten. Lage kosten en geen dividend-administratie dankzij accumulerende structuur.",
  },
  {
    ticker: "VWRL",
    name: "Vanguard FTSE All-World Dist",
    isin: "IE00B3RBWM25",
    issuer: "Vanguard",
    ter: 0.0022,
    category: "Aandelen Wereld",
    description:
      "Zelfde spreiding als VWCE maar keert dividenden uit op je rekening. Geschikt als je een passief inkomen wil opbouwen.",
    accumulating: false,
    numHoldings: 3700,
    beginnerScore: 82,
    disciplineScore: 78,
    riskScore: { rustig: 35, licht: 78, accepteer: 88 },
    beginnerScoreExplanation:
      "Brede spreiding maar uitkerende versie betekent dat je zelf dividenden moet herbeleggen, wat iets meer discipline vraagt.",
  },
  {
    ticker: "SXR8",
    name: "iShares Core S&P 500",
    isin: "IE00B5BMR087",
    issuer: "iShares (BlackRock)",
    ter: 0.0007,
    category: "Aandelen VS",
    description:
      "Volgt de 500 grootste Amerikaanse bedrijven. Extreem lage kosten, maar hogere concentratie in één land en sector.",
    accumulating: true,
    numHoldings: 500,
    beginnerScore: 74,
    disciplineScore: 82,
    riskScore: { rustig: 25, licht: 68, accepteer: 90 },
    beginnerScoreExplanation:
      "Goedkoopste ETF in de lijst, maar beperkt tot de VS. Minder geschikt als enige positie voor beginners die globale spreiding willen.",
  },
  {
    ticker: "EMIM",
    name: "iShares Core MSCI EM IMI",
    isin: "IE00BKM4GZ66",
    issuer: "iShares (BlackRock)",
    ter: 0.0018,
    category: "Aandelen EM",
    description:
      "Belegt in meer dan 3.000 bedrijven uit opkomende markten zoals China, India en Brazilië. Hoog groeipotentieel maar ook meer volatiliteit.",
    accumulating: true,
    numHoldings: 3000,
    beginnerScore: 65,
    disciplineScore: 70,
    riskScore: { rustig: 15, licht: 50, accepteer: 88 },
    beginnerScoreExplanation:
      "Opkomende markten bieden groeipotentieel maar zijn volatiel. Beter als aanvulling dan als hoofdpositie voor beginners.",
  },
  {
    ticker: "IMEU",
    name: "iShares Core MSCI Europe",
    isin: "IE00B4K48X80",
    issuer: "iShares (BlackRock)",
    ter: 0.0012,
    category: "Aandelen Europa",
    description:
      "Geeft blootstelling aan 430 Europese bedrijven uit meer dan 15 landen. Goede aanvulling voor wie meer Europa wil.",
    accumulating: true,
    numHoldings: 430,
    beginnerScore: 70,
    disciplineScore: 75,
    riskScore: { rustig: 32, licht: 72, accepteer: 80 },
    beginnerScoreExplanation:
      "Goed voor wie bewust meer gewicht wil geven aan Europa. Iets minder breed dan wereldwijde ETFs.",
  },
  {
    ticker: "AGGH",
    name: "iShares Global Aggregate Bond",
    isin: "IE00BDBRDM35",
    issuer: "iShares (BlackRock)",
    ter: 0.0010,
    category: "Obligaties",
    description:
      "Wereldwijde obligaties voor meer stabiliteit in een gemengde portefeuille. Reageert minder heftig op marktschommelingen.",
    accumulating: true,
    numHoldings: 8000,
    beginnerScore: 78,
    disciplineScore: 85,
    riskScore: { rustig: 90, licht: 60, accepteer: 20 },
    beginnerScoreExplanation:
      "Ideaal voor voorzichtige beleggers die stabiliteit zoeken. Lage volatiliteit maar ook lager groeipotentieel op lange termijn.",
  },
  {
    ticker: "EUN5",
    name: "iShares € Govt Bond 3-5yr",
    isin: "IE00B1FZS681",
    issuer: "iShares (BlackRock)",
    ter: 0.0015,
    category: "Obligaties",
    description:
      "Europese overheidsobligaties met een looptijd van 3 tot 5 jaar. Stabiel maar met beperkt groeipotentieel.",
    accumulating: true,
    numHoldings: 60,
    beginnerScore: 62,
    disciplineScore: 72,
    riskScore: { rustig: 85, licht: 45, accepteer: 10 },
    beginnerScoreExplanation:
      "Weinig posities en beperkt tot Europese overheidsobligaties. Stabiel maar minder geschikt als enige ETF voor beginners.",
  },
  {
    ticker: "VAGF",
    name: "Vanguard Global Agg Bond",
    isin: "IE00BG47KB92",
    issuer: "Vanguard",
    ter: 0.0010,
    category: "Obligaties",
    description:
      "Brede spreiding over wereldwijde obligaties van overheden en bedrijven. Goed alternatief voor AGGH met vergelijkbaar risicoprofiel.",
    accumulating: true,
    numHoldings: 7000,
    beginnerScore: 76,
    disciplineScore: 83,
    riskScore: { rustig: 88, licht: 58, accepteer: 18 },
    beginnerScoreExplanation:
      "Vergelijkbaar met AGGH maar van Vanguard. Brede obligatiespreiding wereldwijd voor stabiliteit in je portefeuille.",
  },
  {
    ticker: "XDWD",
    name: "Xtrackers MSCI World Swap",
    isin: "IE00BJ0KDQ92",
    issuer: "Xtrackers (DWS)",
    ter: 0.0019,
    category: "Aandelen Wereld",
    description:
      "Synthetische replicatie van de MSCI World index. Vergelijkbaar met IWDA maar via een andere aanbieder.",
    accumulating: true,
    numHoldings: 1600,
    beginnerScore: 80,
    disciplineScore: 86,
    riskScore: { rustig: 38, licht: 78, accepteer: 90 },
    beginnerScoreExplanation:
      "Goed alternatief voor IWDA. Iets lagere beginnersscore door het synthetische karakter dat extra uitleg vereist.",
  },
];
