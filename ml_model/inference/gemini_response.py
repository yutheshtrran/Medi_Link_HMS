# ml_model/inference/gemini_response.py
import google.generativeai as genai

# Configure Gemini API key
GEMINI_API_KEY = "AIzaSyD1AD699DbJlveZxo8Qpz-dK13roVqjkEs"
genai.configure(api_key=GEMINI_API_KEY)

def get_gemini_response(user_message, intent_response=None, model_name="models/gemini-2.5-pro"):
    """
    Get a polished response from Gemini.
    
    Parameters:
    - user_message: str, the user's input message
    - intent_response: str, optional, local chatbot response to slightly enhance
    - model_name: str, Gemini model to use
    
    Returns:
    - str: Generated response
    """
    try:
        model = genai.GenerativeModel(model_name)

        if intent_response:
            # Slightly enhance internal intent responses without extra preamble
            prompt = f"""
You are Medi-Link, a friendly and professional medical assistant.
Slightly improve the response below so it sounds natural and clear.
Do NOT add introductions like "Of course! Here is..." or extra explanations.
Keep it concise and human-readable.

Original response: "{intent_response}"
User message: "{user_message}"
"""
        else:
            # Generate a full answer from scratch if intent is not available
            prompt = f"""
You are Medi-Link, a professional and friendly medical assistant.
Answer the user's question clearly and simply. Keep it concise and human-readable.

User message: "{user_message}"
"""

        response = model.generate_content(prompt)
        reply = response.text.strip() if hasattr(response, 'text') and response.text else \
            "I'm sorry, I couldn't generate a response at this moment."
        return reply

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        # Fallback: return intent response if available, else generic message
        return intent_response if intent_response else "I'm sorry, I couldn't generate a response."
