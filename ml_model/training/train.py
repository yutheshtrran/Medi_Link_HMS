import json
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

# Load intents dataset
with open('data/intents.json') as file:
    data = json.load(file)

texts = []
labels = []

for intent in data['intents']:
    for pattern in intent['patterns']:
        texts.append(pattern)
        labels.append(intent['tag'])

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

clf = LogisticRegression(max_iter=200)
clf.fit(X, labels)

# Save model and vectorizer
with open('../saved-model/model.pkl', 'wb') as f:
    pickle.dump(clf, f)

with open('../saved-model/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("Training complete and model saved.")
