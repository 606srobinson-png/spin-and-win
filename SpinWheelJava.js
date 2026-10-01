const sectors = [
    { label: "Try Again", color: "#b91c1c", weight: 40, isWin: false, textColor: "#ffffff" }, // Hits most often
    { label: "10% OFF", color: "#0284c7", weight: 25, isWin: true, textColor: "#ffffff" },  // Very common win
    { label: "20% OFF", color: "#16a34a", weight: 20, isWin: true, textColor: "#ffffff" },  // Common win
    { label: "30% OFF", color: "#7c3aed", weight: 10, isWin: true, textColor: "#ffffff" },  // Occasional
    { label: "40% OFF", color: "#ea580c", weight: 4, isWin: true, textColor: "#ffffff" },   // Rare
    { label: "50% OFF", color: "#ca8a04", weight: 1, isWin: true, textColor: "#ffffff" }    // Extremely rare (1% chance)
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const totalWeight = sectors.reduce((sum, sector) => sum + sector.weight, 0);

let currentTotalRotation = 0;
let isSpinning = false;
let tickInterval = null;

// --- LOCAL AUDIO FILES SETUP (Win & Lose unchanged) ---
const winSound = new Audio("freesound_community-woo-hoo-82843.mp3");
const loseSound = new Audio("universfield-sad-trumpet-278822.mp3");

// Preload audio files
winSound.load();
loseSound.load();

// Web Audio API context for reliable, crisp mechanical ticking sound
let audioCtx = null;

function playTickSound() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch(e) {}
}

window.onload = function() {
    drawWheel();
    
    // ==========================================
    // REMOVE THE "//" BELOW TO TURN ON ONE-TIME LOCK:
    // ==========================================
    // const lastSpinDate = localStorage.getItem("lastSpinDate");
    // const todayStr = new Date().toDateString();
    // if (lastSpinDate === todayStr) {
    //     const spinBtn = document.getElementById("spin-btn");
    //     if (spinBtn) {
    //         spinBtn.disabled = true;
    //         spinBtn.innerText = "ALREADY SPUN TODAY";
    //     }
    // }
};

function drawWheel() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth || canvas.width || 350;
    const displayHeight = canvas.clientHeight || canvas.height || 350;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    ctx.scale(dpr, dpr);

    const center = displayWidth / 2;
    const radius = center;
    const arc = (2 * Math.PI) / sectors.length;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    sectors.forEach((sector, i) => {
        const startAngle = i * arc;
        const endAngle = (i + 1) * arc;

        // Draw Wedge Slice
        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.lineTo(center, center);
        ctx.fillStyle = sector.color;
        ctx.fill();
        
        // Premium subtle slice borders
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // --- PERFECTLY CENTERED RICH FONT RENDERING ---
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + arc / 2);
        
        // Set alignment to center so text is perfectly balanced within the wedge
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Bold, corporate, rich font styling (Clean weight 900)
        ctx.font = "900 14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        
        // Rich deep shadow/glow effect to give text a 3D pop-out look
        ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1.5;

        // Clean dark outline for razor-sharp readability
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        // Placed dead center along the radius axis
        ctx.strokeText(sector.label, radius - 55, 0);

        // Vibrant solid white text fill
        ctx.fillStyle = sector.textColor;
        ctx.fillText(sector.label, radius - 55, 0);

        ctx.restore();
    });
}

function spinWheel() {
    // ==========================================
    // REMOVE THE "//" BELOW TO TURN ON ONE-TIME LOCK:
    // ==========================================
    // const lastSpinDate = localStorage.getItem("lastSpinDate");
    // const todayStr = new Date().toDateString();
    // if (lastSpinDate === todayStr) {
    //     alert("⚠️ You have already spun the wheel today! Come back tomorrow for another chance.");
    //     showHistory();
    //     return;
    // }

    if (isSpinning) return;
    isSpinning = true;
    document.getElementById("spin-btn").disabled = true;

    // --- MOBILE AUDIO UNLOCK FIX (iOS & Android) ---
    [winSound, loseSound].forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(e => {});
    });

    // Pick weighted winner index
    let randomNum = Math.random() * totalWeight;
    let winningIndex = 0;
    for (let i = 0; i < sectors.length; i++) {
        if (randomNum < sectors[i].weight) {
            winningIndex = i;
            break;
        }
        randomNum -= sectors[i].weight;
    }

    const numSectors = sectors.length;
    const degreesPerSector = 360 / numSectors;

    // Perfect dead-center alignment under 12 o'clock pointer arrow
    const sliceCenterFromTop = (winningIndex * degreesPerSector) + (degreesPerSector / 2);
    const targetDeg = (360 - sliceCenterFromTop) - 90;

    const extraSpins = 360 * 10; // 10 full rotations
    const normalizedCurrent = currentTotalRotation % 360;
    const angleDiff = (targetDeg - normalizedCurrent + 360) % 360;

    currentTotalRotation += extraSpins + angleDiff;

    canvas.style.transition = "transform 4.5s cubic-bezier(0.15, 0, 0.12, 1)";
    canvas.style.transform = `rotate(${currentTotalRotation}deg)`;

    // Play synthesized mechanical ticking sound cleanly during spin
    if (tickInterval) clearInterval(tickInterval);
    
    let tickCount = 0;
    const maxTicks = 35;
    tickInterval = setInterval(() => {
        playTickSound();
        tickCount++;
        if (tickCount >= maxTicks) {
            clearInterval(tickInterval);
            tickInterval = null;
        }
    }, 120);

    // Wait for animation to finish (4.5 seconds)
    setTimeout(() => {
        isSpinning = false;
        
        // INSTANTLY KILL THE TICK SOUND LOOP THE MOMENT WHEEL STOPS
        if (tickInterval) {
            clearInterval(tickInterval);
            tickInterval = null;
        }
        
        const winningSector = sectors[winningIndex];
        const nowTimeMS = Date.now();
        const readableTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        localStorage.setItem("lastSpinDate", new Date().toDateString());
        localStorage.setItem("lastPrizeText", winningSector.label);
        localStorage.setItem("lastSpinTimestamp", nowTimeMS);
        localStorage.setItem("lastSpinReadable", readableTime);
        localStorage.setItem("isAWin", winningSector.isWin);

        handleResult(winningSector);
    }, 4500);
}

function handleResult(winningSector) {
    document.getElementById("wheel-section").classList.add("hidden");
    document.getElementById("result-section").classList.remove("hidden");

    if (winningSector.isWin) {
        document.getElementById("win-title").innerText = "🎉 CONGRATULATIONS! 🎉";
        document.getElementById("prize-display").innerText = winningSector.label;
        
        // Play local win voice sound
        winSound.currentTime = 0;
        winSound.play().catch(error => {
            console.log("Win sound error:", error);
        });

        triggerFireworks();
        startCountdown(10 * 60);
        generateSecureCode();
    } else {
        document.getElementById("win-title").innerText = "BETTER LUCK NEXT TIME!";
        document.getElementById("prize-display").innerText = "No Discount";
        
        // Play local lose voice sound
        loseSound.currentTime = 0;
        loseSound.play().catch(error => {
            console.log("Lose sound error:", error);
        });

        document.querySelector(".timer-box").classList.add("hidden");
        document.querySelector(".security-code").classList.add("hidden");
        document.querySelector(".warning-box").innerHTML = "<p>Thanks for playing! Refresh the page to test again.</p>";
    }
}

function showHistory() {
    const historyBox = document.getElementById("history-box");
    historyBox.classList.toggle("hidden");
    
    const savedPrize = localStorage.getItem("lastPrizeText") || "No spin recorded yet";
    const savedTimeMS = parseInt(localStorage.getItem("lastSpinTimestamp")) || 0;
    const readableTime = localStorage.getItem("lastSpinReadable") || "--:--";
    const isAWin = localStorage.getItem("isAWin") === "true";

    document.getElementById("history-prize").innerText = savedPrize;
    document.getElementById("history-time").innerText = "Time: " + readableTime;

    const statusEl = document.getElementById("history-status");

    if (!savedTimeMS) {
        statusEl.innerHTML = "ℹ️ No recent spin found on this device.";
        statusEl.style.color = "#fde047";
        return;
    }

    const currentTimeMS = Date.now();
    const elapsedMinutes = (currentTimeMS - savedTimeMS) / (1000 * 60);

    if (!isAWin || savedPrize === "Try Again") {
        statusEl.innerHTML = "❌ Last spin did not win a discount.";
        statusEl.style.color = "#f87171";
    } else if (elapsedMinutes > 10) {
        statusEl.innerHTML = "❌ <strong>EXPIRED:</strong> 10+ minutes have passed. Void.";
        statusEl.style.color = "#f87171";
    } else {
        const remainingMin = Math.ceil(10 - elapsedMinutes);
        // Added tobacco exclusion disclaimer directly into the validation box view
        statusEl.innerHTML = `✅ <strong>VALID:</strong> Show cashier! (~${remainingMin} mins left)<br><small style="color:#fde047; font-size:11px;">*Excludes cigarettes, cigars, & tobacco products.</small>`;
        statusEl.style.color = "#4ade80";
    }
}

function triggerFireworks() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

function startCountdown(duration) {
    let timer = duration;
    const display = document.getElementById("countdown");

    const interval = setInterval(() => {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(interval);
            display.textContent = "EXPIRED";
            document.getElementById("prize-display").style.color = "#71717a";
            document.querySelector(".warning-box").innerHTML = "<p style='color:#f87171;'>❌ <strong>EXPIRED:</strong> Timer hit zero. Discount is voided.</p>";
        }
    }, 1000);
}

function generateSecureCode() {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    document.getElementById("live-code").innerText = "STORE-" + randomCode;
}