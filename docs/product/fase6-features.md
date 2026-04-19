# Fase 6 — Uitbreiding features

> Status: **Gepland** — nog niet geïmplementeerd  
> Prioriteit: hoog → laag (volgorde hieronder)

---

## 1. Login & Authenticatie

### Doel
Gebruikers kunnen een account aanmaken, inloggen en hun persoonlijk profiel, plan en investeringen bewaren over sessies heen.

### Aanpak
- **Clerk** als authenticatieprovider (eenvoudige integratie met Next.js App Router)
- Alternatieven: Supabase Auth, Auth.js (NextAuth)
- Na login: profiel uit localStorage migreren naar DB (eenmalige sync)
- Beschermde routes via Clerk middleware (`/dashboard`, `/plan`, `/portfolio`, `/analytics`, `/checkin`)

### Technische vereisten
- `@clerk/nextjs` installeren
- `middleware.ts` aanmaken voor route protection
- Backend: JWT-validatie op FastAPI endpoints via Clerk webhooks of JWKS
- DB: `users` tabel koppelen aan Clerk user ID

### UX
- Login/register pagina op `/auth`
- Ingelogde gebruiker zichtbaar in nav (avatar + naam)
- "Jouw profiel" link in nav

---

## 2. Dashboard met snelle navigatie

### Doel
Het dashboard wordt de centrale hub: één pagina die alles samenbrengt met duidelijke snelle links naar alle secties.

### Huidige situatie
Dashboard toont momenteel statische mock-cards voor doel, inleg en ETF-suggestie.

### Uitbreidingen
- **Quick action cards** bovenaan: grote klikbare tegels naar Onboarding / ETF's / Plan / Portfolio / Leercentrum / Check-in / Bronnen
- **Persoonlijke begroeting** met naam (na login)
- **Statuswidgets**:
  - Laatste check-in datum
  - Hoeveel lessen voltooid in leercentrum
  - Portefeuille totaalwaarde (live of manueel ingevoerd)
  - Top 1 ETF aanbeveling van dit moment
- **Recente activiteit**: laatste check-in, laatste plan-update

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Goedemiddag, Jan 👋                                │
│  Jouw beleggingsoverzicht                           │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│ ETF's    │ Mijn     │ Portfolio│ Analyse  │ Bronnen │
│ verkennen│ Plan     │          │          │         │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│  Portefeuille: €12.450   │  Top ETF: VWCE  ★ 91    │
│  Check-in: 3 apr         │  Lessen: 7/10 ✓         │
└─────────────────────────────────────────────────────┘
```

---

## 3. AI Chat — Instant adviesgesprek

### Doel
Een conversationele interface waarbij de gebruiker vragen kan stellen en gepersonaliseerd antwoord krijgt op basis van zijn profiel, plan en marktdata.

### Voorbeeldvragen
- "Welke ETF past het best bij mij nu de markten dalen?"
- "Moet ik mijn inleg verhogen of verlagen dit jaar?"
- "Leg mij het verschil uit tussen IWDA en VWCE in gewone taal."
- "Is het een goed moment om te beginnen met beleggen?"

### Architectuur
```
Frontend Chat UI  →  POST /api/chat
                  →  FastAPI Chat Router
                  →  OpenAI API (GPT-4o) of lokaal model
                  →  Context: [gebruikersprofiel] + [ETF-data] + [marktdata]
                  →  System prompt: behavior coach + compliance rules
```

- **Streaming responses** voor gevoel van live antwoord (Server-Sent Events of WebSocket)
- **Context window**: profiel van gebruiker + huidige plan + relevante ETF-data meegeven als system context
- **Guardrails**: geen expliciete koopadvies, altijd disclaimer bij aanbevelingen
- **Geheugen**: laatste 10 berichten bewaard in sessie (in-memory of Redis)

### MCP-koppeling
De chat-agent roept intern MCP servers aan:
- `etf-data-mcp` voor ETF-vragen
- `portfolio-plan-mcp` voor simulatievragen
- `behavior-coach-mcp` voor emotionele/gedragsvragen

### UI
- Chat-interface op `/chat` (of als slide-over panel beschikbaar vanuit elke pagina)
- Berichtengeschiedenis zichtbaar
- Voorgestelde snelle vragen als chips onderaan

---

## 4. Top 3 ETF-aanbevelingen (gepersonaliseerd + actueel)

### Doel
Op basis van het gebruikersprofiel én huidige marktomstandigheden een **duidelijke Top 3** tonen met een uitgesproken **Nr. 1 keuze**.

### Hoe werkt de ranking
Combinatie van:
1. **Profiel-fit**: beginner-score × risico-fit × discipline-fit (bestaande scoring)
2. **Marktdata**: recente volatiliteit, YTD-rendement, drawdown vs. historisch gemiddelde
3. **Momentum-factor**: of de ETF recent beter of slechter presteert dan zijn benchmark
4. **Kosten**: lagere TER = lichte voorkeur

### Datavereisten
- Live of dagelijks bijgewerkte koersen (API: Yahoo Finance via `yfinance`, of Alpha Vantage)
- Historische rendementen voor volatiliteitsberekening
- Benchmark vergelijking (MSCI World als referentie)

### UI
```
┌─────────────────────────────────────────────────────┐
│  🏆 Jouw Top 3 van vandaag                          │
│  Op basis van jouw profiel + huidige markt          │
├─────────────────────────────────────────────────────┤
│  #1  VWCE  ★ 91  "Beste keuze voor jou vandaag"    │
│       Breed gespreid, lage kosten, stabiel momentum │
│       TER: 0.22%  |  YTD: +4.2%  |  Vol: laag      │
│       [Meer info]  [Voeg toe aan plan]              │
├─────────────────────────────────────────────────────┤
│  #2  IWDA  ★ 88                                     │
│  #3  XDWD  ★ 84                                     │
└─────────────────────────────────────────────────────┘
```

- Scores altijd in **mensentaal** verklaard (nooit kaal getal)
- Altijd disclaimer: "Dit is geen financieel advies."
- Dagelijks herberekend (scheduled job in backend)

### MCP-uitbreiding
Nieuwe tool in `etf-data-mcp`:
- `get_top3_for_profile(profile_id)` → combineert scoring + live marktdata

---

## 5. Portefeuille-opvolgingspagina

### Doel
Gebruikers kunnen hun **werkelijke beleggingen** bijhouden: welke ETFs ze hebben, hoeveel, tegen welke aankoopprijs, en wat de huidige waarde is.

### Functionaliteiten
- **Posities toevoegen**: ETF kiezen, aantal eenheden, aankoopprijs, aankoopdatum
- **Live waarde**: huidige koers × aantal eenheden
- **P&L**: winst/verlies per positie (€ en %)
- **Allocatie-diagram**: taartgrafiek van spreiding per categorie/regio
- **Totaalwaarde** + totale inleg + totaal rendement

### Datamodel uitbreiding
```
Portfolio
  - user_id
  - name (bijv. "Mijn hoofdportefeuille")
  - created_at

Position
  - portfolio_id
  - etf_ticker
  - units (aantal eenheden)
  - avg_buy_price (gemiddelde aankoopprijs €)
  - first_buy_date
  - last_updated
```

### UI — `/portfolio`
```
┌─────────────────────────────────────────────┐
│  Mijn portefeuille  (totaal: €12.450)        │
│  Ingelegd: €10.200  |  Rendement: +€2.250 ▲ │
├──────────┬───────────┬──────────┬────────────┤
│ ETF      │ Eenheden  │ Waarde   │ Rendement  │
├──────────┼───────────┼──────────┼────────────┤
│ VWCE     │ 42.5      │ €9.200   │ +18.5% ▲  │
│ AGGH     │ 120       │ €3.250   │ +4.2%  ▲  │
├──────────┴───────────┴──────────┴────────────┤
│  [+ Positie toevoegen]                       │
└─────────────────────────────────────────────┘
```
- Taartgrafiek (Recharts PieChart) per categorie
- Lijngraaf van totale portefeuille over tijd (als meerdere aankopen zijn ingevoerd)

---

## 6. Analytisch overzicht (verleden & heden)

### Doel
Een diepgaander analytisch dashboard dat de beleggingsgeschiedenis, gedragspatronen en prestaties van de gebruiker visualiseert.

### Secties

#### A. Portefeuillegroei over tijd
- Lijngraaf: totale waarde per maand
- Vergelijking: werkelijk vs. gesimuleerd bij start van plan
- Inleg vs. rendement opgesplitst (gestapeld staafdiagram)

#### B. Check-in historiek
- Kalender of tijdlijn van alle check-ins
- Emotionele staat per maand (kleurcodering)
- "Wanneer voelde je je het meest bezorgd?" → correlatie met marktdalingen

#### C. Gedragsanalyse
- Consistentiescore: hoeveel maanden op rij ingelegd?
- Impulsiviteitsindicator: hoe vaak plan gewijzigd?
- Disciplinescore over tijd (grafiek)

#### D. ETF-prestaties (eigen posities)
- Rendement per ETF vergeleken met benchmark
- Beste en slechtste positie

### UI — `/analytics`
- Tabbladen: Portefeuille / Gedrag / ETF-prestaties
- Alle grafieken interactief (Recharts)
- Exportknop: PDF of CSV download

---

## 7. Bronpagina

### Doel
Een gecureerde pagina met betrouwbare externe bronnen voor beginners: live beurzen, recente artikelen, tools en leesbronnen.

### Secties

#### A. Live marktdata
- Links naar live koersen (Euronext, NYSE, NASDAQ)
- Embed of link naar Yahoo Finance, Google Finance
- Wisselkoers EUR/USD live

#### B. ETF-specifieke bronnen
- justetf.com — ETF-screener (Europa)
- etfdb.com — ETF-database (VS)
- trackingdifferences.com — werkelijke tracking difference vs. TER
- bogleheads.org — filosofie van passief beleggen

#### C. Nieuws & analyse
- Links naar financieel nieuws: De Tijd, L'Echo, Bloomberg, FT
- RSS-feed integratie (optioneel): toon laatste 5 artikelen over ETF/beleggen
- Pensioenspaargids.be (Belgische context)

#### D. Brokers (vergelijking)
- Eenvoudige vergelijkingstabel van Belgische/Europese brokers:
  - DEGIRO, Bolero, Saxo, Trade Republic, Bux
  - Kolommen: kosten per transactie, beheerkosten, beschikbare ETF's, gebruiksgemak
  - **Geen affiliate links** — puur informatief

#### E. Leermateriaal
- Boeken: "The Simple Path to Wealth" (JL Collins), "A Random Walk Down Wall Street"
- Podcasts: Rational Reminder, We Study Billionaires
- YouTube: Ben Felix, Plain Bagel

### UI — `/bronnen`
- Gecategoriseerde secties met iconen
- Externe links openen in nieuw tabblad
- Dagelijks bijgewerkte nieuwssectie (indien RSS geïntegreerd)

---

## Prioritering & afhankelijkheden

```
Login & Auth  ──────────────────────────────────────────┐
                                                        │ vereist voor
Dashboard uitbreiding  ──── vereist profiel na login    │ persoonlijk data
Portefeuille opvolging ──── vereist login               │ per gebruiker
Analytisch overzicht ────── vereist portefeuille data   │
                                                        │
Top 3 aanbevelingen ─────── vereist live marktdata      │
AI Chat ─────────────────── vereist OpenAI API key      │
Bronpagina ──────────────── onafhankelijk ──────────────┘
```

**Aanbevolen volgorde:**
1. Login & Auth (basis voor alles persoonlijk)
2. Dashboard uitbreiding (direct zichtbaar voordeel)
3. Bronpagina (snel te bouwen, geen afhankelijkheden)
4. Portefeuille opvolging (kernfunctie voor actieve gebruikers)
5. Top 3 aanbevelingen (vereist live data)
6. AI Chat (vereist LLM-integratie)
7. Analytisch overzicht (vereist historische data)
