# Dit project uitgelegd — voor Sarah 💛

*Geschreven zodat je het begrijpt zonder technische achtergrond.*

---

## Waar gaat dit project over?

Stel je voor: je wil beginnen met beleggen, maar je hebt geen idee waar je moet starten.
Je googlet wat en komt meteen termen tegen als "ETF", "TER", "risicoprofiel", "spreiding"...
en voor je het weet heb je 12 tabbladen open en weet je nóg niet wat je moet doen.

**Dat is precies het probleem dat dit project oplost.**

Het project bouwt een **AI-assistent voor beginnende beleggers** — een soort persoonlijke coach die:

- in gewone taal uitlegt wat ETFs zijn en hoe ze werken
- je helpt nadenken over hoeveel risico je aankunt
- je gedrag begrijpt ("ik wil alles verkopen want de markt daalt!") en rustig reageert
- een eenvoudig persoonlijk plan maakt dat bij jou past
- je stap voor stap leert wat je moet weten — zonder je te overweldigen

Het is **geen bank en geen adviseur**. Het geeft geen tips als "koop dit aandeel nu".
Het is meer zoals een slimme vriend die toevallig veel van beleggen weet en geduldig antwoord geeft op al jouw vragen.

---

## Hoe is het gebouwd?

Het bestaat uit verschillende lagen, zoals een taart:

### 🍰 Laag 1 — De buitenkant (wat je ziet)
Een **website** gemaakt met Next.js — dat is een moderne manier om webpagina's te bouwen.
Hier vul je je profiel in, stel je vragen, en zie je je beleggingsplan.
Alles in het Nederlands, met eenvoudige taal.

### 🍰 Laag 2 — De logica (wat er achter de schermen gebeurt)
Een **API** gemaakt met FastAPI (Python). Dit is het brein van de applicatie.
Het ontvangt jouw vraag, verwerkt die, en stuurt een antwoord terug.
Het bewaart ook je profiel, je voortgang en je plan in een database.

### 🍰 Laag 3 — De AI (het slimme gedeelte)
Hier wordt het interessant. De app gebruikt **lokale AI-modellen** — dat wil zeggen:
de kunstmatige intelligentie draait op de eigen computer of server, **niet bij OpenAI of Google**.

Dit doet het via een systeem genaamd **Ollama**, met twee modellen:
- **Llama 3** — goed in gesprekken en coaching (gemaakt door Meta)
- **Mistral** — goed in analyses en plannen maken (Frans AI-bedrijf)

---

## De AI-assistenten van dit project

Er zijn **4 virtuele assistenten** ingebouwd, elk met hun eigen persoonlijkheid en taak:

### 🧠 De Gedragscoach
*Model: Llama 3*

De gedragscoach helpt je omgaan met de emoties rondom beleggen.
Beleggen is namelijk voor 80% psychologie. Mensen verkopen in paniek als de markt daalt,
of kopen impulsief als iets "hot" is op het nieuws.

De gedragscoach stelt je reflectievragen zoals:
- *"Wat was er vandaag in het nieuws dat je aan het twijfelen brengt?"*
- *"Op een schaal van 1 tot 10, hoe gespannen voel je je over je beleggingen?"*
- *"Stel dat je belegging 20% daalt — wat doe je dan?"*

En hij reageert altijd rustig, begripvol en zonder oordeel.

### 📊 De ETF Adviseur
*Model: Mistral*

ETFs zijn een soort mandje van aandelen — een eenvoudige manier om te beleggen
zonder dat je zelf aandelen hoeft te kiezen.

De ETF Adviseur legt uit wat een specifieke ETF inhoudt, in gewone taal.
Niet: *"Deze ETF heeft een TER van 0.07% en repliceert de MSCI World index synthetisch."*
Maar: *"Dit mandje bevat stukjes van 1.500 grote bedrijven wereldwijd — van Apple tot Toyota.
Voor elke 1000 euro betaal je 70 cent per jaar aan kosten. Dat is heel laag."*

### 📚 De Leer Assistent
*Model: Llama 3*

De leer assistent legt beleggingsconcepten uit zoals een goede leraar dat zou doen.
Geen Wikipedia-tekst, maar uitleg aangepast aan jouw ervaringsniveau.

Vraag hem bijvoorbeeld:
- *"Wat is het verschil tussen een ETF en een aandeel?"*
- *"Wat betekent 'diversificatie'?"*
- *"Waarom zeggen mensen 'beleg voor de lange termijn'?"*

Hij past zijn uitleg aan op of je beginner, gevorderd of ergens tussenin bent.

### 📝 De Plan Generator
*Model: Mistral*

Op basis van jouw profiel — hoeveel je per maand kan inleggen, hoe lang je wil beleggen,
wat je doel is — maakt de plan generator een **educatief beleggingsplan**.

Dat ziet er zo uit:
- *"Als je €150 per maand inlegt in een wereldwijde ETF, kan je na 20 jaar
  op basis van historische rendementen uitkomen op ongeveer €80.000 à €100.000."*
- *"Let op: dit is geen garantie. Het is een illustratie om je te helpen begrijpen
  wat langetermijnbeleggen kan betekenen."*

Altijd met een eerlijke disclaimer. Geen valse beloftes.

---

## Hoe praten de assistenten met je?

Via gewone chat, zoals WhatsApp. Je typt een vraag, de assistent antwoordt.

Wat uniek is: **alle AI draait lokaal**. Jouw gesprekken gaan niet naar een Amerikaanse server.
Je data blijft bij jou. Dat is bewust gekozen, ook voor privacy.

---

## De "onzichtbare" assistenten: voor de ontwikkelaars

Naast de vier zichtbare AI-assistenten (voor gebruikers) zijn er ook **17 onzichtbare assistenten**
die de ontwikkelaar helpen bij het bouwen van de app zelf.

Denk aan:
- Een architect die helpt nadenken over hoe de app opgebouwd moet worden
- Een code reviewer die nieuwe code controleert op fouten
- Een veiligheidsexpert die checkt of er geen beveiligingsproblemen zijn
- Een juridisch assistent die checkt of de app niet per ongeluk financieel advies geeft

Deze werken samen met **GitHub Copilot** — een AI-assistent voor programmeurs.

---

## Waarom is dit project bijzonder?

### 1. Het democratiseert kennis
Beleggen werd lang gezien als iets voor rijke mensen of mensen met een financiële opleiding.
Dit project wil dat veranderen: iedereen verdient toegang tot begrijpelijke, eerlijke informatie.

### 2. Het respecteert je intelligentie
De app legt dingen uit, maar neemt geen beslissingen voor je.
Het vertrouwt erop dat jij, met de juiste kennis, zelf een goede keuze kan maken.

### 3. Het is eerlijk over de grenzen
De app zegt nooit "koop dit". Het zegt altijd "dit kán passen bij jouw profiel, omdat...".
Elk stukje informatie over winst heeft ook een zin over risico ernaast.

### 4. De AI is privacyvriendelijk
Alles draait lokaal. Jouw financiële vragen gaan niet naar een commercieel platform.

---

## De technische kant in één oogopslag

| Onderdeel | Wat het is | Vergelijking |
|-----------|------------|--------------|
| **Next.js** | Website framework | Het "huis" dat je ziet |
| **FastAPI** | Backend server | De keuken waar alles gemaakt wordt |
| **PostgreSQL** | Database | Het geheugen van de app |
| **Ollama** | Lokale AI runtime | De motor van de assistenten |
| **Llama 3** | AI-model van Meta | De "hersenen" voor coaching |
| **Mistral** | AI-model uit Frankrijk | De "hersenen" voor analyses |
| **Docker** | Containerisatie | Een doos die alles netjes bij elkaar houdt |

---

## Wat kan jij hiermee?

Als je dit project inspirerend vindt, zijn er een paar dingen je kunt doen:

1. **Ideeën geven** — Wat zou jij willen vragen aan zo'n beleggingscoach?
   Jouw perspectief als niet-technische gebruiker is goud waard.

2. **Tekst reviewen** — Is de taal begrijpelijk? Is een uitleg duidelijk?
   De beste test is: begrijp jij het zonder uitleg?

3. **Functies bedenken** — Wat mist er? Een quiz over beleggingsbegrippen?
   Een oefensimulatie zonder echt geld? Een wekelijkse vraag van de dag?

4. **Zelf iets bouwen** — Dit project is open-source en de structuur is herbruikbaar.
   Dezelfde aanpak werkt voor: een gezondheidscoach, een studie-assistent, een budgetplanner...

---

## Tot slot

Dit project is gebouwd met één gedachte voorop:
**technologie moet mensen empoweren, niet overweldigen.**

Als een beginner na één gesprek met de app beter begrijpt wat een ETF is
en zich iets minder angstig voelt om te beginnen — dan heeft het zijn doel bereikt.

---

*Vragen? Ideeën? Gewoon nieuwsgierig? Vraag maar! 😊*