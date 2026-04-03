const symbols = ["🍒", "🍋", "🔔", "💎", "7️⃣"];
const spinBtn = document.getElementById("spin-btn");
const quitBtn = document.getElementById("quit-btn");
const resultMsgElement = document.getElementById("result-msg");
const bonusMsgElement = document.getElementById("bonus-msg"); 
const betInput = document.getElementById("bet-input"); 

const reelElements = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
];

// Quit Game Logic
quitBtn.addEventListener("click", () => {
    alert("Thanks for playing! Your stats have been recorded.");
    // Reloading the page resets the Flask memory state since we hit the '/' route
    window.location.reload(); 
});

// Real-time validation for Bet Input
betInput.addEventListener("input", () => {
    const betAmount = parseInt(betInput.value);
    const currentBalance = parseInt(document.getElementById("balance-val").innerText);
    
    // Disable if bet is negative, zero, NaN, or more than balance
    if (betAmount <= 0 || betAmount > currentBalance || isNaN(betAmount)) {
        spinBtn.disabled = true;
    } else {
        spinBtn.disabled = false;
    }
});

spinBtn.addEventListener("click", () => {
    const betAmount = parseInt(betInput.value);

    // 1. UI Prep: Disable button & start animations
    spinBtn.disabled = true;
    spinBtn.innerText = "SPINNING...";
    resultMsgElement.innerText = "Good luck...";
    resultMsgElement.style.color = "#ffffff";
    resultMsgElement.classList.remove("fade-in");
    
    // Clear previous bonus message
    bonusMsgElement.innerText = ""; 
    bonusMsgElement.classList.remove("fade-in");

    // Start reel blur/spin animation
    reelElements.forEach(reel => reel.classList.add("spinning"));
    const spinAnimation = setInterval(() => {
        reelElements.forEach(reel => {
            reel.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        });
    }, 100);

    // 2. Fetch Data from Flask Backend
    fetch('/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet: betAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            clearInterval(spinAnimation);
            reelElements.forEach(reel => reel.classList.remove("spinning"));
            alert(data.error);
            resetButton();
            return;
        }

        // 3. Delay showing results (1.5 seconds)
        setTimeout(() => {
            clearInterval(spinAnimation);
            reelElements.forEach(reel => reel.classList.remove("spinning"));

            // Update Reels
            reelElements[0].innerText = data.reels[0];
            reelElements[1].innerText = data.reels[1];
            reelElements[2].innerText = data.reels[2];

            // Update Result Message
            resultMsgElement.innerText = data.result_msg;
            resultMsgElement.style.color = data.is_win ? "#2ecc71" : "#ff4757"; 
            void resultMsgElement.offsetWidth; // Restart CSS animation
            resultMsgElement.classList.add("fade-in");

            // Display AI Bonus Message if triggered (Cooldown enforced by backend)
            if (data.bonus > 0) {
                bonusMsgElement.innerText = `🎁 AI Action: $${data.bonus} Bonus awarded to retain player!`;
                bonusMsgElement.style.color = "#2ed573"; 
                void bonusMsgElement.offsetWidth;
                bonusMsgElement.classList.add("fade-in");
            }

            // Update Stats
            document.getElementById("spins-val").innerText = data.stats.spins;
            document.getElementById("wins-val").innerText = data.stats.wins;
            document.getElementById("losses-val").innerText = data.stats.losses;
            document.getElementById("balance-val").innerText = data.stats.balance;

            // Update AI Churn Prediction UI
            const riskElement = document.getElementById("churn-risk");
            const probTextElement = document.getElementById("churn-prob-text");
            const progressBar = document.getElementById("churn-bar");

            riskElement.innerText = data.churn_risk;
            probTextElement.innerText = data.churn_prob + "%";
            progressBar.style.width = data.churn_prob + "%";

            // Conditional Colors
            if (data.churn_risk === "High") {
                riskElement.style.color = "#ff4757"; 
                progressBar.style.background = "#ff4757";
            } else {
                riskElement.style.color = "#2ed573"; 
                progressBar.style.background = "#2ed573";
            }

            resetButton();
        }, 1500); 
    })
    .catch(error => {
        console.error('Error during spin:', error);
        clearInterval(spinAnimation);
        resetButton();
    });
});

function resetButton() {
    const currentBalance = parseInt(document.getElementById("balance-val").innerText);
    const betAmount = parseInt(betInput.value);
    
    // Validate if they can afford their current bet before re-enabling
    if (betAmount > 0 && betAmount <= currentBalance && !isNaN(betAmount)) {
        spinBtn.disabled = false;
    } else {
        spinBtn.disabled = true;
    }
    
    spinBtn.innerText = "SPIN";
}