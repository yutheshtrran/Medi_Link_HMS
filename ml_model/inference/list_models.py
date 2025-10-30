import google.generativeai as genai

# Configure your API key
genai.configure(api_key="AIzaSyD1AD699DbJlveZxo8Qpz-dK13roVqjkEs")

# Convert generator to list
models = list(genai.list_models())

# Print the available models
for m in models:
    print(m)
