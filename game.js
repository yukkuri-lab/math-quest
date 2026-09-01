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
        // ===== グローバルタッチ/クリックによるオーディオ解除 =====
        // Chrome on iOS: AudioContext の作成・resume は
        // ユーザー操作イベントの「最初の同期処理」である必要がある。
        // ここでは body への汎用リスナーを置くが、実際の音再生は
        // soundTestBtn / startBtn ハンドラ内で直接行う。
        const unlockAudio = (e) => {
            if (e && e.type === 'touchstart') return;
            // ★ iPhone/iPad: マナーモード（本体横の消音スイッチ）で音を消されないようにする。
            //   Web Audio は既定で「環境音」扱いのため、消音スイッチがONだと問答無用で無音になる。
            //   'playback' にすると動画アプリと同じ扱いになり、消音スイッチの影響を受けない。
            //   iOS 16.4 以降の Safari / iPhoneのChrome（中身はSafari）で有効。
            //   古い端末では navigator.audioSession が無いので、その場合は何もしない（従来どおり）。
            try {
                if (navigator.audioSession && navigator.audioSession.type !== 'playback') {
                    navigator.audioSession.type = 'playback';
                }
            } catch (err) { /* 対応していない端末では無視 */ }
            // AudioContextをまだ作っていなければここで作る
            if (!this.bgm.audioCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                this.bgm.audioCtx = new AC();
            }
            if (this.bgm.audioCtx.state === 'suspended') {
                this.bgm.audioCtx.resume();
            }
            this.updateDebugInfo(`Unlock: ${this.bgm.audioCtx.state} / session=${(navigator.audioSession && navigator.audioSession.type) || '非対応'} (${e ? e.type : '?'})`);
        };
        document.body.addEventListener('touchstart', unlockAudio, { passive: true });
        document.body.addEventListener('touchend', unlockAudio, { passive: true });
        document.body.addEventListener('click', unlockAudio);

        // ===== スタートボタン =====
        this.elements.startBtn.addEventListener('click', () => {
            // Chrome対策: ユーザー操作の最初にAudioContext作成・再開
            if (!this.bgm.audioCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                this.bgm.audioCtx = new AC();
            }
            if (this.bgm.audioCtx.state === 'suspended') {
                this.bgm.audioCtx.resume();
            }
            this.startGame();
        });

        // ===== 回答ボタン =====
        this.elements.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target));
        });

        // ===== コマンドボタン =====
        this.elements.commandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // コマンド操作でもAudioContextを起こす
                if (this.bgm.audioCtx && this.bgm.audioCtx.state === 'suspended') {
                    this.bgm.audioCtx.resume();
                }
                this.handleCommand(e.target.dataset.cmd);
            });
        });

        // ===== UMAずかんボタン =====
        const encBtn = document.getElementById('enc-btn');
        if (encBtn) {
            encBtn.addEventListener('click', () => {
                this.switchScreen('encyclopedia');
                openEncyclopedia();
            });
        }

        // ===== リセットボタン =====
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }

        // ===== おとテストボタン =====
        // Chrome on iOS 対策: AudioContext の作成と resume() を
        // このイベントハンドラの「一番最初」に同期実行する（最重要）
        const soundTestBtn = document.getElementById('sound-test-btn');
        if (soundTestBtn) {
            const runTest = () => {
                // ★ STEP1: AudioContext を同期的に作成・再開（Chrome必須）
                if (!this.bgm.audioCtx) {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    this.bgm.audioCtx = new AC();
                }
                
                // ここで必ずunlockを呼ぶ（iOSの無音バッファ処理を実行）
                this.bgm.unlock();

                // ★ STEP2: 状態をデバッグ表示
                this.updateDebugInfo(`Ctx: ${this.bgm.audioCtx.state}`);

                // ★ STEP3: 音を鳴らす
                try {
                    this.bgm.playSFX('decision');
                    setTimeout(() => {
                        if (this.bgm.audioCtx && this.bgm.audioCtx.state === 'running') {
                            this.bgm.playSFX('pi');
                        }
                        this.updateDebugInfo(`Final: ${this.bgm.audioCtx ? this.bgm.audioCtx.state : 'null'}`);
                    }, 300);
                } catch (err) {
                    this.updateDebugInfo(`ERR: ${err.message}`);
                }
            };

            soundTestBtn.addEventListener('click', runTest);
        }

    }




    updateDebugInfo(msg = "") {
        const debugEl = document.getElementById('debug-info');
        if (debugEl) {
            let state = "NULL";
            let time = "0.0";
            if (this.bgm && this.bgm.audioCtx) {
                state = this.bgm.audioCtx.state;
                time = this.bgm.audioCtx.currentTime.toFixed(1);
            }
            debugEl.innerText = `[Debug] Audio: ${state} | T:${time} | ${msg}`;
            debugEl.style.display = 'block';
            debugEl.style.fontSize = '0.8rem';
            debugEl.style.color = '#0f0';
            debugEl.style.marginTop = '10px';
        }
    }

    startGame() {
        // Init Audio Context on user interaction to fix mobile audio
        this.bgm.init();
        this.bgm.unlock(); // Use powerful unlock

        // タイトル -> マップ画面へ
        this.showMapScreen();
    }

    // マップ画面を表示し、各世界ボタンを動的生成
    showMapScreen() {
        this.switchScreen('map');

        // position:fixed のバトルUI要素を全て非表示にする
        // （switchScreenだけでは消えないため明示的に隠す）
        const battleUIs = [
            '.question-area',
            '#command-menu',
            '#message-window',
            '#battle-player-stats',
            '#battle-enemy-stats'
        ];
        battleUIs.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });

        this.buildMapUI();
    }

    buildMapUI() {
        // 小学生画面の世界定義
        const worlds = [
            {
                id: 'beast',
                icon: '🌲',
                name: '🌲 もり',
                sub: 'たし算',
                theme: '#1a4a1a',
                unlockRequires: 0,   // 最初から解放済
            },
            {
                id: 'water',
                icon: '🌊',
                name: '🌊 みず',
                sub: 'ひき算',
                theme: '#0a2a4a',
                unlockRequires: 3,   // もりを3回クリア
            },
            {
                id: 'sky',
                icon: '🌪',
                name: '🌪 そら',
                sub: '2ケたのけいさん',
                theme: '#0a1a3a',
                unlockRequires: 3,   // みずを3回クリア
            },
            {
                id: 'shadow',
                icon: '🌑',
                name: '🌑 かげ',
                sub: 'もんだい',
                theme: '#1a001a',
                unlockRequires: 3,   // そらを3回クリア
            }
        ];

        // 各世界のクリア次数を起算
        const clears = this.worldClears || {};

        // ロック解除チェック（順番に
        // beast -> water -> sky -> shadow の順
        const isUnlocked = (worldId) => {
            const world = worlds.find(w => w.id === worldId);
            if (!world || world.unlockRequires === 0) return true;
            const prevWorld = worlds[worlds.indexOf(world) - 1];
            return (clears[prevWorld.id] || 0) >= world.unlockRequires;
        };

        const grid = document.getElementById('map-grid');
        if (!grid) return;
        grid.innerHTML = '';

        worlds.forEach(world => {
            const unlocked = isUnlocked(world.id);
            const clearCount = clears[world.id] || 0;
            const nextUnlockCount = unlocked ? null : worlds.find(w => w.id === world.id)?.unlockRequires;
            const prevWorldId = worlds[worlds.indexOf(worlds.find(w => w.id === world.id)) - 1]?.id;
            const prevClears = prevWorldId ? (clears[prevWorldId] || 0) : 0;

            const btn = document.createElement('button');
            btn.className = `map-btn${unlocked ? '' : ' map-btn-locked'}`;
            btn.dataset.area = world.id;
            btn.style.setProperty('--world-color', world.theme);

            if (unlocked) {
                btn.innerHTML = `
                    <span class="map-icon">${world.icon}</span>
                    <span class="map-name">${world.name}</span>
                    <span class="map-type">${world.sub}</span>
                    <span class="map-clear">★ ${clearCount}回クリア</span>
                `;
                btn.addEventListener('click', () => this.selectWorld(world.id));
            } else {
                const needed = world.unlockRequires - prevClears;
                btn.innerHTML = `
                    <span class="map-icon">&#128274;</span>
                    <span class="map-name">${world.name}</span>
                    <span class="map-unlock-hint">あと ${needed}回クリアで ひらく！</span>
                `;
                btn.disabled = true;
            }

            grid.appendChild(btn);
        });

        // 「Tabletにもどる」ボタン
        const backBtn = document.getElementById('map-back-btn');
        if (backBtn) {
            backBtn.onclick = () => this.switchScreen('title');
        }
    }

    selectWorld(worldId) {
        this.currentWorld = worldId;
        this.bgm.init();
        this.bgm.unlock();

        // showMapScreen で非表示にしたバトルUI要素を復元
        const battleUIs = [
            '#battle-player-stats',
            '#battle-enemy-stats'
        ];
        battleUIs.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = '';
        });

        this.switchScreen('battle');
        this.startBattle();
    }

    switchScreen(screenName) {
        // DOM内の全 .screen を先に非表示（マップ画面も含めて全部隠す）
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });

        // 対象画面を表示
        const targetId = screenName + '-screen';
        const targetEl = document.getElementById(targetId)
            || (this.screens[screenName]);   // フォールバック

        if (targetEl) {
            targetEl.classList.remove('hidden');
            targetEl.classList.add('active');
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

        // --- DRAMATIC INTRO SEQUENCE ---
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        
        const type = this.currentEnemy.encounterType || 'beast';

        // 1. エリアごとのメッセージと演出パターンの決定
        let msg1 = "";
        let msg2 = "";
        let sfxMode = "";
        let effectClass = "";
        let effectDuration = 0;

        switch (type) {
            case 'water': // 海・水
                msg1 = "🌊 すいめんが ざわめいている…";
                msg2 = "💦 おおきな なみが ちかづく…";
                sfxMode = "water_splash"; // または既存の音
                effectClass = "shake-water";
                effectDuration = 2000;
                break;
            case 'sky': // 空
                msg1 = "🌪 きゅうに かぜが つよくなった…";
                msg2 = "🦅 うえから こうそくで ちかづく影…";
                sfxMode = "wind_whoosh";
                effectClass = "flash-dark";
                effectDuration = 200;
                break;
            case 'shadow': // 影・怪異
                msg1 = "🌑 きゅうに まわりが くらくなった…";
                msg2 = "👻 うしろに いやな けはいが する…";
                sfxMode = "creepy_small";
                effectClass = "shake-fast";
                effectDuration = 1000;
                break;
            case 'beast': // 森・獣
            default:
                msg1 = "🌫️ もりが ざわざわしている…";
                msg2 = "👣 ドシン… ドシン…";
                sfxMode = "footstep_heavy";
                effectClass = "shake-heavy";
                effectDuration = 1000;
                break;
        }

        // Get Rarity (1 to 5)
        const rarity = this.currentEnemy.rarity || 1;
        const stars = "⭐".repeat(rarity);

        // 1. エリア演出 Part 1
        this.logMessage(msg1);
        await sleep(1200);

        // 2. エリア演出 Part 2 (効果音と画面エフェクト)
        this.logMessage(msg2);
        this.playSound(sfxMode);

        const container = document.getElementById('game-container');
        if (container && effectClass) {
            container.classList.add(effectClass);
            setTimeout(() => {
                container.classList.remove(effectClass);
            }, effectDuration);
        }

        // レア度ガチャ的な溜め
        let rarityName = "";
        let waitTime = 1200;
        let flashColor = "";
        
        // ガチャの色や揺れ
        if (rarity === 5) {
            rarityName = "レジェンド(LR)";
            flashColor = "0 0 40px #ff00ff, 0 0 80px #ff0000";
            waitTime = 1500;
            await sleep(800);
            this.logMessage("！！！！");
            document.body.classList.add('camera-shake');
            this.playSound('damage');
            setTimeout(() => document.body.classList.remove('camera-shake'), 800);
            await sleep(800);
        } else if (rarity === 4) {
            rarityName = "ウルトラレア(UR)";
            flashColor = "0 0 30px #ffaa00, 0 0 60px #ffff00";
            waitTime = 1000;
            await sleep(800);
            this.logMessage("！！！！");
            document.body.classList.add('camera-shake');
            this.playSound('damage');
            setTimeout(() => document.body.classList.remove('camera-shake'), 600);
            await sleep(800);
        } else if (rarity === 3) {
            rarityName = "スーパーレア(SSR)";
            flashColor = "0 0 25px #ffffff, 0 0 50px #aaaaaa";
            waitTime = 800;
            await sleep(1000);
        } else if (rarity === 2) {
            rarityName = "レア(SR)";
            flashColor = "0 0 20px #00ff00";
            waitTime = 800;
            await sleep(1000);
        } else {
            rarityName = "コモン(R)";
            flashColor = "0 0 15px #00aaff";
            waitTime = 500;
            await sleep(1000);
        }
        
        const enemyWindow = document.getElementById('enemy-window');
        let originalShadow = "";
        if (enemyWindow && rarity >= 2) {
            originalShadow = enemyWindow.style.boxShadow;
            enemyWindow.style.boxShadow = flashColor;
            enemyWindow.style.transition = "box-shadow 0.2s ease-in";
        }

        await sleep(waitTime);
        
        if (enemyWindow && rarity >= 2) {
            enemyWindow.style.boxShadow = originalShadow;
        }

        // 3. Reveal Enemy
        this.logMessage(`✨ ${stars.replace(/⭐/g, '★')} ${rarityName}\n${this.currentEnemy.name} が あらわれた！`);

        // Fade In (Fast)
        this.elements.enemySprite.style.transition = 'opacity 0.2s ease-in';
        void this.elements.enemySprite.offsetWidth; // Trigger reflow
        this.elements.enemySprite.style.opacity = '1';
        if (this.elements.enemyStats) this.elements.enemyStats.style.opacity = '1';

        // 敵画像のCSSアニメーション発動
        this.elements.enemySprite.classList.add('enemy-enter');

        // Update Name with stars in UI if exists
        const nameEl = document.getElementById('battle-enemy-name');
        if (nameEl) nameEl.innerHTML = `<span style="font-size: 0.6em; color: #ffeb3b">${stars.replace(/⭐/g, '★')}</span><br>${this.currentEnemy.name}`;

        // BGM Start
        if (this.currentEnemy.isBoss || rarity === 5) {
            this.bgm.play('boss');
        } else {
            this.bgm.play('battle');
        }

        // Appear SFX -> try appear.mp3, fallback to alert sound
        const appearAudio = new Audio("assets/sfx/appear.mp3");
        appearAudio.play().catch(e => {
            this.playSound('pi'); // Alert sound
        });

        // Dramatic Pause before Command Menu (User requested "short dramatic pause")
        await sleep(1000);
        this.elements.enemySprite.classList.remove('enemy-enter');

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
        if (this.currentProblem.question.length > 20) {
            this.elements.questionText.classList.add('long-text');
        } else {
            this.elements.questionText.classList.remove('long-text');
        }
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
        let validEnemies = enemies.filter(e => e.image);

        // 選択中の世界に合わせて敏をフィルタ
        const world = this.currentWorld || 'beast';
        const worldFilteredEnemies = validEnemies.filter(e => e.encounterType === world);
        if (worldFilteredEnemies.length > 0) {
            validEnemies = worldFilteredEnemies;
        }

        // Initialize history if needed
        if (!this.recentEnemyIds) {
            this.recentEnemyIds = [];
        }

        // 世界を選んでいる場合はHP制限を世界に合わせて設定
        // 世界選択なし（デフォルト）はレベルベースの制限を使う
        let maxHpAllowance;
        if (this.currentWorld) {
            // 世界選択時: その世界の敵が全員出るようにHP上限を大きくする
            maxHpAllowance = 999; // 世界フィルタ済みなので HP制限は不要
        } else {
            // 世界未選択（旧挙動）: レベルに応じた制限
            if (this.player.lv >= 4) maxHpAllowance = 999;
            else if (this.player.lv >= 3) maxHpAllowance = 25;
            else if (this.player.lv >= 2) maxHpAllowance = 20;
            else maxHpAllowance = 15;
        }

        let enemyTemplate;
        let candidates = validEnemies.length > 0 ? validEnemies : enemies;
        
        // レベル制限とボス除外フィルタを適用（世界フィルタ済みリストに対して）
        let levelCandidates = candidates.filter(e => e.hp <= maxHpAllowance && !e.isBoss && e.id !== 'F001');

        if (levelCandidates.length === 0) {
            // HP制限に合う敵がいなければ、世界フィルタを維持したままHP制限を解除
            levelCandidates = candidates.filter(e => !e.isBoss && e.id !== 'F001');
        }

        if (levelCandidates.length === 0) {
            // 最終フォールバック（世界の敵が全くいないケース）
            levelCandidates = enemies.filter(e => !e.isBoss && e.id !== 'F001');
        }

        candidates = levelCandidates;

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
        if (problem.question.length > 20) {
            this.elements.questionText.classList.add('long-text');
        } else {
            this.elements.questionText.classList.remove('long-text');
        }

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
        // 通常の計算問題
        const normalQuestions = [
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

        // 今たたかっている敵の名前を取得（不明な場合は「謎のUMA」）
        const enemyName = this.currentEnemy ? this.currentEnemy.name : "なぞのUMA";

        // 敵のタイプに合わせて問題を変える
        const type = this.currentEnemy ? (this.currentEnemy.encounterType || 'beast') : 'beast';
        let wordQuestions = [];

        if (type === 'water') {
            wordQuestions = [
                { id: 101, q: `${enemyName}が 18m もぐったあと、7m ういてきた。いま 水（みず）の 上（うえ）から なんm？`, a: 11 },
                { id: 102, q: `${enemyName}がいる みずうみの ふかさは 25m。あと 9m で 下（した）に つく。いま なんm？`, a: 16 },
                { id: 103, q: `${enemyName}が 水（みず）しぶきを 14かい あげた。さらに 7かい あげた。ぜんぶで？`, a: 21 },
                { id: 104, q: `${enemyName}の ウロコを 13まい 見（み）つけた。あとで 6まい 見つけた。あわせて？`, a: 19 },
                { id: 105, q: `${enemyName}を さがして ふねが 20そう 出（で）た。そのうち 6そう もどった。のこりは？`, a: 14 }
            ];
        } else if (type === 'sky') {
            wordQuestions = [
                { id: 201, q: `${enemyName}が 空（そら）を 18m とんだあと、7m おりてきた。あわせて なんm うごいた？`, a: 25 },
                { id: 202, q: `${enemyName}が 14かい はばたいたあと、さらに 8かい バタバタさせた。ぜんぶで ひれは なんかい 動いた？`, a: 22 },
                { id: 203, q: `${enemyName}の はねが 15まい おちていた。あとで 8まい 見（み）つけた。あわせて？`, a: 23 },
                { id: 204, q: `${enemyName}が 空（そら）から 20m おりてきた。あと 6m で 土（つち）につく。はじめは なんmの ところに いた？`, a: 26 },
                { id: 205, q: `${enemyName}の とぶスピードが 16あがったあと、さらに 9あがった。あわせて？`, a: 25 }
            ];
        } else if (type === 'shadow') {
            wordQuestions = [
                { id: 301, q: `${enemyName}の あやしい ひかりが 13かい ぴかっとした。あとで 8かい ぴかっとした。あわせて？`, a: 21 },
                { id: 302, q: `${enemyName}の こわい 音（おと）が 16びょう なった。さらに 9びょう なった。あわせて？`, a: 25 },
                { id: 303, q: `${enemyName}の しゃしんを 12まい とった。5まいが おばけしゃしん だった。いつもの しゃしんは？`, a: 7 },
                { id: 304, q: `なぞのUMA ${enemyName} のウワサが 15こ あった。きょう 8こ ふえた。ぜんぶで？`, a: 23 },
                { id: 305, q: `${enemyName}から 20m にげたあと、うしろを 見（み）ると 6m さきに いた。ちかづいてきた キョリは？`, a: 14 }
            ];
        } else { // beast (森・獣人)
            wordQuestions = [
                { id: 401, q: `${enemyName}の 大（おお）きな 足（あし）あとが 15こ あった。さらに 8こ 見（み）つかった。ぜんぶで？`, a: 23 },
                { id: 402, q: `${enemyName}の なきごえが 14かい きこえた。あとから 7かい きこえた。あわせて？`, a: 21 },
                { id: 403, q: `${enemyName}から 20m にげた。そこから 6m すすんできた。いま はなれている キョリは なんm？`, a: 14 },
                { id: 404, q: `${enemyName}が 森（もり）の 木（き）を 12本（ほん） たおした。さらに 7本 たおした。あわせて？`, a: 19 },
                { id: 405, q: `${enemyName}は 16mと いわれていたが、ほんとうは 9m 小（ちい）さかった。ほんとうの 大（おお）きさは？`, a: 7 }
            ];
        }

        // 戦闘の「最後（とどめ）」かどうかを判定
        let isFinalPhase = false;
        if (this.currentEnemy) {
            const isDamaged = this.currentEnemy.hp < this.currentEnemy.maxHp;
            const isLowHp = this.currentEnemy.hp <= 15 || this.currentEnemy.hp <= (this.currentEnemy.maxHp * 0.4);
            if (isDamaged && isLowHp) {
                isFinalPhase = true;
            }
        }

        // 過去に出題した文章問題の履歴（直近5回分）
        if (!this.recentWordQuestions) {
            this.recentWordQuestions = [];
        }

        let selected;
        
        if (isFinalPhase) {
            // 直近出た問題を除外する
            let availableWords = wordQuestions.filter(q => !this.recentWordQuestions.includes(q.id));
            
            // もし弾きすぎて候補がなくなったら履歴をリセット
            if (availableWords.length === 0) {
                this.recentWordQuestions = [];
                availableWords = wordQuestions;
            }

            const randomIndex = Math.floor(Math.random() * availableWords.length);
            selected = availableWords[randomIndex];

            // 履歴を更新（最大5つまで覚える）
            this.recentWordQuestions.push(selected.id);
            if (this.recentWordQuestions.length > 5) {
                this.recentWordQuestions.shift(); 
            }
        } else {
            // 普通の計算問題（通常フェーズ）
            const randomIndex = Math.floor(Math.random() * normalQuestions.length);
            selected = normalQuestions[randomIndex];
        }

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
        this.showExpPopup(this.currentEnemy.exp);
        this.updatePlayerStats(); // Ensure UI updates immediately

        // 世界クリアカウントを記録
        if (!this.worldClears) this.worldClears = {};
        const world = this.currentWorld || 'beast';
        this.worldClears[world] = (this.worldClears[world] || 0) + 1;
        const currentClears = this.worldClears[world];

        // 次の世界の情報を取得
        const worldOrder = ['beast', 'water', 'sky', 'shadow'];
        const nextWorldIndex = worldOrder.indexOf(world) + 1;
        const nextWorldId = worldOrder[nextWorldIndex];
        
        if (nextWorldId) {
            const needed = 3;
            if (currentClears < needed) {
                this.logMessage(`✨ クリア！ あと ${needed - currentClears}回で つぎのせかい！`);
            } else if (currentClears === needed) {
                this.logMessage(`✨ おめでとう！ つぎのせかい が ひらいた！`);
            }
        }

        // 新しい世界の解放チェック
        this.checkWorldUnlock();
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
                
                // 次の行動を選択させる（オートで進ませない）
                this.logMessage("どうする？");
                this.elements.commandMenu.classList.remove('hidden');
                
                // コマンドボタンの中身を「つぎの敵」「マップへ戻る」に一時的に書き換える
                // （簡易的にやるため、既存のボタンを再利用）
                const btns = this.elements.commandBtns;
                if (btns.length >= 2) {
                    const originalTexts = Array.from(btns).map(b => b.innerHTML);
                    
                    btns[0].innerHTML = "⚔️ つぎの てき";
                    btns[1].innerHTML = "🗺️ マップへ もどる";
                    
                    const nextHandler = () => {
                        btns.forEach((b, i) => b.innerHTML = originalTexts[i]); // 戻す
                        btns[0].removeEventListener('click', nextHandler);
                        btns[1].removeEventListener('click', mapHandler);
                        this.startBattle();
                    };
                    
                    const mapHandler = () => {
                        btns.forEach((b, i) => b.innerHTML = originalTexts[i]); // 戻す
                        btns[0].removeEventListener('click', nextHandler);
                        btns[1].removeEventListener('click', mapHandler);
                        this.showMapScreen();
                    };
                    
                    btns[0].addEventListener('click', nextHandler);
                    btns[1].addEventListener('click', mapHandler);

                    // 逃げる、アイテムボタンは隠す
                    for(let i=2; i<btns.length; i++) btns[i].style.display = 'none';
                    
                    // 元に戻すためのクリーンアップ関数をセット
                    this.restoreCommandMenu = () => {
                        for(let i=1; i<btns.length; i++) btns[i].style.display = '';
                        btns[0].removeEventListener('click', nextHandler);
                        btns[1].removeEventListener('click', mapHandler);
                    };
                }
            }, 1500);
        }, 1500);
    }

    checkLevelUp() {
        const nextLevelExp = this.player.lv * 10;
        if (this.player.exp >= nextLevelExp) {
            this.player.lv++;
            this.player.maxHp += 10; // Increase Max HP
            this.player.hp = this.player.maxHp; // フルHP回復
            this.player.mp = Math.min(this.player.mp + 5, 50);

            this.updatePlayerStats();
            this.saveGame(); // オートセーブ
            this.playSound('win'); // レベルアップ効果音

            // ===== 全画面レベルアップ演出 =====
            const overlay = document.createElement('div');
            overlay.className = 'levelup-overlay';

            // 星を散らすアニメ要素
            const stars = ['⭐','✨','🌟','💫','⭐','✨','🌟'];
            stars.forEach((s, i) => {
                const star = document.createElement('span');
                star.className = 'levelup-star';
                star.textContent = s;
                star.style.left = `${Math.random() * 90}%`;
                star.style.animationDelay = `${i * 0.12}s`;
                overlay.appendChild(star);
            });

            // メインテキスト
            const lvText = document.createElement('div');
            lvText.className = 'levelup-lv';
            lvText.textContent = `LV ${this.player.lv}`;
            overlay.appendChild(lvText);

            const msgText = document.createElement('div');
            msgText.className = 'levelup-msg';
            msgText.textContent = 'ぼく つよくなった！';
            overlay.appendChild(msgText);

            const subText = document.createElement('div');
            subText.className = 'levelup-sub';
            subText.textContent = `HP が ふえた！（HP+10）`;
            overlay.appendChild(subText);

            document.getElementById('game-container').appendChild(overlay);

            // 3秒後に演出を消す
            setTimeout(() => {
                overlay.classList.add('levelup-fadeout');
                setTimeout(() => overlay.remove(), 500);
            }, 2800);

            return true;
        }
        return false;
    }

    // EXP 取得時の小ポップアップ
    showExpPopup(expAmount) {
        const popup = document.createElement('div');
        popup.className = 'exp-popup';
        popup.textContent = `EXP +${expAmount}`;
        // プレイヤーのHPパネル付近に表示
        const statsEl = document.getElementById('battle-player-stats');
        if (statsEl) {
            statsEl.appendChild(popup);
            setTimeout(() => popup.remove(), 1200);
        }
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

    // 新しい世界の解放演出をチェック
    checkWorldUnlock() {
        const worldOrder = ['beast', 'water', 'sky', 'shadow'];
        const worldNames = {
            beast: '🌲 もり',
            water: '🌊 みず',
            sky: '🌪 そら',
            shadow: '🌑 かげ'
        };
        const unlockAt = { water: 3, sky: 3, shadow: 3 };
        const clears = this.worldClears || {};
        if (!this.worldUnlockedEvents) this.worldUnlockedEvents = {};

        worldOrder.forEach((worldId, i) => {
            if (i === 0) return; // もりは最初から解放済
            const prevWorldId = worldOrder[i - 1];
            const threshold = unlockAt[worldId] || 3;
            const prevClears = clears[prevWorldId] || 0;

            // 閾値以上かつ、まだ演出を出していない場合
            if (prevClears >= threshold && !this.worldUnlockedEvents[worldId]) {
                this.worldUnlockedEvents[worldId] = true;
                this.showWorldUnlockedEffect(worldNames[worldId]);
                this.saveGame(); // フラグを保存
            }
        });
    }

    // 世界解放演出（全画面オーバーレイ）
    showWorldUnlockedEffect(worldName) {
        const overlay = document.createElement('div');
        overlay.className = 'world-unlock-overlay';
        overlay.innerHTML = `
            <div class="world-unlock-star">&#10024;</div>
            <div class="world-unlock-text">あたらしい せかい！</div>
            <div class="world-unlock-name">${worldName}</div>
            <div class="world-unlock-sub">が ひらいた！</div>
        `;
        document.getElementById('game-container').appendChild(overlay);

        this.playSound('win');

        setTimeout(() => {
            overlay.classList.add('world-unlock-fadeout');
            setTimeout(() => overlay.remove(), 600);
        }, 3500);
    }

    saveGame() {
        const saveData = {
            player: this.player,
            lvl1BossDefeated: this.lvl1BossDefeated || false,
            forestBossDefeated: this.forestBossDefeated || false,
            defeatedEnemies: this.defeatedEnemies || [],
            worldClears: this.worldClears || {},
            worldUnlockedEvents: this.worldUnlockedEvents || {}
        };
        localStorage.setItem('mathQuestSave', JSON.stringify(saveData));
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
                this.worldClears = saveData.worldClears || {};
                this.worldUnlockedEvents = saveData.worldUnlockedEvents || {};
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

        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().then(() => {
                    console.log("Audio unlocked via resume()");
                }).catch(e => console.log("resume() failed", e));
            }

            // Play silent buffer to force unlock logic for iOS
            const buffer = this.audioCtx.createBuffer(1, 1, 22050);
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioCtx.destination);
            source.start(0);
            console.log("Silent buffer played");

            // iOS WebKit Magic Trick: Play silent HTML5 audio explicitly
            const magicAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
            magicAudio.play().catch(e => console.log('Magic Audio unlock failed', e));

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
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const ctx = this.audioCtx;

        const playOsc = (oscType, freq, vol, duration) => {
            const doPlay = () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = oscType;
                osc.frequency.value = freq;
                gain.gain.value = vol;
                osc.start();
                osc.stop(ctx.currentTime + duration);
            };
            if (ctx.state === 'suspended') {
                ctx.resume().then(doPlay).catch(()=>{});
            } else {
                doPlay();
            }
        };

        if (type === 'pi') {
            playOsc('sine', 880, 0.6, 0.15);
        } else if (type === 'decision') {
            playOsc('sine', 1320, 0.6, 0.2);
        } else if (type === 'damage') {
            playOsc('sawtooth', 150, 0.3, 0.2);
        } else if (type === 'win') {
            this.playNote(523.25, 0.1); 
            setTimeout(() => this.playNote(523.25, 0.1), 100);
            setTimeout(() => this.playNote(523.25, 0.1), 200);
            setTimeout(() => this.playNote(659.25, 0.4), 300);
        } else if (type === 'start') {
            this.playNote(440, 0.1);
            setTimeout(() => this.playNote(554, 0.1), 100);
            setTimeout(() => this.playNote(659, 0.4), 200);
        } else if (type === 'footstep_heavy') {
            playOsc('triangle', 60, 0.5, 0.15);
        } else if (type === 'water_splash') {
            playOsc('sine', 300, 0.3, 0.3);
        } else if (type === 'wind_whoosh') {
            playOsc('triangle', 200, 0.2, 0.4);
        } else if (type === 'creepy_small') {
            playOsc('sawtooth', 2000, 0.05, 0.1);
            setTimeout(() => playOsc('sawtooth', 2100, 0.05, 0.1), 50);
        } else if (type === 'attack') {
            playOsc('square', 100, 0.8, 0.15);

            // Noise burst
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0.5;
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start();
            noise.stop(ctx.currentTime + 0.1);
        }
    }

    playNote(freq, time_or_duration, duration) {
        let dur = duration;
        if (dur === undefined) { dur = time_or_duration; }
        
        const doPlay = () => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.type = 'square';
            osc.frequency.value = freq; 
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(this.audioCtx.currentTime + dur);
        };

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(doPlay).catch(()=>{});
        } else {
            doPlay();
        }
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
        if (!this.isPlaying && type !== 'square') return; 

        const doPlay = () => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.value = vol;
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        };

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(doPlay).catch(()=>{});
        } else {
            doPlay();
        }
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
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                
                // Manually play tone without isPlaying check dependencies ideally
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.value = note.f;
                gain.gain.value = 0.2;
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.3);
            }, note.t);
        });
    }
}
