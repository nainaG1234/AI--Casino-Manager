import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# 1. Generate Dummy Dataset
np.random.seed(42)
n_samples = 1000

# Features
spins = np.random.randint(1, 100, n_samples)
wins = np.random.randint(0, 30, n_samples)
losses = spins - wins
# Rough balance calculation (start with 100, win 50, spin costs 5)
balance = 100 + (wins * 50) - (spins * 5) 

# Target: Player is likely to "churn" (quit) if balance is low or they have many losses
churn = np.where((balance < 20) | (losses > (wins * 3 + 15)), 1, 0)

df = pd.DataFrame({
    'spins': spins, 
    'wins': wins, 
    'losses': losses, 
    'balance': balance, 
    'churn': churn
})

# 2. Train-Test Split
X = df[['spins', 'wins', 'losses', 'balance']]
y = df['churn']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train Random Forest Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Calculate and print accuracy to the console
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ AI Model trained successfully with Accuracy: {accuracy * 100:.2f}%")

# 4. Prediction Function
def predict_churn(spins, wins, losses, balance):
    """Returns the probability of a player churning (0.0 to 1.0)"""
    # Use DataFrame to avoid scikit-learn feature name warnings
    input_data = pd.DataFrame(
        [[spins, wins, losses, balance]], 
        columns=['spins', 'wins', 'losses', 'balance']
    )
    # predict_proba returns [[prob_0, prob_1]]
    churn_probability = model.predict_proba(input_data)[0][1] 
    return churn_probability