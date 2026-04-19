"""Tools voor learning-content-mcp."""
from pydantic import BaseModel
from typing import Optional, Literal
from ..data import CONCEPTS

ExperienceLevel = Literal["geen", "basis", "gevorderd"]


class ExplainConceptInput(BaseModel):
    concept: str


class RecommendLearningPathInput(BaseModel):
    experience_level: ExperienceLevel
    goal_type: str


class GenerateQuizInput(BaseModel):
    concept: str


class SummarizeConceptInput(BaseModel):
    concept: str
    context: Optional[str] = None


_LEARNING_PATHS: dict[str, list[str]] = {
    "geen": [
        "etf",
        "index",
        "diversificatie",
        "ter",
        "volatiliteit",
        "dollar_cost_averaging",
        "rendement",
    ],
    "basis": [
        "rendement",
        "volatiliteit",
        "obligatie",
        "rebalancing",
        "dividenden",
        "dollar_cost_averaging",
        "ter",
    ],
    "gevorderd": [
        "rebalancing",
        "dividenden",
        "obligatie",
        "volatiliteit",
        "ter",
        "dollar_cost_averaging",
        "rendement",
    ],
}

_PATH_REASONS: dict[str, str] = {
    "etf": "De basis van goedkoop en gespreid beleggen.",
    "index": "Begrijp wat een ETF precies volgt.",
    "diversificatie": "Leer waarom spreiding zo belangrijk is voor risicobeheer.",
    "ter": "Ken de kosten van jouw beleggingen — ook kleine verschillen tellen op.",
    "volatiliteit": "Begrijp koersschommelingen zodat je rustig blijft tijdens dalingen.",
    "dollar_cost_averaging": "Leer hoe je emotioneel neutraal en systematisch belegt.",
    "rendement": "Begrijp hoe je jouw resultaten meet en interpreteert.",
    "obligatie": "Leer hoe obligaties werken als buffer in jouw portefeuille.",
    "rebalancing": "Houd jouw doelstelling op koers met periodieke aanpassingen.",
    "dividenden": "Leer het verschil tussen accumulerende en distribuerende ETFs.",
}

_QUIZ_DATA: dict[str, list[dict]] = {
    "etf": [
        {
            "question": "Wat is een ETF?",
            "options": [
                "Een lening aan een bedrijf",
                "Een mandje van aandelen of obligaties dat je op de beurs kunt kopen",
                "Een spaarrekening bij de bank",
                "Een valuta voor internationale handel",
            ],
            "correct_index": 1,
            "explanation": "Een ETF (Exchange Traded Fund) bundelt vele effecten in één product dat op de beurs verhandeld wordt.",
        },
        {
            "question": "Wat is een voordeel van beleggen in een ETF?",
            "options": [
                "Je bent altijd zeker van winst",
                "Je spreidt automatisch over veel bedrijven tegelijk",
                "Je hoeft geen rekening te houden met kosten",
                "De overheid garandeert jouw inleg",
            ],
            "correct_index": 1,
            "explanation": "Met één ETF beleg je gelijktijdig in honderden of zelfs duizenden bedrijven — ideale spreiding.",
        },
        {
            "question": "Hoe verschilt een accumulerende ETF van een distribuerende ETF?",
            "options": [
                "Een accumulerende ETF heeft hogere kosten",
                "Een distribuerende ETF herbelegt dividenden automatisch",
                "Een accumulerende ETF herbelegt dividenden automatisch in plaats van ze uit te betalen",
                "Er is geen verschil",
            ],
            "correct_index": 2,
            "explanation": "Bij een accumulerende ETF worden ontvangen dividenden automatisch herbelegd, wat het samengesteld rendement vergroot.",
        },
    ],
    "diversificatie": [
        {
            "question": "Wat betekent diversificatie bij beleggen?",
            "options": [
                "Zo snel mogelijk beleggen",
                "Je geld spreiden over meerdere beleggingen om risico te verlagen",
                "Enkel beleggen in veilige obligaties",
                "Dagelijks je portefeuille aanpassen",
            ],
            "correct_index": 1,
            "explanation": "Door te spreiden over bedrijven, sectoren en landen verklein je het risico dat één tegenvaller je hele portefeuille schaadt.",
        },
        {
            "question": "Wat is het risico van beleggen in slechts één bedrijf?",
            "options": [
                "Je mist de kans op hoog rendement",
                "Je kunt al je geld verliezen als dat bedrijf failliet gaat",
                "Je betaalt meer belastingen",
                "De ETF kost meer",
            ],
            "correct_index": 1,
            "explanation": "Concentratie in één bedrijf maakt je volledig afhankelijk van dat bedrijf. Als het misloopt, is jouw verlies maximaal.",
        },
        {
            "question": "Welke ETF is het best gediversifieerd?",
            "options": [
                "Een ETF met 5 aandelen uit één land",
                "Een ETF met 500 aandelen uit één sector",
                "Een ETF met 1500 aandelen uit 23 landen en verschillende sectoren",
                "Een ETF die enkel in grondstoffen belegt",
            ],
            "correct_index": 2,
            "explanation": "Brede spreiding over landen én sectoren geeft de beste bescherming tegen geconcentreerd risico.",
        },
    ],
    "volatiliteit": [
        {
            "question": "Wat betekent een hoge volatiliteit?",
            "options": [
                "De ETF heeft hoge jaarlijkse kosten",
                "De koers schommelt sterk — grote ups en downs zijn normaal",
                "De ETF betaalt veel dividenden",
                "De ETF volgt een brede index",
            ],
            "correct_index": 1,
            "explanation": "Volatiliteit meet de mate van koersschommelingen. Hoge volatiliteit = meer risico op korte termijn, maar ook potentieel meer rendement.",
        },
        {
            "question": "Welk type ETF heeft doorgaans de laagste volatiliteit?",
            "options": [
                "Aandelen-ETF gericht op groeilanden",
                "Technologie-ETF",
                "Obligatie-ETF met kortlopende staatsobligaties",
                "Cryptocurrency-ETF",
            ],
            "correct_index": 2,
            "explanation": "Kortlopende staatsobligaties zijn stabiele schuldinstrumenten — hun koers schommelt weinig.",
        },
        {
            "question": "Wat is de beste manier om met volatiliteit om te gaan als langetermijnbelegger?",
            "options": [
                "Verkopen zodra de koers daalt",
                "Niets doen en vertrouwen op jouw langetermijnplan",
                "Meer kopen van de meest volatiele ETFs",
                "Overstappen naar een andere strategie elke maand",
            ],
            "correct_index": 1,
            "explanation": "Dalende koersen zijn normaal en tijdelijk voor geduldige langetermijnbeleggers. Paniekverkopen lock je verliezen vast.",
        },
    ],
    "rendement": [
        {
            "question": "Hoe bereken je het rendement van een belegging?",
            "options": [
                "(Eindwaarde - Beginwaarde) / Beginwaarde × 100",
                "Eindwaarde × Beginwaarde / 100",
                "Beginwaarde - Eindwaarde",
                "Eindwaarde / 12",
            ],
            "correct_index": 0,
            "explanation": "Rendement = (winst of verlies) gedeeld door de inleg, uitgedrukt als percentage.",
        },
        {
            "question": "Wat is samengesteld rendement?",
            "options": [
                "Rente die je alleen op de oorspronkelijke inleg verdient",
                "Rente die je verdient op zowel de inleg als de eerder verdiende rente",
                "Een vaste jaarlijkse uitkering van de ETF",
                "Het gemiddelde rendement van alle ETFs in jouw portefeuille",
            ],
            "correct_index": 1,
            "explanation": "Bij samengesteld rendement verdien je rente op rente — dit effect versterkt zich sterk over de jaren.",
        },
        {
            "question": "Welke factor verlaagt jouw netto rendement het meest op lange termijn?",
            "options": [
                "Hoge TER (jaarlijkse kosten)",
                "Kleur van de ETF-verpakking",
                "Het land van de beursnoteringen",
                "Het aantal aandelen in de ETF",
            ],
            "correct_index": 0,
            "explanation": "Een hoge TER vreet elk jaar aan jouw rendement — over 20-30 jaar kan het verschil tussen 0,1% en 1,0% TER tienduizenden euro's kosten.",
        },
    ],
    "dollar_cost_averaging": [
        {
            "question": "Wat houdt periodiek beleggen (dollar cost averaging) in?",
            "options": [
                "Eenmalig een groot bedrag beleggen",
                "Elke maand een vast bedrag beleggen ongeacht de koers",
                "Alleen kopen als de koers gedaald is",
                "Alleen kopen als de koers gestegen is",
            ],
            "correct_index": 1,
            "explanation": "Door maandelijks een vast bedrag te beleggen koop je automatisch meer als het goedkoop is en minder als het duur is.",
        },
        {
            "question": "Wat is een voordeel van periodiek beleggen?",
            "options": [
                "Je vermijdt alle verliezen",
                "Je hoeft de markt niet te timen",
                "Je verdient altijd meer dan bij eenmalig beleggen",
                "Je betaalt geen transactiekosten",
            ],
            "correct_index": 1,
            "explanation": "Niemand kan de markt perfect timen. Door periodiek te beleggen verwijder je die druk en emotie.",
        },
        {
            "question": "Je belegt €100 per maand. De koers is €50 in januari en €25 in februari. Hoeveel eenheden koop je in totaal?",
            "options": [
                "2 eenheden",
                "4 eenheden",
                "6 eenheden",
                "8 eenheden",
            ],
            "correct_index": 2,
            "explanation": "In januari: €100 / €50 = 2 eenheden. In februari: €100 / €25 = 4 eenheden. Totaal: 6 eenheden.",
        },
    ],
    "ter": [
        {
            "question": "Wat betekent TER?",
            "options": [
                "Total Equity Ratio",
                "Tax Exempt Return",
                "Total Expense Ratio",
                "Trade Execution Rate",
            ],
            "correct_index": 2,
            "explanation": "TER staat voor Total Expense Ratio — de jaarlijkse beheerkost van een ETF als percentage van je belegde bedrag.",
        },
        {
            "question": "Een ETF heeft een TER van 0,20%. Hoeveel betaal je per jaar voor €5.000 belegd?",
            "options": ["€0,20", "€2", "€10", "€20"],
            "correct_index": 2,
            "explanation": "€5.000 × 0,20% = €10 per jaar. Die kost wordt automatisch verrekend in de koers.",
        },
        {
            "question": "Waarom is een lage TER belangrijk voor langetermijnbeleggers?",
            "options": [
                "Goedkopere ETFs presteren altijd beter",
                "Kosten verlagen elk jaar jouw netto rendement en stapelen zich op over de tijd",
                "ETFs met lage TER hebben minder risico",
                "De overheid subsidieert ETFs met lage TER",
            ],
            "correct_index": 1,
            "explanation": "Kosten zijn het enige dat je zeker betaalt. Over 30 jaar kan een TER-verschil van 0,5% tienduizenden euro's schelen.",
        },
    ],
    "obligatie": [
        {
            "question": "Wat is een obligatie?",
            "options": [
                "Een aandeel in een bedrijf",
                "Een lening die je verstrekt aan een bedrijf of overheid",
                "Een spaarrekening met variabele rente",
                "Een ETF die grondstoffen volgt",
            ],
            "correct_index": 1,
            "explanation": "Bij een obligatie leen jij geld aan een uitgevende partij. Die betaalt jou rente en geeft je geld terug aan het einde van de looptijd.",
        },
        {
            "question": "Waarom dalen obligatiekoersen als rentes stijgen?",
            "options": [
                "Bedrijven gaan dan vaker failliet",
                "Bestaande obligaties met lage rente worden minder aantrekkelijk vergeleken met nieuwe obligaties",
                "De overheid verhoogt dan de belasting op obligaties",
                "Obligaties zijn dan tijdelijk niet verhandelbaar",
            ],
            "correct_index": 1,
            "explanation": "Als nieuwe obligaties meer rente bieden, daalt de marktwaarde van bestaande obligaties met lagere rente.",
        },
        {
            "question": "Wat is de rol van obligaties in een gespreide portefeuille?",
            "options": [
                "Maximale groei realiseren",
                "Volatiliteit verminderen en stabiliteit toevoegen",
                "Belastingen vermijden",
                "Dividenden uitkeren",
            ],
            "correct_index": 1,
            "explanation": "Obligaties bewegen vaak anders dan aandelen en dempen daardoor de schommelingen in een gemengde portefeuille.",
        },
    ],
    "rebalancing": [
        {
            "question": "Wat is herbalanceren?",
            "options": [
                "Dagelijks kopen en verkopen",
                "Je portefeuille terugbrengen naar je gewenste verdeling na koersschommelingen",
                "Overstappen naar een andere broker",
                "Winst nemen als de markt stijgt",
            ],
            "correct_index": 1,
            "explanation": "Door koersbewegingen wijkt je portefeuille af van je doelalocatie. Herbalanceren herstelt die verdeling.",
        },
        {
            "question": "Hoe vaak herbalanceren de meeste beginners best?",
            "options": [
                "Dagelijks",
                "Wekelijks",
                "Eén à twee keer per jaar",
                "Nooit",
            ],
            "correct_index": 2,
            "explanation": "Te vaak herbalanceren kost transactiekosten. Eén à twee keer per jaar is voldoende voor de meeste langetermijnbeleggers.",
        },
        {
            "question": "Je startte met 80% aandelen / 20% obligaties. Na een goed beursjaar zijn aandelen 90% geworden. Wat doe je?",
            "options": [
                "Niets — aandelen stijgen toch altijd",
                "Alles verkopen",
                "Obligaties bijkopen of aandelen verkopen om terug op 80/20 te komen",
                "Overstappen naar 100% aandelen",
            ],
            "correct_index": 2,
            "explanation": "Herbalanceren brengt je terug naar je risicoprofiel. Je verkoopt relatief duur (aandelen) en koopt relatief goedkoop (obligaties).",
        },
    ],
    "dividenden": [
        {
            "question": "Wat zijn dividenden?",
            "options": [
                "Jaarlijkse kosten van een ETF",
                "Winstuitkeringen van bedrijven aan hun aandeelhouders",
                "Belastingen op beleggingswinsten",
                "De dagelijkse koerswijziging van een ETF",
            ],
            "correct_index": 1,
            "explanation": "Bedrijven die winst maken kunnen een deel uitkeren aan aandeelhouders — dat zijn dividenden.",
        },
        {
            "question": "Wat doet een accumulerende ETF met ontvangen dividenden?",
            "options": [
                "Uitbetalen aan de belegger",
                "Bewaren als cash",
                "Automatisch herbeleggen in de ETF",
                "Doneren aan goede doelen",
            ],
            "correct_index": 2,
            "explanation": "Een accumulerende ETF herbelegt dividenden automatisch, waardoor het samengesteld rendement maximaal is.",
        },
        {
            "question": "Wat is een nadeel van een distribuerende ETF voor Belgische beleggers?",
            "options": [
                "Je ontvangt geen dividenden",
                "Je betaalt roerende voorheffing op ontvangen dividenden",
                "De ETF heeft altijd hogere kosten",
                "Je kunt hem niet op Euronext kopen",
            ],
            "correct_index": 1,
            "explanation": "In België betaal je 30% roerende voorheffing op dividenden. Bij een accumulerende ETF vermijd je deze directe belastingheffing.",
        },
    ],
    "index": [
        {
            "question": "Wat volgt een indexfonds?",
            "options": [
                "De prestaties van één bedrijf",
                "De samenstelling en prestaties van een beursindex",
                "De rentestand van de centrale bank",
                "De goudprijs",
            ],
            "correct_index": 1,
            "explanation": "Een indexfonds repliceert passief een index zoals de MSCI World of S&P 500 — zonder actieve selectie van aandelen.",
        },
        {
            "question": "Wat is een voordeel van passief indexbeleggen versus actief beheerde fondsen?",
            "options": [
                "Hogere rendementen zijn gegarandeerd",
                "Lagere kosten doordat er geen fondsbeheerder actief handelt",
                "Meer bescherming bij marktdalingen",
                "Betere klantenservice",
            ],
            "correct_index": 1,
            "explanation": "Passieve fondsen hoeven geen dure analisten en fondsbeheerders te betalen — dat maakt ze goedkoper.",
        },
        {
            "question": "Welke index volgt de grootste 500 bedrijven uit de VS?",
            "options": [
                "MSCI World",
                "FTSE All-World",
                "S&P 500",
                "EURO STOXX 50",
            ],
            "correct_index": 2,
            "explanation": "De S&P 500 volgt de 500 grootste beursgenoteerde bedrijven in de Verenigde Staten.",
        },
    ],
}

_COMMON_MISTAKES: dict[str, list[str]] = {
    "etf": [
        "Denken dat een ETF gegarandeerde winst oplevert.",
        "Niet letten op de TER (jaarlijkse kosten).",
        "Verwarring tussen accumulerende en distribuerende ETFs.",
    ],
    "index": [
        "Denken dat een index altijd stijgt.",
        "Eén nationale index aanzien als 'globale spreiding'.",
        "Niet begrijpen dat indices periodiek worden herzien.",
    ],
    "ter": [
        "TER als 'verwaarloosbaar' beschouwen op korte termijn.",
        "Niet vergelijken tussen vergelijkbare ETFs.",
        "Denken dat een hogere TER betere kwaliteit betekent.",
    ],
    "diversificatie": [
        "Denken dat 5 ETFs altijd beter gespreid zijn dan 1.",
        "Geografische spreiding vergeten.",
        "Overmatig complexe portefeuilles opbouwen.",
    ],
    "volatiliteit": [
        "Volatiliteit verwarren met verlies.",
        "Paniekeren bij tijdelijke koersdalingen.",
        "Volatiliteit als enige risicomaatstaf gebruiken.",
    ],
    "rendement": [
        "Rendementen uit het verleden als garantie voor de toekomst zien.",
        "Vergeten dat inflatie het reëel rendement verlaagt.",
        "Korte-termijn rendementen extrapoleren naar de toekomst.",
    ],
    "obligatie": [
        "Denken dat obligaties 100% risicovrij zijn.",
        "Vergeten dat obligatiekoersen dalen als rentes stijgen.",
        "Obligaties overslaan in een lange-termijnportefeuille.",
    ],
    "dividenden": [
        "Vergeten dat dividenden belast worden in België.",
        "Distribuerende ETF kiezen zonder reden.",
        "Dividenden als 'gratis geld' zien.",
    ],
    "rebalancing": [
        "Te vaak herbalanceren en zo veel transactiekosten maken.",
        "Helemaal nooit herbalanceren.",
        "Herbalanceren verwarren met markttiming.",
    ],
    "dollar_cost_averaging": [
        "Stoppen met storten bij een marktdaling — net het omgekeerde van wat je wilt.",
        "Denken dat DCA altijd beter is dan eenmalig beleggen.",
        "Een onregelmatig stortingsritme hanteren.",
    ],
}


async def handle_explain_in_simple_language(arguments: dict) -> dict:
    try:
        data = ExplainConceptInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    key = data.concept.lower().replace("-", "_").replace(" ", "_")
    concept = CONCEPTS.get(key)
    if not concept:
        available = ", ".join(CONCEPTS.keys())
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "CONCEPT_NOT_FOUND",
                "message": f"Concept '{data.concept}' niet gevonden. Beschikbare concepten: {available}.",
            },
        }

    beginner_tip = (
        f"Tip voor beginners: Zodra je '{concept['term']}' begrijpt, "
        f"bekijk dan ook: {', '.join(concept['related_concepts'])}."
    )

    return {
        "success": True,
        "data": {
            **concept,
            "beginner_tip": beginner_tip,
        },
        "error": None,
    }


async def handle_recommend_learning_path(arguments: dict) -> dict:
    try:
        data = RecommendLearningPathInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    path_keys = _LEARNING_PATHS.get(data.experience_level, _LEARNING_PATHS["geen"])

    path = []
    for i, key in enumerate(path_keys, start=1):
        concept = CONCEPTS.get(key, {})
        path.append({
            "order": i,
            "concept": key,
            "term": concept.get("term", key),
            "reason": _PATH_REASONS.get(key, "Essentieel concept voor beginners."),
        })

    estimated_time = len(path) * 8  # ~8 minuten per concept

    return {
        "success": True,
        "data": {
            "experience_level": data.experience_level,
            "goal_type": data.goal_type,
            "path": path,
            "estimated_time_minutes": estimated_time,
            "encouragement": (
                f"Met dit leerpad van {len(path)} concepten leg je een sterke basis "
                "voor zelfstandig en bewust beleggen. Succes!"
            ),
        },
        "error": None,
    }


async def handle_generate_beginner_quiz(arguments: dict) -> dict:
    try:
        data = GenerateQuizInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    key = data.concept.lower().replace("-", "_").replace(" ", "_")
    questions = _QUIZ_DATA.get(key)
    if not questions:
        available = ", ".join(_QUIZ_DATA.keys())
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "CONCEPT_NOT_FOUND",
                "message": f"Geen quiz beschikbaar voor '{data.concept}'. Beschikbare concepten: {available}.",
            },
        }

    return {
        "success": True,
        "data": {
            "concept": key,
            "term": CONCEPTS.get(key, {}).get("term", key),
            "questions": questions,
        },
        "error": None,
    }


async def handle_summarize_investment_concept(arguments: dict) -> dict:
    try:
        data = SummarizeConceptInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    key = data.concept.lower().replace("-", "_").replace(" ", "_")
    concept = CONCEPTS.get(key)
    if not concept:
        available = ", ".join(CONCEPTS.keys())
        return {
            "success": False,
            "data": None,
            "error": {
                "code": "CONCEPT_NOT_FOUND",
                "message": f"Concept '{data.concept}' niet gevonden. Beschikbare concepten: {available}.",
            },
        }

    summary = concept["simple_explanation"]
    if data.context:
        summary += f" In jouw context ({data.context}): {concept['example']}"
    else:
        summary += f" Voorbeeld: {concept['example']}"

    key_takeaways = [
        concept["simple_explanation"],
        f"Voorbeeld uit de praktijk: {concept['example']}",
        f"Verwante concepten om ook te leren: {', '.join(concept['related_concepts'])}.",
    ]

    common_mistakes = _COMMON_MISTAKES.get(key, [
        "Veronderstellingen maken zonder voldoende kennis.",
        "Het concept isoleren van de bredere beleggingsstrategie.",
    ])

    return {
        "success": True,
        "data": {
            "concept": key,
            "term": concept["term"],
            "summary": summary,
            "key_takeaways": key_takeaways,
            "common_mistakes": common_mistakes,
        },
        "error": None,
    }
