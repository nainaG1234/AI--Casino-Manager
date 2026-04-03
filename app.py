from flask import Flask, render_template, jsonify, request
from model import predict_churn
import random

app = Flask(__name__)

# Global player stats stored in memory
player_stats = {
    "spins": 0,
    "wins": 0,
    "losses": 0,
    "balance": 100,      # Starting balance: $100
    "bonus_cooldown": 0  # Prevents the AI from giving bonuses every single spin
}

SYMBOLS = ["🍒", "🍋", "🔔", "💎", "7️⃣"]

@app.route('/')
def index():
    # Reset stats on page refresh or when "Quit Game" is clicked
    player_stats["spins"] = 0
    player_stats["wins"] = 0
    player_stats["losses"] = 0
    player_stats["balance"] = 100
    player_stats["bonus_cooldown"] = 0
    return render_template('index.html', stats=player_stats)

@app.route('/spin', methods=['POST'])
def spin():
    # 1. Get bet amount from the frontend request
    data = request.get_json()
    bet_amount = int(data.get('bet', 5))

    # 2. Validate input
    if bet_amount <= 0:
        return jsonify({"error": "Bet must be greater than $0!"}), 400
    if player_stats["balance"] < bet_amount:
        return jsonify({"error": "Insufficient balance. Game Over!"}), 400

    # 3. Update stats and deduct bet
    player_stats["balance"] -= bet_amount
    player_stats["spins"] += 1
    
    # Decrease bonus cooldown if it's active
    if player_stats["bonus_cooldown"] > 0:
        player_stats["bonus_cooldown"] -= 1

    # 4. Game Logic: Spin 3 reels
    reels = [random.choice(SYMBOLS) for _ in range(3)]
    is_win = reels[0] == reels[1] == reels[2]

    if is_win:
        win_payout = bet_amount * 10
        player_stats["balance"] += win_payout
        player_stats["wins"] += 1
        result_msg = f"🎉 Jackpot! You Win ${win_payout}!"
    else:
        player_stats["losses"] += 1
        result_msg = f"❌ No match. You lose ${bet_amount}."

    # 5. AI/ML Prediction
    churn_prob = predict_churn(
        player_stats["spins"],
        player_stats["wins"],
        player_stats["losses"],
        player_stats["balance"]
    )
    
    churn_risk = "High" if churn_prob >= 0.5 else "Low"

    # 6. Controlled AI-Based Bonus System
    bonus = 0
    # Give bonus ONLY if churn risk is > 60% AND cooldown is over
    if churn_prob > 0.60 and player_stats["bonus_cooldown"] == 0:
        bonus = random.randint(5, 20)
        player_stats["balance"] += bonus
        player_stats["bonus_cooldown"] = 5  # Must wait 5 spins before another bonus

    # 7. Return JSON response
    return jsonify({
        "reels": reels,
        "is_win": is_win,
        "result_msg": result_msg,
        "stats": player_stats,
        "churn_prob": round(churn_prob * 100, 2),
        "churn_risk": churn_risk,
        "bonus": bonus
    })

if __name__ == '__main__':
    app.run(debug=True)