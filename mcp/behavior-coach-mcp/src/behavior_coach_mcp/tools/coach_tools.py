"""Tools voor behavior-coach-mcp."""
from ..schemas import (
    DetectFomoInput,
    DetectOvertradingRiskInput,
    GenerateReflectionPromptInput,
    MonthlyCheckinSummaryInput,
)

_FOMO_KEYWORDS = [
    "snel", "nu instappen", "missen", "iedereen", "stijgt", "hype",
    "te laat", "winst", "gemist", "omhoog", "exploderen", "rijkdom",
    "kansen", "vlug", "direct", "meteen",
]

_REFLECTION_QUESTIONS: dict[str, list[str]] = {
    "rustig": [
        "Wat is de reden dat je vandaag wilt beleggen?",
        "Hoe past deze beslissing bij jouw langetermijndoel?",
        "Hoe zou je je voelen als de koers de komende maand daalt met 10%?",
    ],
    "onzeker": [
        "Wat maakt je het meest onzeker op dit moment?",
        "Welke informatie zou jou meer zekerheid geven?",
        "Wat zou een vertrouwde vriend je aanraden in deze situatie?",
    ],
    "bezorgd": [
        "Wat is het ergste scenario dat je vreest, en hoe groot is de kans daarop?",
        "Zijn je zorgen gebaseerd op feiten of op gevoel?",
        "Wat kun je wél controleren in deze situatie?",
    ],
    "enthousiast": [
        "Komt jouw enthousiasme voort uit nieuws, of uit jouw eigen analyse?",
        "Wat zou er moeten gebeuren om jou van mening te doen veranderen?",
        "Belegde je ook in dit idee als niemand anders er over sprak?",
    ],
    "gestresst": [
        "Hoe groot is de invloed van deze belegging op jouw dagelijks leven?",
        "Heb je meer geld belegd dan je je kunt veroorloven om te verliezen?",
        "Welke kleine stap zou de stress vandaag al iets verminderen?",
    ],
}

_COACHING_MESSAGES: dict[str, str] = {
    "rustig": "Je bent in een goede staat om heldere beslissingen te nemen. Neem de tijd om je keuzes goed te overwegen.",
    "onzeker": "Onzekerheid is heel normaal bij beleggen. Kennis en een goed plan helpen om vertrouwen op te bouwen.",
    "bezorgd": "Bezorgdheid laat zien dat je betrokken bent. Probeer je zorgen concreet te benoemen — dat maakt ze kleiner.",
    "enthousiast": "Enthousiasme is een kracht, maar zorg dat het geen haastige beslissingen uitlokt. Adem even diep in.",
    "gestresst": "Stress en beleggen zijn geen goede combinatie. Gun jezelf een moment van rust voordat je actie onderneemt.",
}


async def handle_detect_fomo_pattern(arguments: dict) -> dict:
    try:
        data = DetectFomoInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    message_lower = data.user_message.lower()
    detected_patterns = [kw for kw in _FOMO_KEYWORDS if kw in message_lower]
    fomo_detected = len(detected_patterns) > 0

    if fomo_detected:
        coach_response = (
            "Ik merk dat er wat urgentie in je bericht zit — dat is heel herkenbaar. "
            "De markt geeft ons soms het gevoel dat we iets missen, maar goede beleggingsbeslissingen "
            "nemen we vanuit rust, niet vanuit haast. "
        )
        if data.recent_market_event:
            coach_response += f"De recente marktbeweging rond '{data.recent_market_event}' kan dat gevoel versterken. "
        coach_response += "Wat zegt jouw plan hierover?"
        reflection_question = "Zou je deze beslissing ook nemen als niemand anders erover praatte?"
    else:
        coach_response = (
            "Je bericht klinkt overwogen. Vertrouw op je plan en neem de tijd om eventuele keuzes "
            "goed te doordenken."
        )
        reflection_question = "Sluit deze actie aan bij jouw langetermijndoel?"

    return {
        "success": True,
        "data": {
            "fomo_detected": fomo_detected,
            "patterns": detected_patterns,
            "coach_response": coach_response,
            "reflection_question": reflection_question,
        },
        "error": None,
    }


async def handle_detect_overtrading_risk(arguments: dict) -> dict:
    try:
        data = DetectOvertradingRiskInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    too_many_switches = data.switch_requests_this_month > 2
    switched_too_recently = data.days_since_last_switch is not None and data.days_since_last_switch < 14

    if too_many_switches and switched_too_recently:
        risk_level = "hoog"
        explanation = (
            f"Je hebt deze maand al {data.switch_requests_this_month} wisselverzoeken gedaan "
            f"en je laatste wissel was slechts {data.days_since_last_switch} dagen geleden. "
            "Dit patroon wijst op overhandelen, wat je rendement op lange termijn schaadt door hogere kosten en slechte timing."
        )
        advice = (
            "Overweeg een 'cool-down' periode van minimaal 30 dagen voor je volgende wissel. "
            "Kijk eerst terug naar waarom je jouw huidige plan hebt gekozen."
        )
    elif too_many_switches:
        risk_level = "matig"
        explanation = (
            f"Je hebt deze maand al {data.switch_requests_this_month} wisselverzoeken gedaan. "
            "Meer dan twee aanpassingen per maand kan een teken zijn dat emoties jouw beslissingen sturen."
        )
        advice = (
            "Schrijf je reden op voordat je een wissel maakt en wacht 48 uur. "
            "Klopt de reden dan nog steeds? Dan pas handelen."
        )
    elif switched_too_recently:
        risk_level = "matig"
        explanation = (
            f"Je laatste wissel was {data.days_since_last_switch} dagen geleden. "
            "Zo snel wisselen laat zelden een belegging haar werk doen."
        )
        advice = (
            "Geef je beleggingen de tijd — de meeste strategieën vereisen minstens enkele maanden om te beoordelen."
        )
    else:
        risk_level = "laag"
        explanation = (
            "Op basis van het aantal wisselverzoeken en de tijd since je laatste wissel "
            "is er geen duidelijk teken van overhandelen."
        )
        advice = "Ga zo door. Regelmaat en rust zijn de beste vrienden van een belegger."

    return {
        "success": True,
        "data": {
            "risk_level": risk_level,
            "explanation": explanation,
            "advice": advice,
        },
        "error": None,
    }


async def handle_generate_reflection_prompt(arguments: dict) -> dict:
    try:
        data = GenerateReflectionPromptInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    questions = list(_REFLECTION_QUESTIONS[data.emotional_state])
    if data.trigger:
        questions[0] = f"Je geeft aan dat '{data.trigger}' een rol speelt — wat betekent dat precies voor jou?"

    coaching_message = _COACHING_MESSAGES[data.emotional_state]

    return {
        "success": True,
        "data": {
            "questions": questions,
            "coaching_message": coaching_message,
        },
        "error": None,
    }


async def handle_monthly_checkin_summary(arguments: dict) -> dict:
    try:
        data = MonthlyCheckinSummaryInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    goal_mention = f" richting '{data.plan_goal}'" if data.plan_goal else ""

    if data.invested:
        summary = (
            f"Geweldig — je hebt deze maand weer een stap gezet{goal_mention}. "
            f"Je voelt je {data.emotional_state}, en dat is volkomen begrijpelijk. "
            "Elke maand dat je consequent belegt, bouw je aan een steviger fundament voor de toekomst."
        )
        if data.notes:
            summary += f" Je notitie: '{data.notes}'."
        next_action = "Blijf je maandelijkse inleg plannen en controleer over een maand of je plan nog aansluit bij je doelen."
    else:
        summary = (
            f"Je hebt deze maand (nog) niet belegd{goal_mention}. "
            f"Je voelt je {data.emotional_state} — dat kan een goede reden zijn om even pas op de plaats te maken. "
            "Het is oké om soms een maand over te slaan, zolang je bewust die keuze maakt."
        )
        if data.notes:
            summary += f" Je notitie: '{data.notes}'."
        next_action = (
            "Bekijk wat je tegenhoudt en schrijf het op. "
            "Is het twijfel, gebrek aan kennis, of iets anders? Dan kunnen we dat samen aanpakken."
        )

    encouragement = (
        "Beleggen is een marathon, geen sprint. "
        "Het feit dat je hier bent en nadenkt over je financiële toekomst, is al een overwinning op zich. "
        "Kleine stappen, maand na maand — dát is de sleutel."
    )

    return {
        "success": True,
        "data": {
            "summary": summary,
            "next_action": next_action,
            "encouragement": encouragement,
        },
        "error": None,
    }
