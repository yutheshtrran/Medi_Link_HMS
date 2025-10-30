import json
import pickle
import re
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()

# Preprocessing function
def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)  # remove punctuation
    text = ' '.join([lemmatizer.lemmatize(word) for word in text.split()])
    return text

# Load intents dataset
with open('data/intents.json') as file:
    data = json.load(file)

texts = []
labels = []

for intent in data['intents']:
    for pattern in intent['patterns']:
        texts.append(preprocess(pattern))
        labels.append(intent['tag'])

# Vectorize text
vectorizer = CountVectorizer(ngram_range=(1, 2))
X = vectorizer.fit_transform(texts)

# Train Logistic Regression
clf = LogisticRegression(max_iter=500)
clf.fit(X, labels)

# Save model and vectorizer
with open('../saved-model/model.pkl', 'wb') as f:
    pickle.dump(clf, f)

with open('../saved-model/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("✅ Training complete and model saved.")
