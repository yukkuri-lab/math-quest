/**
 * San-su Quest - Main Game Logic
 * 
 * Target: 1st Grade Students (ASD friendly)
 * Style: Retro RPG (Dragon Quest style)
 */


window.onerror = function (message, source, lineno, colno, error) {
    alert(`Error: ${message}\nLine: ${lineno}\nSource: ${source}`);
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new GameController();
        game.init();
    } catch (e) {
        alert("Init Error: " + e.message);
    }
});

let captured = JSON.parse(localStorage.getItem("capturedUMA") || "[]");

function captureEnemy(enemyId){
    if(!captured.includes(enemyId)){
        captured.push(enemyId);
        localStorage.setItem("capturedUMA", JSON.stringify(captured));
        return true; // 新規登録された場合はtrueを返す
    }
    return false; // 既に登録されている場合はfalseを返す
}

function openEncyclopedia(){
    let html = "<h2 style='text-align: center; margin-bottom: 10px;'>UMAずかん</h2>";
    
    // スクロール可能なコンテナ
    html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 10px; flex: 1; overflow-y: auto;">';

    window.enemyData.forEach(e => {
        let rarity = 1;
        if (e.isBoss || e.id === 'F001' || e.id.startsWith('BOSS')) {
            rarity = 5;
        } else if (e.hp >= 30) {
            rarity = 4;
        } else if (e.hp >= 25) {
            rarity = 3;
        } else if (e.hp >= 20) {
            rarity = 2;
        }
        const stars = "<span style='color: #ffeb3b;'>★</span>".repeat(rarity);

        if(captured.includes(e.id)){
            // 画像がない場合のフォールバック（テキストなど）
            let imageTag = e.image ? `<img src="${e.image}" width="80" style="height: 80px; object-fit: contain;">` : `<div style="font-size: 50px; color: #fff; text-shadow: 2px 2px 0 #000; display: flex; align-items: center; justify-content: center; height: 80px;">？</div>`;
            
            html += `
            <div class="window-frame" style="padding: 10px; width: 140px; text-align: center; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="position: absolute; top: 2px; left: 0px; width: 100%; text-align: center; font-size: 14px; text-shadow: 1px 1px 0 #000; z-index: 10;">${stars}</div>
                <div style="margin-top: 20px; flex: 1; display: flex; justify-content: center; align-items: center;">${imageTag}</div>
                <h3 style="font-size: 14px; margin: 5px 0 0 0; line-height: 1.2;">${e.name}</h3>
                <p style="font-size: 10px; margin-top: 5px; color: #ccc;">${e.description || 'なぞの いきもの'}</p>
            </div>
            `;
        } else {
            // 未発見の場合は絵文字を使わずテキストの「？」を使う
            html += `
            <div class="window-frame" style="padding: 10px; width: 140px; text-align: center; color: #555; position: relative; display: flex; flex-direction: column; justify-content: space-between; border-color: #555; box-shadow: 0 0 0 2px var(--bg-color), 0 0 0 4px #555;">
                <div style="position: absolute; top: 2px; left: 0px; width: 100%; text-align: center; font-size: 14px; opacity: 0.5;">${stars}</div>
                <div style="height: 80px; display: flex; justify-content: center; align-items: center; font-size: 50px; margin-top: 20px; color: #555; font-weight: bold;">？</div>
                <h3 style="font-size: 14px; margin: 5px 0 0 0;">????</h3>
            </div>
            `;
        }
    });

    html += '</div>';
    
    // 固定された「もどる」ボタン
    html += '<div style="text-align: center; margin-top: 15px; padding-bottom: 10px;"><button onclick="document.getElementById(\'encyclopedia-screen\').classList.add(\'hidden\'); document.getElementById(\'title-screen\').classList.remove(\'hidden\');" class="pixel-btn small-btn" style="width: 80%; max-width: 300px; padding: 10px;">もどる</button></div>';

    document.getElementById("encyclopedia-content").innerHTML = html;
}

class GameController {
    constructor() {
        // UI Elements
        this.screens = {
            title: document.getElementById('title-screen'),
            battle: document.getElementById('battle-screen')
        };
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            enemySprite: document.getElementById('enemy-sprite'),
            message: document.getElementById('game-message'),
            questionText: document.getElementById('question-text'),
            answerButtons: document.querySelectorAll('.answer-btn'),
            heroHP: document.querySelector('.hero-stats-box .stat-row:nth-child(1) span:last-child'),
            heroMP: document.querySelector('.hero-stats-box .stat-row:nth-child(2) span:last-child'),
            heroLV: document.querySelector('.hero-stats-box .stat-row:nth-child(3) span:last-child'),
            commandMenu: document.getElementById('command-menu'),
            commandBtns: document.querySelectorAll('.command-btn'),
            questionArea: document.querySelector('.question-area'),
            enemyStats: document.getElementById('enemy-stats'),
            hpGaugeFill: document.getElementById('hp-gauge-fill'),
            battleHeroHP: document.getElementById('battle-hero-hp'),
            battleHeroLV: document.getElementById('battle-hero-lv')
        };

        // Game State
        this.player = {
            hp: 50,
            maxHp: 50,
            mp: 10,
            lv: 1,
            exp: 0
        };
        this.currentEnemy = null;
        this.isBattleActive = false;

        // Sound Effects (Placeholder for now)
        this.sounds = {

        };
        this.bgm = new BGMController();
        this.typingTimeout = null;

        // Debug Sequence State
        const savedIndex = localStorage.getItem('debugSequenceIndex');
        this.debugSequenceIndex = savedIndex ? parseInt(savedIndex, 10) : 0;
        this.debugSequence = [
            // Second Batch of Yokai
            "C017", "C018", "C019", "C021",
            "C022", "O003", "S011", "S014"
        ];

        // Load Save Data
        this.loadGame();

        // Ensure defeatedEnemies is initialized if new game or old save
        if (!this.defeatedEnemies) {
            this.defeatedEnemies = [];
        }
    }

    init() {
        // Global Audio Unlock (Aggressive)
        const unlockAudio = () => {
            this.bgm.unlock();
            // Remove listeners once unlocked
            document.body.removeEventListener('touchend', unlockAudio);
            document.body.removeEventListener('click', unlockAudio);
        };
        document.body.addEventListener('touchend', unlockAudio, { once: true, passive: false });
        document.body.addEventListener('click', unlockAudio, { once: true });

        // Start Button (Click & Touch)
        const startHandler = (e) => {
            // Prevent double firing if both fire
            if (e.cancelable) e.preventDefault();
            this.startGame();
        };
        this.elements.startBtn.addEventListener('click', startHandler);
        this.elements.startBtn.addEventListener('touchstart', startHandler, { passive: false });

        // Attach event listeners to answer buttons
        this.elements.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target));
        });

        // Attach event listeners to command buttons
        this.elements.commandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCommand(e.target.dataset.cmd));
        });

        // Setup Encyclopedia Button
        const encBtn = document.getElementById('enc-btn');
        if (encBtn) {
            encBtn.addEventListener('click', () => {
                this.switchScreen('encyclopedia');
                openEncyclopedia();
            });
            encBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.switchScreen('encyclopedia');
                openEncyclopedia();
            }, { passive: false });
        }

        // Reset Button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }

        // Sound Test Button
        const soundTestBtn = document.getElementById('sound-test-btn');
        if (soundTestBtn) {
            const runTest = () => {
                this.bgm.unlock();

                try {
                    const ctx = this.bgm.audioCtx;
                    // Play both to test
                    this.bgm.playSFX('decision');
                    setTimeout(() => this.bgm.playSFX('pi'), 200);

                    this.updateDebugInfo(`Test: SFX OK (${ctx.state})`);
                } catch (e) {
                    this.updateDebugInfo(`Test: ERR ${e.message}`);
                }
            }

            // ^ Close runTest

            soundTestBtn.addEventListener('click', runTest);
            soundTestBtn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent ghost click
                runTest();
            }, { passive: false });
        }
        // ^ Close if (soundTestBtn)

    }




    updateDebugInfo(msg = "") {
        const debugEl = document.getElementById('debug-info');
        if (debugEl && this.bgm.audioCtx) {
            const ctx = this.bgm.audioCtx;
            debugEl.innerText = `Audio: ${ctx.state} | T:${ctx.currentTime.toFixed(1)} | ${msg}`;
        }
    }

    startGame() {
        // Init Audio Context on user interaction to fix mobile audio
        this.bgm.init();
        this.bgm.unlock(); // Use powerful unlock

        this.switchScreen('battle');
        this.startBattle();

        // Setup BGs if they exist
        document.getElementById('title-screen').style.backgroundImage = "url('assets/title_bg.png')";
        document.getElementById('title-screen').style.backgroundImage = "url('assets/title_bg.png')";
        // document.getElementById('battle-screen').style.backgroundImage = "url('assets/battle_bg.png')"; // User requested simple dark bg
    }

    switchScreen(screenName) {
        Object.values(this.screens).forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });

        // 汎用画面切り替えロジック
        if(this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.screens[screenName].classList.add('active');
        } else {
            // Screensオブジェクトにない場合は直接DOMから探す
            const screenEl = document.getElementById(`${screenName}-screen`);
            if (screenEl) {
                document.querySelectorAll('.screen').forEach(s => {
                    s.classList.add('hidden');
                    s.classList.remove('active');
                });
                screenEl.classList.remove('hidden');
                screenEl.classList.add('active');
            }
        }
    }

    // --- Battle Logic ---

    async startBattle() {
        this.isBattleActive = false; // Disable input

        this.currentEnemy = this.generateEnemy();
        this.updateEnemyDisplay(); // Set enemy data (but we will hide it)

        // Hide Enemy & Interface initially
        this.elements.enemySprite.style.transition = 'none'; // Instant hide
        this.elements.enemySprite.style.opacity = '0';
        this.elements.enemySprite.classList.remove('enemy-defeat'); // Reset animation
        if (this.elements.enemyStats) {
            this.elements.enemyStats.classList.remove('hidden');
            this.elements.enemyStats.style.opacity = '0';
        }
        this.elements.commandMenu.classList.add('hidden');
        if (this.elements.questionArea) this.elements.questionArea.classList.add('hidden');

        // --- DRAMATIC INTRO SEQUENCE (Gacha Style) ---
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // Get Rarity (1 to 5)
        const rarity = this.currentEnemy.rarity || 1;
        const stars = "⭐".repeat(rarity);

        let rarityName = "";
        let flashColor = ""; // CSS box-shadow for gacha feel
        let waitTime = 1000;
        let sfxMode = "footstep_heavy";

        switch(rarity) {
            case 5: 
                rarityName = "レジェンド(LR)"; 
                flashColor = "0 0 40px #ff00ff, 0 0 80px #ff0000"; 
                waitTime = 3000; 
                sfxMode = "win"; 
                break;
            case 4: 
                rarityName = "ウルトラレア(UR)"; 
                flashColor = "0 0 30px #ffaa00, 0 0 60px #ffff00"; 
                waitTime = 2500; 
                sfxMode = "attack"; 
                break;
            case 3: 
                rarityName = "スーパーレア(SSR)"; 
                flashColor = "0 0 25px #ffffff, 0 0 50px #aaaaaa"; 
                waitTime = 2000; 
                sfxMode = "wind_whoosh"; 
                break;
            case 2: 
                rarityName = "レア(SR)"; 
                flashColor = "0 0 20px #00ff00"; 
                waitTime = 1500; 
                sfxMode = "pi"; 
                break;
            default: 
                rarityName = "コモン(R)"; 
                flashColor = "0 0 15px #00aaff"; 
                waitTime = 1000; 
                sfxMode = "footstep_heavy"; 
                break;
        }

        // 1. "......"
        this.logMessage("あやしい けはいが する……");
        await sleep(1000);

        // 2. Gacha Intro Sequence
        this.logMessage("なにが でるかな……？");
        this.playSound(sfxMode);

        // Gacha Flash Effect on Enemy Window
        const enemyWindow = document.getElementById('enemy-window');
        let originalShadow = "";
        if (enemyWindow) {
            originalShadow = enemyWindow.style.boxShadow;
            enemyWindow.style.boxShadow = flashColor;
            enemyWindow.style.transition = "box-shadow 0.2s ease-in";
        }

        if (rarity >= 3) {
            // Screen shake
            document.body.classList.add('camera-shake');
            setTimeout(() => document.body.classList.remove('camera-shake'), 500);
        }
        if (rarity >= 4) {
             await sleep(800);
             this.logMessage("！！！！");
             this.playSound('damage'); // Warning sound
             document.body.classList.add('camera-shake');
             setTimeout(() => document.body.classList.remove('camera-shake'), 800);
        }

        await sleep(waitTime);
        
        if (enemyWindow) {
            enemyWindow.style.boxShadow = originalShadow;
        }

        // 3. Reveal Enemy
        this.logMessage(`${stars} ${rarityName}\n${this.currentEnemy.name} が あらわれた！`);

        // Fade In (Fast)
        this.elements.enemySprite.style.transition = 'opacity 0.2s ease-in';
        void this.elements.enemySprite.offsetWidth; // Trigger reflow
        this.elements.enemySprite.style.opacity = '1';
        if (this.elements.enemyStats) this.elements.enemyStats.style.opacity = '1';

        // Update Name with stars in UI if exists
        const nameEl = document.getElementById('battle-enemy-name');
        if (nameEl) nameEl.innerHTML = `<span style="font-size: 0.6em; color: #ffeb3b">${stars}</span><br>${this.currentEnemy.name}`;

        // Camera Shake Effect
        document.body.classList.add('camera-shake');
        setTimeout(() => document.body.classList.remove('camera-shake'), 500);

        // BGM Start
        if (this.currentEnemy.isBoss || rarity === 5) {
            this.bgm.play('boss');
        } else {
            this.bgm.play('battle');
        }

        this.playSound('pi'); // Alert sound

        // Dramatic Pause before Command Menu (User requested "short dramatic pause")
        await sleep(1000);

        // 6. Start Battle
        this.isBattleActive = true;
        this.showCommandMenu();
    }

    showCommandMenu() {
        console.log("showCommandMenu called"); // Debug log
        if (!this.isBattleActive) {
            console.log("Battle not active, returning");
            return;
        }

        // Force removal of hidden class
        this.elements.commandMenu.classList.remove('hidden');

        // Force display style to ensure visibility against any CSS specificity issues
        this.elements.commandMenu.style.display = 'block';

        // Ensure question area is hidden
        if (this.elements.questionArea) {
            this.elements.questionArea.classList.add('hidden');
            this.elements.questionArea.style.display = 'none';
        }

        this.logMessage("どうする？");
    }

    handleCommand(cmd) {
        this.playSound('pi');
        this.elements.commandMenu.classList.add('hidden');

        if (cmd === 'fight') {
            this.logMessage("えいとくんの こうげき！");
            setTimeout(() => {
                this.startRush();
            }, 1000);
        } else if (cmd === 'run') {
            this.handleRun();
        } else if (cmd === 'spell') {
            this.handleSpell();
        } else if (cmd === 'item') {
            this.handleItem();
        } else if (cmd === 'save') {
            this.saveGame();
            this.playSound('pi');
            this.logMessage("ぼうけんの しょを きろくしました！");
            setTimeout(() => {
                this.elements.commandMenu.classList.remove('hidden');
                this.logMessage("どうする？");
            }, 1500);
        }
    }

    // --- Rush Battle System ---

    startRush() {
        this.isRushMode = true;
        this.rushCount = 0;
        this.rushMax = 5;
        this.rushCorrect = 0;
        // Calculated to defeat Lv1 Enemies (HP 12-20) in ~2 hits
        // Lv1: 10 dmg. Lv10: 28 dmg.
        this.damagePerHit = 8 + (this.player.lv * 2);

        this.nextRushQuestion();
    }

    nextRushQuestion() {
        if (this.rushCount >= this.rushMax) {
            this.endRush();
            return;
        }

        this.rushCount++;
        // Use existing generator
        this.currentProblem = this.generateMathProblem(this.player.lv);

        // Update UI
        this.elements.questionText.textContent = this.currentProblem.question;
        this.setupAnswerButtons(this.currentProblem);

        if (this.elements.questionArea) {
            this.elements.questionArea.classList.remove('hidden');
            this.elements.questionArea.style.display = 'flex';
        }

        this.logMessage(`もんだい ${this.rushCount} / ${this.rushMax}`);
    }

    endRush() {
        this.isRushMode = false;

        if (this.elements.questionArea) {
            this.elements.questionArea.classList.add('hidden');
            this.elements.questionArea.style.display = 'none';
        }

        if (this.currentEnemy.hp <= 0) {
            setTimeout(() => this.winBattle(), 500);
        } else {
            // Enemy survived -> Counter or Turn End
            this.logMessage("こうげき しゅうりょう！");
            setTimeout(() => {
                this.enemyAttack();
            }, 1000);
        }
    }

    handleRun() {
        if (this.currentEnemy.isBoss) {
            this.logMessage("しかし まわりこまれてしまった！");
            setTimeout(() => {
                this.enemyAttack();
            }, 1500);
        } else {
            this.logMessage("えいとくんは にげだした！");
            this.bgm.stop();
            setTimeout(() => {
                this.switchScreen('title');
            }, 1000);
        }
    }

    handleSpell() {
        if (!this.player || this.player.mp < 3) {
            this.logMessage("MPが たりない！");
            this.playSound('miss'); // Use miss sound for error
            this.showCommandMenu(); // Go back
            return;
        }

        // Determine Spell Effect
        // Currently hardcoded "Hoimi" (Heal)
        this.player.mp -= 3;
        const healAmount = Math.floor(Math.random() * 10) + 20; // 20-30
        const oldHp = this.player.hp;
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        const actualHeal = this.player.hp - oldHp;

        this.updatePlayerStats();
        this.logMessage(`ホイミ！ HPが ${actualHeal} かいふくした！`);
        this.playSound('heal'); // Heal sound

        // Turn end
        setTimeout(() => {
            if (this.currentEnemy) { // If battle active
                this.enemyAttack();
            } else {
                // Should not happen in battle usually
            }
        }, 1500);
    }

    handleItem() {
        // Placeholder: Yakusou
        const healAmount = 30;
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        this.updatePlayerStats();
        this.logMessage(`やくそうを つかった！ HPが ${healAmount} かいふくした！`);
        this.playSound('heal');

        setTimeout(() => {
            this.enemyAttack();
        }, 1500);
    }

    generateEnemy() {
        // World Youkai Data (C001-C022, F001)
        const enemies = window.enemyData || [];


        // Boss Battle: King Monkey (Level 1 Last Boss)
        // Trigger: Level 1 and close to Level Up (exp >= 8)
        if (this.player.lv === 1 && this.player.exp >= 8 && !this.lvl1BossDefeated) {
            return {
                id: "BOSS_LV1",
                name: "キング・モンキー",
                emoji: "🦍", // Fallback
                image: "assets/boss_lvl1.png", // User provided image
                hp: 60,
                maxHp: 60,
                exp: 15, // Ensure Level Up
                level: 3, // Stronger attacks
                isBoss: true,
                isLvl1Boss: true
            };
        }

        // Boss Battle: Bigfoot (Forest Master - Final Boss)
        // Trigger: Defeated all Forest Youkai (F002-F009)
        const forestYoukaiIds = ["F002", "F003", "F004", "F005", "F006", "F007", "F008", "F009"];
        const allForestYoukaiDefeated = forestYoukaiIds.every(id => this.defeatedEnemies && this.defeatedEnemies.includes(id));

        if (allForestYoukaiDefeated && !this.forestBossDefeated) {
            return {
                id: "F001",
                name: "森の主 ビッグフット",
                emoji: "🦶",
                hp: 150, // Strengthened for Final Boss
                maxHp: 150,
                exp: 0, // Game Clear
                level: 15,
                isBoss: true,
                encounterType: "beast", // Ensure heavy shake effect
                image: "assets/uma_bigfoot_lastboss.png"
            };
        }

        // Image-based Selection (Registered 47 Yokai)
        // Filter enemies that have an 'image' property
        const validEnemies = enemies.filter(e => e.image);

        // Initialize history if needed
        if (!this.recentEnemyIds) {
            this.recentEnemyIds = [];
        }

        // レベルに応じた出現制限（序盤はいきなり強いレアキャラが出ないようにする）
        let maxHpAllowance = 15; // Lv1: コモン (HP15)
        if (this.player.lv >= 2) maxHpAllowance = 20; // Lv2: レアまで (HP20)
        if (this.player.lv >= 3) maxHpAllowance = 25; // Lv3: スーパーレアまで (HP25)
        if (this.player.lv >= 4) maxHpAllowance = 999; // Lv4以降: すべての敵を解放

        let enemyTemplate;
        let candidates = validEnemies.length > 0 ? validEnemies : enemies;
        
        // レベル制限とボス除外フィルタを適用
        candidates = candidates.filter(e => e.hp <= maxHpAllowance && !e.isBoss && e.id !== 'F001');

        if (candidates.length === 0) {
            // 万が一該当データがなければ全敵から
            candidates = validEnemies.length > 0 ? validEnemies : enemies;
        }

        // Filter out recent enemies
        // We try to exclude the last 4 enemies.
        // If that leaves us with no candidates (or very few), we relax the constraint.
        let filteredCandidates = candidates.filter(e => !this.recentEnemyIds.includes(e.id));

        if (filteredCandidates.length === 0) {
            // If we ran out of new enemies, reset history or just pick from full list
            // Let's just pick from full candidates but maybe still try to avoid the VERY last one
            if (this.recentEnemyIds.length > 0) {
                const lastOne = this.recentEnemyIds[this.recentEnemyIds.length - 1];
                filteredCandidates = candidates.filter(e => e.id !== lastOne);
            } else {
                filteredCandidates = candidates;
            }
        }

        // If still empty (should be rare/impossible unless only 1 enemy exists), fallback
        if (filteredCandidates.length === 0) {
            filteredCandidates = candidates;
        }

        const randomIndex = Math.floor(Math.random() * filteredCandidates.length);
        enemyTemplate = filteredCandidates[randomIndex];

        // Update History
        this.recentEnemyIds.push(enemyTemplate.id);
        if (this.recentEnemyIds.length > 4) {
            this.recentEnemyIds.shift(); // Keep only last 4
        }

        console.log(`[DEBUG] Selected Enemy: ${enemyTemplate.name} (${enemyTemplate.id}) Image: ${enemyTemplate.image}`);

        // Determine Enemy Level (Player LV +/- 1, min 1)
        let enemyLv = this.player.lv + (Math.floor(Math.random() * 3) - 1);
        if (enemyLv < 1) enemyLv = 1;

        // Scale enemy stats based on ITS level
        const scale = 1 + (enemyLv - 1) * 0.15;

        // Handle F009 Image Fix (Removed by user request)
        // let enemyImage = enemyTemplate.image;
        // if (enemyTemplate.id === 'F009' && !enemyImage) {
        //     enemyImage = "assets/uma_humanoid_final_03.jpg";
        // }
        // const enemyImage = enemyTemplate.image; // Use template image directly if no override
        let enemyImage = enemyTemplate.image;

        let rarity = 1;
        if (enemyTemplate.isBoss || enemyTemplate.id === 'F001' || enemyTemplate.id.startsWith('BOSS')) {
            rarity = 5;
        } else if (enemyTemplate.hp >= 30) {
            rarity = 4;
        } else if (enemyTemplate.hp >= 25) {
            rarity = 3;
        } else if (enemyTemplate.hp >= 20) {
            rarity = 2;
        }

        return {
            ...enemyTemplate,
            image: enemyImage,
            maxHp: Math.floor(enemyTemplate.hp * scale),
            hp: Math.floor(enemyTemplate.hp * scale),
            exp: Math.floor(enemyTemplate.exp * scale),
            level: enemyLv,
            rarity: rarity
        };
    }

    getHabitatForLevel(level) {
        if (level <= 3) return "まち";
        if (level <= 10) return "森";
        if (level <= 15) return "草原/さばく";
        if (level <= 20) return "山";
        if (level <= 25) return "空";
        if (level <= 30) return "湖/川";
        if (level <= 40) return "海";
        return "危険ランキング"; // Lv41+
    }

    updateEnemyDisplay() {
        if (!this.currentEnemy) return;

        // Update Sprite or Image
        this.elements.enemySprite.innerHTML = ''; // Clear previous content

        if (this.currentEnemy.image) {
            const img = document.createElement('img');
            img.src = this.currentEnemy.image;
            img.className = 'enemy-image ' + (this.currentEnemy.isBoss ? 'boss' : '');
            // Handle error (fallback to emoji)
            img.onerror = () => {
                this.elements.enemySprite.textContent = this.currentEnemy.emoji;
                this.elements.enemySprite.classList.remove('has-image');
            };
            this.elements.enemySprite.appendChild(img);
            this.elements.enemySprite.classList.add('has-image');
        } else {
            this.elements.enemySprite.textContent = this.currentEnemy.emoji;
            this.elements.enemySprite.classList.remove('has-image');
        }

        if (this.currentEnemy.isBoss) {
            this.elements.enemySprite.classList.add('boss');
        } else {
            this.elements.enemySprite.classList.remove('boss');
        }

        // Update Name in Top Right
        const nameEl = document.getElementById('battle-enemy-name');
        if (nameEl) nameEl.textContent = this.currentEnemy.name;

        // Update Level
        const lvEl = document.getElementById('battle-enemy-lv');
        if (lvEl) lvEl.textContent = this.currentEnemy.level || this.player.lv; // Fallback

        // Show Stats Box (Battle start logic handles fade in, but we ensure reference here)
        const statsBox = document.getElementById('battle-enemy-stats');
        if (statsBox) {
            this.elements.enemyStats = statsBox;
        }

        // Initial Stats Update
        this.updateEnemyStats();
    }

    updateEnemyStats() {
        if (!this.currentEnemy) return;

        // Update HP Text
        const hpEl = document.getElementById('battle-enemy-hp');
        if (hpEl) hpEl.textContent = Math.max(0, this.currentEnemy.hp);

        // Update Gauge
        if (this.elements.hpGaugeFill) {
            const hpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
            this.elements.hpGaugeFill.style.width = `${Math.max(0, hpPercent)}%`;

            // Color update
            this.elements.hpGaugeFill.className = ''; // reset
            if (hpPercent <= 20) {
                this.elements.hpGaugeFill.classList.add('low');
            } else if (hpPercent <= 50) {
                this.elements.hpGaugeFill.classList.add('mid');
            }
        }
    }

    nextTurn() {
        if (!this.isBattleActive) return;

        // Generate Math Problem based on ENEMY Level (or Player Level if undefined)
        const difficulty = this.currentEnemy ? (this.currentEnemy.level || this.player.lv) : this.player.lv;
        const problem = this.generateMathProblem(difficulty);
        this.currentProblem = problem;

        // Display Problem
        this.elements.questionText.textContent = problem.question;

        // Setup Answer Buttons
        this.setupAnswerButtons(problem);

        // Show Question UI
        if (this.elements.questionArea) {
            this.elements.questionArea.classList.remove('hidden');
            this.elements.questionArea.style.display = 'flex'; // Flex for vertical list
        }

        this.logMessage("もんだい！");
    }

    generateMathProblem(level) {
        const questions = [
            { q: "8 + 7", a: 15 },
            { q: "9 + 6", a: 15 },
            { q: "7 + 8", a: 15 },
            { q: "6 + 9", a: 15 },
            { q: "5 + 8", a: 13 },

            { q: "14 - 7", a: 7 },
            { q: "15 - 6", a: 9 },
            { q: "13 - 5", a: 8 },
            { q: "16 - 8", a: 8 },
            { q: "17 - 9", a: 8 },

            { q: "12 + 5", a: 17 },
            { q: "13 + 6", a: 19 },
            { q: "14 + 7", a: 21 },
            { q: "15 + 8", a: 23 },
            { q: "16 + 7", a: 23 },

            { q: "18 + 5", a: 23 },
            { q: "17 + 6", a: 23 },
            { q: "19 + 4", a: 23 },
            { q: "14 + 9", a: 23 },
            { q: "13 + 8", a: 21 },

            { q: "21 + 5", a: 26 },
            { q: "23 + 6", a: 29 },
            { q: "24 + 7", a: 31 },
            { q: "26 + 5", a: 31 },
            { q: "28 + 4", a: 32 },

            { q: "22 - 5", a: 17 },
            { q: "25 - 7", a: 18 },
            { q: "27 - 8", a: 19 },
            { q: "29 - 6", a: 23 },
            { q: "24 - 9", a: 15 },

            { q: "ビッグフットの あしあとが 8こ。あとで 7こ みつかった。ぜんぶで？", a: 15 },
            { q: "ネッシーの くびが 10m。しっぽが 6m。あわせて？", a: 16 },
            { q: "クラーケンの あしは 8ほん。2ひきいたら？", a: 16 },
            { q: "スカイフィッシュが 12ひき。5ひき にげた。のこり？", a: 7 },
            { q: "ドラゴンの きんかが 15まい。8まい つかった。のこり？", a: 7 },

            { q: "16 + 9", a: 25 },
            { q: "17 + 8", a: 25 },
            { q: "18 + 7", a: 25 },
            { q: "19 + 6", a: 25 },

            { q: "27 - 9", a: 18 },
            { q: "28 - 7", a: 21 },
            { q: "29 - 8", a: 21 },

            { q: "24 + 9", a: 33 },
            { q: "23 + 8", a: 31 },
            { q: "26 + 7", a: 33 }
        ];

        const randomIndex = Math.floor(Math.random() * questions.length);
        const selected = questions[randomIndex];

        return {
            question: selected.q,
            answer: selected.a
        };
    }

    setupAnswerButtons(problem) {
        const buttons = Array.from(this.elements.answerButtons);
        const correctAnswer = problem.answer;

        // Generate 3 unique wrong answers
        const wrongAnswers = new Set();
        while (wrongAnswers.size < 3) {
            let offset = Math.floor(Math.random() * 5) + 1; // 1 to 5
            offset *= Math.random() > 0.5 ? 1 : -1;
            let wrong = correctAnswer + offset;
            if (wrong >= 0 && wrong !== correctAnswer) {
                wrongAnswers.add(wrong);
            }
        }

        const choices = [correctAnswer, ...wrongAnswers];
        // Shuffle
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        buttons.forEach((btn, index) => {
            btn.textContent = choices[index];
            btn.dataset.value = choices[index];
            btn.disabled = false;
        });
    }


    updatePlayerStats() {
        if (!this.player) return;
        const hpEl = document.getElementById('battle-hero-hp');
        const mpEl = document.getElementById('battle-hero-mp');
        const lvEl = document.getElementById('battle-hero-lv');
        const gaugeFill = document.getElementById('hero-hp-gauge-fill');

        if (hpEl) hpEl.textContent = Math.max(0, this.player.hp);
        if (mpEl) mpEl.textContent = Math.max(0, this.player.mp);
        if (lvEl) lvEl.textContent = this.player.lv;

        const expEl = document.getElementById('battle-hero-exp');
        if (expEl) expEl.textContent = this.player.exp;

        // Update Gauge
        if (gaugeFill) {
            const hpPercent = (this.player.hp / this.player.maxHp) * 100;
            gaugeFill.style.width = `${Math.max(0, hpPercent)}%`;

            // Color update
            gaugeFill.className = ''; // reset
            if (hpPercent <= 20) {
                gaugeFill.classList.add('low');
                gaugeFill.classList.add('mid');
            }
        }
    }

    showFeedback(isCorrect, targetElement) {
        // Create a dedicated feedback element
        const feedback = document.createElement('div');
        feedback.textContent = isCorrect ? '○' : '✕';
        feedback.className = isCorrect ? 'feedback-pop feedback-correct' : 'feedback-pop feedback-wrong';

        // Append to target or fallback into body (though target is expected)
        if (targetElement) {
            targetElement.appendChild(feedback);
        } else {
            // Fallback to overlay if no target (e.g. keyboard mode if we had one)
            // But for now, user requested specific location.
            const overlay = document.getElementById('feedback-overlay');
            if (overlay) {
                overlay.textContent = isCorrect ? '○' : '✕';
                overlay.className = '';
                overlay.classList.add(isCorrect ? 'feedback-correct' : 'feedback-wrong');
                void overlay.offsetWidth;
                setTimeout(() => overlay.className = 'hidden', 600);
            }
            return;
        }

        // Remove after animation
        setTimeout(() => {
            feedback.remove();
        }, 600);
    }

    handleAnswer(btn) {
        if (!this.isBattleActive) return;

        const playerAnswer = parseInt(btn.dataset.value);
        const isCorrect = playerAnswer === this.currentProblem.answer;

        // Disable buttons temporarily
        this.elements.answerButtons.forEach(b => b.disabled = true);

        if (this.isRushMode) {
            // --- RUSH MODE LOGIC ---
            if (isCorrect) {
                this.showFeedback(true, btn);
                this.logMessage("せいかい！");
                this.playSound('attack');

                // Visual feedback - Shake Enemy!
                this.elements.enemySprite.classList.remove('damage-shake');
                void this.elements.enemySprite.offsetWidth;
                this.elements.enemySprite.classList.add('damage-shake');
                setTimeout(() => this.elements.enemySprite.classList.remove('damage-shake'), 600);

                // Damage Enemy
                this.currentEnemy.hp -= this.damagePerHit;

                // Update Stats
                this.updateEnemyStats();

                // Check if Enemy Dead
                if (this.currentEnemy.hp <= 0) {
                    this.currentEnemy.hp = 0; // Clamp
                    this.updateEnemyStats(); // Ensure display is 0

                    this.elements.enemySprite.classList.add('enemy-defeat'); // Trigger Animation
                    
                    // UMA捕獲判定
                    const isNewCapture = captureEnemy(this.currentEnemy.id);
                    
                    if(isNewCapture) {
                        this.logMessage(`✨ UMAゲット！ \n${this.currentEnemy.name} が ずかんに とうろくされた！`);
                        this.playSound('win'); // 特別な音を鳴らす
                    } else {
                        this.logMessage(`${this.currentEnemy.name}を たおした！`);
                    }

                    // Skip remaining questions
                    this.rushCount = this.rushMax; // Force end

                    // Wait for animation (3s)
                    setTimeout(() => this.endRush(), 3000);
                } else {
                    setTimeout(() => this.nextRushQuestion(), 800);
                }

            } else {
                // Wrong Answer
                this.showFeedback(false, btn);
                this.logMessage("ミス！ ダメージをうけた！");
                this.playSound('miss');

                // Visual feedback - Shake Screen
                document.getElementById('game-container').classList.add('shake');
                setTimeout(() => document.getElementById('game-container').classList.remove('shake'), 500);

                // Player Damage
                const dmg = Math.floor(this.player.maxHp * 0.1) + 5; // ~10-15% damage
                this.player.hp -= dmg;
                this.updatePlayerStats();

                if (this.player.hp <= 0) {
                    // Game Over
                    setTimeout(() => this.handleGameOver(), 1000);
                } else {
                    setTimeout(() => this.nextRushQuestion(), 1000);
                }
            }

        } else {
            // --- LEGACY LOGIC (Fallback) ---
            if (isCorrect) {
                this.showFeedback(true, btn);
                this.logMessage("こうげき！");
                this.playSound('attack');

                this.elements.enemySprite.classList.remove('damage-shake');
                void this.elements.enemySprite.offsetWidth;
                this.elements.enemySprite.classList.add('damage-shake');
                setTimeout(() => this.elements.enemySprite.classList.remove('damage-shake'), 600);

                const damage = 10;
                this.currentEnemy.hp -= damage;

                // Update Stats
                this.updateEnemyStats();

                setTimeout(() => {
                    this.logMessage(`${this.currentEnemy.name}に ${damage}の ダメージ！`);
                    if (this.currentEnemy.hp <= 0) {
                        this.elements.enemySprite.classList.add('enemy-defeat');
                        
                        // UMA捕獲判定
                        const isNewCapture = captureEnemy(this.currentEnemy.id);
                        
                        if(isNewCapture) {
                            this.logMessage(`✨ UMAゲット！ \n${this.currentEnemy.name} が ずかんに とうろくされた！`);
                            this.playSound('win'); // 特別な音を鳴らす
                        } else {
                            this.logMessage(`${this.currentEnemy.name}を たおした！`);
                        }
                        
                        setTimeout(() => this.winBattle(), 4000);
                    } else {
                        setTimeout(() => this.enemyAttack(), 1000);
                    }
                }, 800);
            } else {
                this.showFeedback(false, btn);
                this.logMessage("ミス！");
                this.playSound('miss');
                document.getElementById('game-container').classList.add('shake');
                setTimeout(() => document.getElementById('game-container').classList.remove('shake'), 500);
                setTimeout(() => this.enemyAttack(), 1000);
            }
        }
    }


    enemyAttack() {
        if (!this.isBattleActive) return;

        this.logMessage(`${this.currentEnemy.name}の こうげき！`);
        this.elements.answerButtons.forEach(btn => {
            btn.parentElement.classList.add('shake');
        });
        setTimeout(() => {
            this.elements.answerButtons.forEach(btn => {
                btn.parentElement.classList.remove('shake');
                btn.parentElement.classList.remove('shake');
            });

            let dmg = Math.floor(Math.random() * 5) + 2;
            dmg += Math.floor(this.player.lv * 0.5); // Scaling
            this.player.hp -= dmg;
            this.updatePlayerStats();
            this.logMessage(`えいとくん は ${dmg} の ダメージを うけた！`);

            if (this.player.hp <= 0) {
                setTimeout(() => this.handleGameOver(), 1000);
            } else {
                // Back to menu
                setTimeout(() => this.showCommandMenu(), 1500);
            }
        }, 1000);
    }

    winBattle() {
        // ここでのメッセージ表示はRUSHモードと重複する可能性があるため削除または条件付きにする
        // 今は捕獲演出でメッセージが上書きされるため、ここで再表示すると演出が消えてしまうのを防ぐ
        // this.logMessage(`${this.currentEnemy.name}を たおした！`);
        this.playSound('attack'); // Victory sound placeholder

        // Check Boss Defeated
        if (this.currentEnemy.isLvl1Boss) {
            this.lvl1BossDefeated = true;
            this.logMessage("レベル１のボスを たおした！");
            this.playSound('win');
        }

        if (this.currentEnemy.id === "F001" && this.currentEnemy.isBoss) { // Forest Master
            this.forestBossDefeated = true; // Mark as defeated
            this.saveGame();

            setTimeout(() => {
                this.handleStage1Clear();
            }, 1000);
            return;
        }

        // Track Defeated Enemies (For Forest Boss Trigger)
        if (!this.defeatedEnemies) this.defeatedEnemies = [];
        if (!this.defeatedEnemies.includes(this.currentEnemy.id)) {
            this.defeatedEnemies.push(this.currentEnemy.id);
        }

        // EXP Logic
        this.player.exp += this.currentEnemy.exp;
        this.updatePlayerStats(); // Ensure UI updates immediately
        this.saveGame(); // Auto-save

        // Item Drop Logic
        const items = [
            { name: "やくそう", rate: 0.3 },
            { name: "銅のつるぎ", rate: 0.1 },
            { name: "すばやさのたね", rate: 0.05 },
            { name: "まほうのせいすい", rate: 0.15 }
        ];

        const roll = Math.random();
        let droppedItem = null;

        if (roll < 0.5) { // 50% chance to get something
            droppedItem = items[Math.floor(Math.random() * items.length)];
        }

        setTimeout(() => {
            this.logMessage(`けいけんち ${this.currentEnemy.exp} ポイントを かくとく！`);

            // Check Level Up
            const leveledUp = this.checkLevelUp();

            setTimeout(() => {
                const nextDelay = leveledUp ? 2500 : 500;

                if (droppedItem) {
                    this.logMessage(`${droppedItem.name} を 手に入れた！`);
                    this.playSound('attack'); // Item get sound
                    setTimeout(() => this.startBattle(), 2000);
                } else {
                    setTimeout(() => this.startBattle(), nextDelay);
                }
            }, 1500);
        }, 1500);
    }

    checkLevelUp() {
        const nextLevelExp = this.player.lv * 10;
        if (this.player.exp >= nextLevelExp) {
            this.player.lv++;
            this.player.maxHp += 10; // Increase Max HP
            this.player.hp = this.player.maxHp; // Full Heal
            this.player.mp = Math.min(this.player.mp + 5, 50); // Restore MP slightly (cap at 50 for now)

            this.updatePlayerStats();
            this.logMessage(`レベルが ${this.player.lv} に あがった！`);
            this.saveGame(); // Auto-save
            this.playSound('attack'); // Placeholder for Level up sound

            // Visual Effect
            const levelUpText = document.createElement('div');
            levelUpText.className = 'level-up-text';
            levelUpText.textContent = 'LEVEL UP!';
            document.getElementById('battle-screen').appendChild(levelUpText);

            setTimeout(() => {
                levelUpText.remove();
            }, 2000);

            return true;
        }
        return false;
    }

    handleGameOver() {
        this.isBattleActive = false;
        this.bgm.stop();
        this.playSound('miss'); // Sad sound

        // Hide Battle UI Elements
        this.elements.commandMenu.classList.add('hidden');
        if (this.elements.questionArea) this.elements.questionArea.classList.add('hidden');

        // Create Game Over Overlay if it doesn't exist
        if (!document.getElementById('game-over-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'game-over-overlay';
            overlay.innerHTML = `
            <h2 style="color: #ff0000; font-size: 3rem; text-shadow: 2px 2px #fff; margin-bottom: 20px;">GAME OVER</h2>
            <button id="restart-btn" class="pixel-btn">タイトルへ</button>
        `;
            // Simple inline styles for overlay
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.zIndex = '200';

            document.getElementById('game-container').appendChild(overlay);

            document.getElementById('restart-btn').addEventListener('click', () => {
                overlay.remove();
                this.resetGame();
            });
        }
    }

    handleGameClear() {
        this.isBattleActive = false;
        this.bgm.stop();
        this.playSound('win');

        // Hide Battle UI Elements
        this.elements.commandMenu.classList.add('hidden');
        if (this.elements.questionArea) this.elements.questionArea.classList.add('hidden');

        // Create Ending Overlay
        const overlay = document.createElement('div');
        overlay.id = 'ending-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.fontFamily = '"DotGothic16", sans-serif';
        overlay.style.textAlign = 'center';

        overlay.innerHTML = `
            <div style="font-size: 40px; color: #ffd700; text-shadow: 2px 2px #000; margin-bottom: 30px;">GAME CLEAR!</div>
            <div style="font-size: 18px; line-height: 1.8;">
                でんせつの UMA ビッグフットを たおした！<br>
                せかいに 平和が もどった！<br>
                <br>
                ありがとう ゆうしゃ えいと！
            </div>
            <button id="end-title-btn" style="margin-top: 40px; padding: 10px 20px; font-size: 18px; cursor: pointer; background: #333; color: #fff; border: 2px solid #fff; font-family: inherit;">タイトルへ</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('end-title-btn').addEventListener('click', () => {
            overlay.remove();
            this.resetGame();
        });
    }

    handleStage1Clear() {
        this.isBattleActive = false;
        this.bgm.stop();
        this.playSound('win');

        // Hide Battle UI Elements
        this.elements.commandMenu.classList.add('hidden');
        if (this.elements.questionArea) this.elements.questionArea.classList.add('hidden');

        // Create Stage Clear Overlay
        const overlay = document.createElement('div');
        overlay.id = 'stage-clear-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.fontFamily = '"DotGothic16", sans-serif';
        overlay.style.textAlign = 'center';

        overlay.innerHTML = `
            <div style="font-size: 32px; color: #00ff00; text-shadow: 2px 2px #000; margin-bottom: 20px;">STAGE 1 CLEAR!</div>
            <div style="font-size: 18px; line-height: 1.8;">
                森の主 ビッグフットを たおした！<br>
                つぎの ステージへ すすもう！<br>
            </div>
            <button id="next-stage-btn" class="pixel-btn" style="margin-top: 30px;">つぎへ</button>
        `;
        document.body.appendChild(overlay);

        document.getElementById('next-stage-btn').addEventListener('click', () => {
            overlay.remove();
            this.bgm.play('battle'); // Resume BGM or Map BGM logic? For now Battle/Title
            this.switchScreen('title'); // Or just back to menu?
            // Actually, usually we just go back to title or continue loop.
            // Let's go back to title to save properly and let user Start again to see new habitat.
        });
    }

    logMessage(text) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Reset content
        this.elements.message.innerHTML = '';

        let i = 0;
        const speed = 50; // Slower for better effect (was 30)

        const typeChar = () => {
            if (i < text.length) {
                this.elements.message.textContent += text.charAt(i);
                i++;
                this.typingTimeout = setTimeout(typeChar, speed);
            } else {
                // Done typing
                this.typingTimeout = null;
                // Add blinking cursor
                const cursorSpan = document.createElement('span');
                cursorSpan.id = 'message-cursor';
                cursorSpan.textContent = '▼';
                this.elements.message.appendChild(cursorSpan);
            }
        };

        typeChar();
    }

    playSound(type) {
        // return; // Muted for now -> Re-enabling for specific SFX request
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!this.audioCtx) {
            this.audioCtx = new AudioContext();
        }

        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'attack') {
            // High pitch short beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'miss') {
            // Low pitch buzz
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'heal') {
            // Ascending chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(880, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'approaching') {
            // Low pitch thud (Footstep)
            // Triangle wave for a muffled sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

            gainNode.gain.setValueAtTime(0.3, now); // Slightly louder for impact
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'bgm') {
            // BGM placeholder - we probably won't do full BGM yet
        } else if (type === 'pi') {
            // Selection sound
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'darkness') {
            // Creepy sound: Low dissonant drone with pitch bend
            // Oscillator 1: Low Sawtooth
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.linearRampToValueAtTime(80, now + 1.5); // Slight rise

            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2.0);

            osc.start(now);
            osc.stop(now + 2.0);

            // Oscillator 2: Dissonant high sine
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(300, now);
            osc2.frequency.linearRampToValueAtTime(290, now + 1.5); // Slight fall (unsettling)

            gain2.gain.setValueAtTime(0.1, now);
            gain2.gain.linearRampToValueAtTime(0.01, now + 2.0);

            osc2.start(now);
            osc2.stop(now + 2.0);

        } else if (type === 'darkness') {
            // Low drone / impact
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.linearRampToValueAtTime(30, now + 2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 2);
            osc.start(now);
            osc.stop(now + 2.0);
        }
    }
    // --- Save System ---

    saveGame() {
        const saveData = {
            player: this.player,
            lvl1BossDefeated: this.lvl1BossDefeated || false,
            forestBossDefeated: this.forestBossDefeated || false,
            defeatedEnemies: this.defeatedEnemies || []
        };
        localStorage.setItem('mathQuestSave', JSON.stringify(saveData));
        console.log("Game Saved", saveData);
    }

    loadGame() {
        const saveString = localStorage.getItem('mathQuestSave');
        if (saveString) {
            try {
                const saveData = JSON.parse(saveString);
                if (saveData.player) {
                    this.player = { ...this.player, ...saveData.player };
                }
                this.lvl1BossDefeated = saveData.lvl1BossDefeated || false;
                this.forestBossDefeated = saveData.forestBossDefeated || false;
                this.defeatedEnemies = saveData.defeatedEnemies || [];
                console.log("Game Loaded", saveData);
                return true;
            } catch (e) {
                console.error("Save Data Corrupt", e);
                return false;
            }
        }
        return false;
    }

    resetGame() {
        if (confirm("ぼうけんの しょ を けします。\nほんとうに よろしいですか？")) {
            localStorage.removeItem('mathQuestSave');
            location.reload();
        }
    }
}



class BGMController {
    constructor() {
        this.audioCtx = null;
        this.oscillator = null;
        this.intervalIds = [];
        this.isPlaying = false;
        this.currentType = null;
    }

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
    }

    resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    unlock() {
        if (!this.audioCtx) this.init();

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Play silent buffer to force unlock logic for iOS
        try {
            const buffer = this.audioCtx.createBuffer(1, 1, 22050);
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioCtx.destination);
            source.start(0);
            console.log("Audio unlocked via silent buffer");

            // Also warm up HTML5 Audio elements
            const audios = document.querySelectorAll('audio');
            audios.forEach(a => {
                a.volume = 0;
                a.play().then(() => {
                    a.pause();
                    a.currentTime = 0;
                    a.volume = 1;
                }).catch(e => console.log("Warmup failed", e));
            });

        } catch (e) {
            console.error("Audio unlock failed", e);
        }
    }

    playSFX(type) {
        if (!this.audioCtx) this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'pi') {
            // Cursor move / Select
            osc.frequency.setValueAtTime(880, t);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'decision') {
            // Confirm
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
        } else if (type === 'damage') {
            // Damage
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.2);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.start(t);
            osc.stop(t + 0.2);
        } else if (type === 'win') {
            // Win Fanfare (Simple)
            this.playNote(523.25, t, 0.1); // C5
            this.playNote(523.25, t + 0.1, 0.1); // C5
            this.playNote(523.25, t + 0.2, 0.1); // C5
            this.playNote(659.25, t + 0.3, 0.4); // E5
        } else if (type === 'start') {
            // Game Start
            this.playNote(440, t, 0.1);
            this.playNote(554, t + 0.1, 0.1);
            this.playNote(659, t + 0.2, 0.4);
        } else if (type === 'footstep_heavy') {
            // Low thud
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
        } else if (type === 'water_splash') {
            // Gentle splash bubble
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(200, t + 0.2);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        } else if (type === 'wind_whoosh') {
            // Low sweeping noise-like (simulated with low freq sine sweep)
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.2);
            osc.frequency.linearRampToValueAtTime(50, t + 0.4);
            osc.type = 'triangle'; // rougher than sine
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
            gain.gain.linearRampToValueAtTime(0.0, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
        } else if (type === 'creepy_small') {
            // High pitch dissonance
            osc.frequency.setValueAtTime(2000, t);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);

            // Second tone for dissonance
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(2100, t); // slightly off
            gain2.gain.setValueAtTime(0.05, t);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc2.start(t);
            osc2.stop(t + 0.1);
        } else if (type === 'attack') {
            // Heavy Impact "Do-ka"
            // 1. "Do" - Low punch
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);

            // 2. "Ka" - Noise Burst
            const bufferSize = ctx.sampleRate * 0.1; // 0.1 sec
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            noiseGain.gain.setValueAtTime(0.5, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noise.start(t);
        }
    }

    playNote(freq, time, duration) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.setValueAtTime(0.1, time + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        osc.start(time);
        osc.stop(time + duration);
    }

    play(type) {
        // removed early return to enable sound
        if (this.currentType === type && this.isPlaying) return;
        this.stop();
        this.init();
        this.currentType = type;
        this.isPlaying = true;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (type === 'battle') {
            this.playBattleTheme();
        } else if (type === 'boss') {
            this.playBossTheme();
        } else if (type === 'win') {
            this.playWinFanfare();
        }
    }

    stop() {
        this.isPlaying = false;
        this.currentType = null;
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
        this.stopSound();
    }

    stopSound() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) { }
            this.oscillator = null;
        }
    }

    playTone(freq, duration, type = 'square', vol = 0.1) {
        if (!this.isPlaying && type !== 'square') return; // Fanfare allows playing even if isPlaying is false? No, logic needs check.
        // Actually playTone creates its own osc, so it's fire-and-forget mostly.

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playBattleTheme() {
        // Base Line
        const bassSequence = [
            110, 0, 110, 0, 130, 0, 98, 0
        ];
        let bassIndex = 0;

        const playBass = () => {
            if (!this.isPlaying) return;
            const freq = bassSequence[bassIndex];
            if (freq > 0) this.playTone(freq, 0.15, 'triangle', 0.15);
            bassIndex = (bassIndex + 1) % bassSequence.length;
        };

        this.intervalIds.push(setInterval(playBass, 200));

        // Melody Line
        const melody = [
            440, 0, 440, 493, 440, 392, 349, 329
        ];
        let melodyIndex = 0;
        const playMelody = () => {
            if (!this.isPlaying) return;
            const freq = melody[melodyIndex];
            if (freq > 0) this.playTone(freq, 0.3, 'square', 0.05);
            melodyIndex = (melodyIndex + 1) % melody.length;
        };
        this.intervalIds.push(setInterval(playMelody, 400));
    }

    playBossTheme() {
        // Fast Tempo
        const sequence = [
            65, 73, 82, 87, 65, 87, 73, 65
        ];
        let index = 0;
        const playNext = () => {
            if (!this.isPlaying) return;
            const freq = sequence[index];
            this.playTone(freq, 0.1, 'sawtooth', 0.15);
            index = (index + 1) % sequence.length;
        };
        this.intervalIds.push(setInterval(playNext, 120));
    }

    playWinFanfare() {
        // Fanfare should play even if we 'stopped' the loop logic, but playTone checks isPlaying.
        // Let's force isPlaying = true momentarily or bypass check.
        // Actually playTone check "if (!this.isPlaying && type !== 'square')" logic is weird.
        // Let's just remove isPlaying check in playTone for simplicity in this replacement or make sure to set isPlaying true.
        this.isPlaying = true;

        const notes = [
            { f: 523, t: 0 }, { f: 523, t: 150 }, { f: 523, t: 300 }, { f: 523, t: 450 },
            { f: 415, t: 600 }, { f: 466, t: 750 }, { f: 523, t: 900 },
            { f: 587, t: 1200 }, { f: 698, t: 1500 } // high F
        ];

        notes.forEach(note => {
            setTimeout(() => {
                // Manually play tone without isPlaying check dependencies ideally
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(note.f, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.3);
            }, note.t);
        });
    }
}
