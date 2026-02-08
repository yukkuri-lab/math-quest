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
    }

    init() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());

        // Attach event listeners to answer buttons
        this.elements.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target));
        });

        // Attach event listeners to command buttons
        this.elements.commandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCommand(e.target.dataset.cmd));
        });
    }

    startGame() {
        // Init Audio Context on user interaction
        this.bgm.init();
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
        this.screens[screenName].classList.remove('hidden');
        this.screens[screenName].classList.add('active');
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

        // --- DRAMATIC INTRO SEQUENCE ---
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // 1. "......"
        this.logMessage("......");
        await sleep(1500);

        // 2. "Something approaching"
        this.logMessage("なにかが ちかづいてくる……");
        this.playSound('approaching'); // New SFX
        await sleep(2000);

        // 3. "Darkness"
        this.logMessage("あたりが くらくなった！");
        this.playSound('darkness'); // New SFX
        await sleep(2000);

        // 4. Reveal Enemy (No text)
        await sleep(1000); // 1s pause after darkness

        // Appear concurrently with text!
        this.logMessage(`${this.currentEnemy.name} が あらわれた！`);

        // Fade In (Fast)
        this.elements.enemySprite.style.transition = 'opacity 0.2s ease-in';
        void this.elements.enemySprite.offsetWidth; // Trigger reflow
        this.elements.enemySprite.style.opacity = '1';
        if (this.elements.enemyStats) this.elements.enemyStats.style.opacity = '1';

        // Camera Shake Effect
        document.body.classList.add('camera-shake');
        setTimeout(() => document.body.classList.remove('camera-shake'), 500);

        // BGM Start
        if (this.currentEnemy.isBoss) {
            this.bgm.play('boss');
        } else {
            this.bgm.play('battle');
        }

        this.playSound('pi'); // Alert sound
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

        // Boss Battle: Bigfoot (Level 10)
        if (this.player.lv >= 10 && !this.bossDefeated) {
            return {
                id: "F001",
                name: "ビッグフット",
                emoji: "🦶",
                hp: 100,
                maxHp: 100,
                exp: 0, // Game Clear
                level: 10,
                isBoss: true
            };
        }

        // Tutorial / First Battle: Always Humanoid UMA
        if (this.player.lv === 1 && this.player.exp === 0) {
            return {
                id: "C000",
                name: "ヒューマノイド型UMA",
                emoji: "👽",
                image: "assets/uma_humanoid_final_03.jpg",
                hp: 16,
                maxHp: 16,
                exp: 3,
                level: 1
            };
        }

        let randomIndex;
        if (this.player.lv === 1 && Math.random() < 0.5) {
            // 50% chance for Humanoid UMA at Level 1
            randomIndex = 0; // C000 is at index 0
        } else {
            randomIndex = Math.floor(Math.random() * enemies.length);
        }
        const enemyTemplate = enemies[randomIndex];

        // Determine Enemy Level (Player LV +/- 1, min 1)
        let enemyLv = this.player.lv + (Math.floor(Math.random() * 3) - 1);
        if (enemyLv < 1) enemyLv = 1;

        // Scale enemy stats based on ITS level
        const scale = 1 + (enemyLv - 1) * 0.15;

        return {
            ...enemyTemplate,
            maxHp: Math.floor(enemyTemplate.hp * scale),
            hp: Math.floor(enemyTemplate.hp * scale),
            exp: Math.floor(enemyTemplate.exp * scale),
            level: enemyLv
        };
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
        let n1, n2, operator, answer, question;

        // Level 1-2: Addition sum <= 10
        // Level 3-4: Subtraction (start <= 10, result >= 0)
        // Level 5-6: Addition sum <= 20, Subtraction (start <= 20)
        // Level 7+: Missing Operand (? + 2 = 5)

        const type = Math.random();

        // Determine Mode based on Level
        let mode = 'add';
        if (level >= 3) {
            if (level >= 7) mode = 'mix_missing'; // 50% mixed
            else mode = 'mix';
        }

        // Logic
        if (mode === 'mix' || mode === 'mix_missing') {
            mode = Math.random() > 0.5 ? 'add' : 'sub';
        }

        // Generate Numbers
        let max = 10;
        if (level >= 5) max = 20;
        if (level >= 10) max = 30; // Boss level difficulty

        if (mode === 'add') {
            n1 = Math.floor(Math.random() * (max + 1));
            n2 = Math.floor(Math.random() * (max - n1 + 1));
            answer = n1 + n2;
            operator = "+";
            question = `${n1} + ${n2} = ?`;
        } else {
            // Sub
            n1 = Math.floor(Math.random() * (max + 1));
            n2 = Math.floor(Math.random() * (n1 + 1));
            answer = n1 - n2;
            operator = "-";
            question = `${n1} - ${n2} = ?`;
        }

        // Missing Operand Logic (Level 7+)
        if (level >= 7 && Math.random() > 0.6) {
            // 40% chance of missing operand
            if (mode === 'add') {
                // n1 + n2 = answer
                if (Math.random() > 0.5) {
                    // ? + n2 = answer
                    question = `? + ${n2} = ${answer}`; // Answer is n1
                    answer = n1;
                } else {
                    // n1 + ? = answer
                    question = `${n1} + ? = ${answer}`; // Answer is n2
                    answer = n2;
                }
            } else {
                // n1 - n2 = answer
                if (Math.random() > 0.5) {
                    // ? - n2 = answer
                    question = `? - ${n2} = ${answer}`; // Answer is n1
                    answer = n1;
                } else {
                    // n1 - ? = answer
                    question = `${n1} - ? = ${answer}`; // Answer is n2
                    answer = n2;
                }
            }
        }

        return {
            question: question,
            answer: answer
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
            } else if (hpPercent <= 50) {
                gaugeFill.classList.add('mid');
            }
        }
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
                    this.logMessage(`${this.currentEnemy.name}を たおした！`);

                    // Skip remaining questions
                    this.rushCount = this.rushMax; // Force end

                    // Wait for animation (3s)
                    setTimeout(() => this.endRush(), 3000);
                } else {
                    setTimeout(() => this.nextRushQuestion(), 800);
                }

            } else {
                // Wrong Answer
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
                        this.logMessage(`${this.currentEnemy.name}を たおした！`);
                        setTimeout(() => this.winBattle(), 3000);
                    } else {
                        setTimeout(() => this.enemyAttack(), 1000);
                    }
                }, 800);
            } else {
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
        this.logMessage(`${this.currentEnemy.name}を たおした！`);
        this.playSound('attack'); // Victory sound placeholder

        // Check Boss Defeated
        if (this.currentEnemy.isLvl1Boss) {
            this.lvl1BossDefeated = true;
            this.logMessage("レベル１のボスを たおした！");
            this.playSound('win');
        }

        if (this.currentEnemy.id === "F001") { // Final Boss
            setTimeout(() => {
                this.handleGameClear();
            }, 1000);
            return;
        }

        // EXP Logic
        this.player.exp += this.currentEnemy.exp;
        this.updatePlayerStats(); // Ensure UI updates immediately

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
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
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
        } else if (type === 'approaching') {
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

    play(type) {
        return; // Muted for now
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
