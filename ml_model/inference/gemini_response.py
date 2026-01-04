# ml_model/inference/gemini_response.py
import os
from google import genai

# Load API key from environment
API_KEY = os.getenv("GENAI_API_KEY")

if not API_KEY:
    raise ValueError("GENAI_API_KEY environment variable is not set!")

# Initialize the GenAI client
client = genai.Client(api_key=API_KEY)

def get_gemini_response(user_message, intent_response=None, model_name="gemini-2.5-flash"):
    """
    Get a polished response from Gemini (using the current google-genai SDK).
    """

    try:
        if intent_response:
            prompt = f"""
You are Medi-Link, a friendly and professional medical assistant.
Slightly improve the response below so it sounds natural and clear.
Do NOT add introductions like "Of course! Here is..." or extra explanations.
Keep it concise and human-readable.

Original response: "{intent_response}"
User message: "{user_message}"
"""
        else:
            prompt = f"""
You are Medi-Link, a professional and friendly medical assistant.
Answer the user's question clearly and simply. Keep it concise and human-readable.

User message: "{user_message}"
"""

        # Use the SDK’s generate_content method
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )

        # The generated text is in response.text
        reply = response.text.strip() if hasattr(response, "text") else \
            "I'm sorry, I couldn't generate a response at this moment."
        return reply

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return intent_response if intent_response else "I'm sorry, I couldn't generate a response."
