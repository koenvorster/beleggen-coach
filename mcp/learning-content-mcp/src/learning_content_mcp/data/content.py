"""Educatieve beleggingsinhoud voor beginners (in het Nederlands)."""

CONCEPTS: dict[str, dict] = {
    "etf": {
        "term": "ETF (Exchange Traded Fund)",
        "simple_explanation": (
            "Een ETF is een mandje van vele aandelen of obligaties dat je als één product kunt kopen op de beurs. "
            "Je belegt zo in één keer in honderden bedrijven tegelijk."
        ),
        "example": (
            "Stel je koopt een ETF die de wereldwijde aandelenmarkt volgt. "
            "Met €50 koop je dan een klein stukje van meer dan 1500 bedrijven wereldwijd — "
            "van Apple tot Samsung tot Nestlé."
        ),
        "related_concepts": ["index", "diversificatie", "ter"],
    },
    "index": {
        "term": "Beursindex",
        "simple_explanation": (
            "Een beursindex is een 'mand' van aandelen die samen de markt vertegenwoordigen. "
            "De index meet hoe al die aandelen samen presteren."
        ),
        "example": (
            "De MSCI World-index volgt de koersen van meer dan 1500 grote bedrijven uit 23 landen. "
            "Als de index met 5% stijgt, zijn die aandelen samen gemiddeld 5% meer waard geworden."
        ),
        "related_concepts": ["etf", "rendement", "diversificatie"],
    },
    "ter": {
        "term": "TER (Total Expense Ratio)",
        "simple_explanation": (
            "De TER is de jaarlijkse kostprijs van een ETF, uitgedrukt als percentage van je belegde bedrag. "
            "Die kosten worden automatisch verrekend in de koers."
        ),
        "example": (
            "Een ETF met een TER van 0,20% kost je €2 per jaar voor elke €1.000 die je belegt. "
            "Goedkope ETFs hebben een TER van 0,05% tot 0,30%."
        ),
        "related_concepts": ["etf", "rendement"],
    },
    "diversificatie": {
        "term": "Diversificatie",
        "simple_explanation": (
            "Diversificatie betekent je geld spreiden over veel verschillende beleggingen, "
            "zodat een tegenvaller bij één bedrijf of sector niet jouw hele portefeuille schaadt."
        ),
        "example": (
            "Als je enkel in één bedrijf belegt en dat failliet gaat, verlies je alles. "
            "Beleg je in een ETF met 1500 bedrijven, dan heeft het faillissement van één bedrijf "
            "nauwelijks invloed op je totale waarde."
        ),
        "related_concepts": ["etf", "volatiliteit", "rebalancing"],
    },
    "volatiliteit": {
        "term": "Volatiliteit",
        "simple_explanation": (
            "Volatiliteit geeft aan hoe sterk de koers van een belegging schommelt. "
            "Hoge volatiliteit = grote ups en downs; lage volatiliteit = rustigere koersen."
        ),
        "example": (
            "Een aandelenETF kan in een slechte maand 10% dalen en de volgende maand 12% stijgen. "
            "Een obligatie-ETF schommelt veel minder — bijvoorbeeld 1-2% per maand."
        ),
        "related_concepts": ["rendement", "diversificatie", "obligatie"],
    },
    "rendement": {
        "term": "Rendement",
        "simple_explanation": (
            "Rendement is de winst (of het verlies) die je maakt op een belegging, "
            "uitgedrukt als percentage van wat je hebt ingelegd."
        ),
        "example": (
            "Je belegt €1.000 en na een jaar is je belegging €1.080 waard. "
            "Je rendement is dan 8% — €80 winst op €1.000 inleg."
        ),
        "related_concepts": ["volatiliteit", "ter", "dollar_cost_averaging"],
    },
    "obligatie": {
        "term": "Obligatie",
        "simple_explanation": (
            "Een obligatie is een lening aan een bedrijf of overheid. "
            "Jij leent ze geld, zij betalen jou rente, en aan het einde krijg je je geld terug."
        ),
        "example": (
            "De Belgische staat geeft een obligatie uit met 3% rente. "
            "Je belegt €1.000 en ontvangt elk jaar €30 rente. Na 10 jaar krijg je ook je €1.000 terug."
        ),
        "related_concepts": ["diversificatie", "volatiliteit", "rendement"],
    },
    "dividenden": {
        "term": "Dividenden",
        "simple_explanation": (
            "Dividenden zijn winstverdeling die een bedrijf uitkeert aan zijn aandeelhouders. "
            "Als jouw ETF dividenden ontvangt, kunnen die worden uitbetaald of automatisch herbelegd."
        ),
        "example": (
            "Je bezit een ETF die aandelen houdt van bedrijven die dividenden uitkeren. "
            "Als die bedrijven samen €10 per jaar aan dividend betalen per ETF-eenheid, "
            "ontvang jij dat bedrag (bij een distribuerende ETF) of wordt het herbelegd (bij een accumulerende ETF)."
        ),
        "related_concepts": ["etf", "rendement", "rebalancing"],
    },
    "rebalancing": {
        "term": "Herbalanceren (Rebalancing)",
        "simple_explanation": (
            "Herbalanceren betekent je portefeuille periodiek aanpassen zodat de verdeling "
            "overeenkomt met je oorspronkelijke plan, nadat sommige beleggingen meer gestegen zijn dan andere."
        ),
        "example": (
            "Je startte met 80% aandelen en 20% obligaties. "
            "Na een goed beursjaar zijn je aandelen 90% geworden. "
            "Je verkoopt wat aandelen en koopt obligaties bij om terug op 80/20 te komen."
        ),
        "related_concepts": ["diversificatie", "dollar_cost_averaging", "volatiliteit"],
    },
    "dollar_cost_averaging": {
        "term": "Periodiek beleggen (Dollar Cost Averaging)",
        "simple_explanation": (
            "Periodiek beleggen betekent elke maand een vast bedrag beleggen, ongeacht de koers. "
            "Zo koop je automatisch meer wanneer het goedkoop is en minder wanneer het duur is."
        ),
        "example": (
            "Je belegt elke maand €100 in een ETF. "
            "Als de koers laag is (€50 per eenheid) koop je 2 eenheden; "
            "als de koers hoog is (€100 per eenheid) koop je er 1. "
            "Op die manier verlaag je gemiddeld je aankoopprijs over de tijd."
        ),
        "related_concepts": ["rendement", "rebalancing", "volatiliteit"],
    },
}
