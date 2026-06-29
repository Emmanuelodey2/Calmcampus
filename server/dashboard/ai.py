import json
import os
import re
import urllib.error
import urllib.request


CRISIS_TERMS = [
    "suicide",
    "kill myself",
    "end it all",
    "harm myself",
    "self harm",
    "cut myself",
    "hopeless",
    "can't go on",
    "cant go on",
    "want to die",
]


CRISIS_RESPONSE = (
    "I am really sorry you are carrying this right now. Your safety matters more than continuing this chat. "
    "Please contact a trusted person near you immediately, go to the nearest emergency unit, or call local emergency services. "
    "If you are in Nigeria, you can call 112 for emergency help. While you wait for support, move away from anything you could use to hurt yourself, "
    "put both feet on the floor, name five things you can see, and take slow breaths with someone nearby if possible."
)


def detect_crisis(text):
    normalized = re.sub(r"\s+", " ", (text or "").lower())
    for term in CRISIS_TERMS:
        if term in normalized:
            return term
    return ""


def build_system_prompt(user, moods, journals, counsellor_notes=None):
    mood_context = [
        {
            "mood": mood.mood,
            "intensity": mood.intensity,
            "description": mood.description,
            "created_at": mood.created_at.isoformat(),
        }
        for mood in moods
    ]
    journal_context = [
        {
            "title": journal.title,
            "content": journal.content[:1200],
            "created_at": journal.created_at.isoformat(),
        }
        for journal in journals
    ]
    counsellor_notes_context = [
        {
            "content": note.content,
            "created_at": note.created_at.isoformat(),
        }
        for note in counsellor_notes
    ] if counsellor_notes else []

    return (
        "You are Hermes AI, a compassionate mental health support assistant for Nigerian higher-education students. "
        "You are not a replacement for a counsellor or emergency care. Validate the student's feelings, ask one useful follow-up question when appropriate, "
        "and suggest practical coping steps. Use the student's recent mood and journal history only to personalize support. "
        "Do not diagnose. Encourage human counsellor support when distress appears persistent or severe.\n\n"
        f"Student email: {user.email}\n"
        f"Recent moods: {json.dumps(mood_context)}\n"
        f"Recent journals: {json.dumps(journal_context)}\n"
        f"Counsellor notes/supervision history (use this context to understand guidelines or recommendations set by their therapist/counsellor to personalize responses): {json.dumps(counsellor_notes_context)}"
    )


def generate_student_ai_comments(user, moods, journals, chats):
    mood_context = [
        {
            "mood": mood.mood,
            "intensity": mood.intensity,
            "description": mood.description,
            "created_at": mood.created_at.isoformat(),
        }
        for mood in moods
    ]
    journal_context = [
        {
            "title": journal.title,
            "content": journal.content[:1200],
            "created_at": journal.created_at.isoformat(),
        }
        for journal in journals
    ]
    chat_context = [
        {
            "sender": msg.sender,
            "message": msg.message[:500],
            "created_at": msg.created_at.isoformat(),
        }
        for msg in chats
    ]

    prompt = (
        "You are an expert AI clinical psychologist and assistant. Analyse this student's recent wellness data "
        "and provide professional comments/insights. Keep your comments concise, compassionate, structured, and focused on helping the human counsellor "
        "understand the student's mental state, key concerns, mood trends, and potential issues. Do not diagnose explicitly, but highlight indicators of depression, anxiety, stress, or crisis.\n\n"
        f"Student: {user.email}\n"
        f"Recent moods: {json.dumps(mood_context)}\n"
        f"Recent journals: {json.dumps(journal_context)}\n"
        f"Recent chat session: {json.dumps(chat_context)}\n"
    )

    system_instruction = "You are an AI wellness analysis assistant helping a university counsellor understand a student's mental health."
    return call_gemini(system_instruction, prompt) or "No AI comments generated yet. The AI is still analyzing this student's details."



def fallback_response(message, moods):
    if moods:
        latest = moods[0]
        context = f"I noticed your latest mood was {latest.mood} with intensity {latest.intensity}/10. "
    else:
        context = ""
    return (
        f"{context}Thank you for telling me. It makes sense to want support with this. "
        "Can you tell me what happened most recently, and what part feels hardest to handle right now?"
    )


def call_gemini(system_prompt, message):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return ""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/gemini-2.5-flash:generateContent?key={api_key}"
    )
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": message}]
            }
        ],
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 700,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError):
        return ""

    return (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
        .strip()
    )
