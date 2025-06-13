// 游戏引擎核心类
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas元素未找到: ${canvasId}`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('无法获取2D渲染上下文');
        }
        
        // 游戏状态
        try {
            this.gameState = new GameState();
            this.gameRenderer = new GameRenderer(this.ctx);
            this.eventHandler = new EventHandler();
            this.collisionDetector = new CollisionDetector();
            this.mapGenerator = new MapGenerator();
            
            // 初始化小地图（添加错误处理）
            try {
                this.minimapManager = new MinimapManager('minimap');
                
                // 将小地图画布添加到小地图容器中
                const minimapContainer = document.getElementById('minimap');
                if (minimapContainer) {
                    minimapContainer.appendChild(this.minimapManager.getCanvas());
                }
            } catch (minimapError) {
                console.warn('小地图初始化失败:', minimapError.message);
                this.minimapManager = null;
            }
        } catch (error) {
            throw new Error(`游戏组件初始化失败: ${error.message}`);
        }
        
        // 游戏循环
        this.lastTime = 0;
        this.gameLoopId = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // 性能监控
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        
        // 游戏设置
        this.targetFPS = 60;
        this.timeStep = 1000 / this.targetFPS;
        
        this.init();
    }
    
    // 初始化游戏引擎
    init() {
        this.initializeGame();
        this.setupCanvas();
        this.bindEvents();
        

    }
    
    // 设置画布
    setupCanvas() {
        this.resizeCanvas();
        
        // 监听窗口大小变化
        this.eventHandler.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // 设置画布显示尺寸
        this.canvas.style.width = containerRect.width + 'px';
        this.canvas.style.height = containerRect.height + 'px';
        
        // 设置画布实际尺寸（考虑设备像素比）
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = containerRect.width * dpr;
        this.canvas.height = containerRect.height * dpr;
        
        // 缩放上下文以匹配设备像素比
        this.ctx.scale(dpr, dpr);
        
        // 更新游戏状态中的画布尺寸
        this.gameState.canvasWidth = containerRect.width;
        this.gameState.canvasHeight = containerRect.height;
        
        // 重新计算瓦片大小
        this.gameState.calculateTileSize();
    }
    
    // 绑定事件
    bindEvents() {
        // 游戏控制事件
        this.eventHandler.addEventListener('keydown', (data) => {
            this.handleKeyDown(data);
        });
        
        this.eventHandler.addEventListener('keyup', (data) => {
            this.handleKeyUp(data);
        });
        
        // 窗口焦点事件
        this.eventHandler.addEventListener('blur', () => {
            if (this.isRunning && !this.isPaused) {
                this.pauseGame();
                this.pauseReason = 'blur'; // 标记暂停原因
            }
        });
        
        // 窗口获得焦点事件
        this.eventHandler.addEventListener('focus', () => {
            // 窗口重新获得焦点时不自动恢复游戏，需要用户手动恢复
        });
        
        // 绑定UI按钮事件
        this.bindUIEvents();
    }
    
    // 绑定UI事件
    bindUIEvents() {
        const startBtn = document.getElementById('start-button');
        const restartBtn = document.getElementById('restart-button');
        const pauseBtn = document.getElementById('pause-button');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // 暂停按钮事件在 main.js 中处理
    }
    
    // 处理按键按下
    handleKeyDown(data) {
        const { action } = data;
        
        switch (action) {
            case 'pause':
                this.togglePause();
                break;
            case 'shoot':
                if (this.isRunning && !this.isPaused && this.gameState.player) {
                    this.gameState.player.startCharging();
                }
                break;
            case 'special1':
                // Q键 - 激光射击
                if (this.isRunning && !this.isPaused && this.gameState.player && this.gameState.player.specialAbilities.laser.available) {
                    const bullet = this.gameState.player.createSpecialBullet('laser');
                    if (bullet) {
                        this.gameState.bullets.push(bullet);
                        this.gameState.recordBulletShot(); // 记录特殊技能发射
                        // 设置激光冷却
                        this.gameState.player.specialAbilities.laser.available = false;
                        this.gameState.player.specialAbilities.laser.cooldown = this.gameState.player.specialAbilities.laser.maxCooldown;
                    }
                }
                break;
            case 'special2':
                // E键 - 护盾
                if (this.isRunning && !this.isPaused && this.gameState.player && this.gameState.player.specialAbilities.shield.cooldown <= 0) {
                    this.gameState.player.specialAbilities.shield.active = true;
                    this.gameState.player.specialAbilities.shield.duration = this.gameState.player.specialAbilities.shield.maxDuration;
                }
                break;
        }
    }
    
    // 处理按键释放
    handleKeyUp(data) {
        const { action } = data;
        

        
        switch (action) {
            case 'shoot':
                if (this.isRunning && !this.isPaused && this.gameState.player) {
                    const newBullet = this.gameState.player.stopCharging();
                    if (newBullet) {
                        this.gameState.bullets.push(newBullet);
                        this.gameState.recordBulletShot();
                    }
                }
                break;
        }
    }
    
    // 使用特殊技能
    useSpecialSkill(skillIndex) {
        const player = this.gameState.player;
        if (!player || !player.active) return;
        
        switch (skillIndex) {
            case 1: // Q键 - 激光射击
                if (player.specialAbilities.superShot.available) {
                    const bullet = player.createSpecialBullet('laser');
                    if (bullet) {
                        this.gameState.bullets.push(bullet);
                        this.gameState.recordBulletShot(); // 记录特殊技能发射
                        player.specialAbilities.superShot.available = false;
                        player.specialAbilities.superShot.cooldown = 5000; // 5秒冷却
                    }
                }
                break;
            case 2: // E键 - 护盾
                if (!player.specialAbilities.shield.active) {
                    player.specialAbilities.shield.active = true;
                    player.specialAbilities.shield.duration = 3000; // 3秒护盾
                }
                break;
        }
    }
    
    // 初始化游戏
    initializeGame() {
        this.gameState.init();
        this.generateMap();
        this.createPlayer();
        
        // 绘制初始画面
        this.gameRenderer.drawInitialScreen(this.gameState);
    }
    
    // 生成地图
    generateMap() {
        const mapGrid = this.mapGenerator.generateRandomMap(
            this.gameState.mapRows,
            this.gameState.mapCols
        );
        
        this.gameState.mapGrid = mapGrid;
        this.createWalls();
    }
    
    // 创建墙壁
    createWalls() {
        this.gameState.walls = [];
        
        for (let row = 0; row < this.gameState.mapRows; row++) {
            for (let col = 0; col < this.gameState.mapCols; col++) {
                const wallType = this.mapGenerator.getWallType(this.gameState.mapGrid[row][col]);
                
                if (wallType) {
                    const wall = new Wall(
                        col * this.gameState.tileSize,
                        row * this.gameState.tileSize,
                        this.gameState.tileSize,
                        this.gameState.tileSize,
                        wallType
                    );
                    
                    this.gameState.walls.push(wall);
                }
            }
        }
    }
    
    // 创建玩家
    createPlayer() {
        const playerX = Math.floor(this.gameState.mapCols / 2) * this.gameState.tileSize;
        const playerY = (this.gameState.mapRows - 3) * this.gameState.tileSize;
        
        this.gameState.player = new Tank(
            playerX,
            playerY,
            this.gameState.tileSize * 0.8,
            this.gameState.tileSize * 0.8,
            'player'
        );
        
        // 确保玩家出生点畅通
        this.clearPlayerSpawnArea();
    }
    
    // 清除玩家出生区域
    clearPlayerSpawnArea() {
        const player = this.gameState.player;
        const clearRadius = this.gameState.tileSize * 2;
        
        this.gameState.walls = this.gameState.walls.filter(wall => {
            const dx = wall.x + wall.width / 2 - (player.x + player.width / 2);
            const dy = wall.y + wall.height / 2 - (player.y + player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance > clearRadius || wall.type === 'boundary';
        });
        
        // 清除敌人
        this.gameState.enemies = this.gameState.enemies.filter(enemy => {
            const dx = enemy.x + enemy.width / 2 - (player.x + player.width / 2);
            const dy = enemy.y + enemy.height / 2 - (player.y + player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance > clearRadius;
        });
    }
    
    // 开始游戏
    startGame() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.gameState.gameStarted = true;
            
            // 游戏开始时扣掉一条生命（从3变为2）
            this.gameState.lives--;
            
            // 初始化死亡处理标志
            this.playerDeathProcessed = false;
            
            // 开始生成敌人
            this.startEnemySpawning();
            
            // 开始游戏循环
            this.startGameLoop();
            
            // 更新UI
            this.updateUI();
            

        }
    }
    
    // 重新开始游戏
    restartGame() {
        this.stopGame();
        this.gameState.reset();
        this.generateMap();
        this.createPlayer();
        this.startGame();
        

    }
    
    // 暂停/恢复游戏
    togglePause() {
        if (this.isRunning) {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        }
    }
    
    // 暂停游戏
    pauseGame() {
        this.isPaused = true;
        
        // 只有手动暂停时才显示暂停菜单
        if (this.pauseReason !== 'blur') {
            this.showPauseMenu();
        }
        
        // 清除暂停原因标记
        this.pauseReason = null;
    }
    
    // 手动暂停游戏（显示暂停菜单）
    manualPause() {
        this.isPaused = true;
        this.showPauseMenu();
    }
    
    // 显示暂停菜单
    showPauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.remove('hidden');
            
            // 绑定暂停菜单按钮事件
            this.bindPauseMenuEvents();
        }
    }
    
    // 隐藏暂停菜单
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.add('hidden');
        }
    }
    
    // 绑定暂停菜单事件
    bindPauseMenuEvents() {
        // 继续游戏按钮
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.onclick = () => {
                this.resumeGame();
            };
        }
        
        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.hidePauseMenu();
                this.restartGame();
            };
        }
        
        // 主菜单按钮
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.onclick = () => {
                this.hidePauseMenu();
                this.stopGame();
                this.showStartMenu();
            };
        }
    }
    
    // 显示开始菜单
    showStartMenu() {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.classList.remove('hidden');
        }
    }

    // 恢复游戏
    resumeGame() {
        this.isPaused = false;
        this.hidePauseMenu();
    }
    
    // 停止游戏
    stopGame() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 停止敌人生成
        this.stopEnemySpawning();
        

    }
    
    // 开始游戏循环
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    // 游戏循环
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新FPS
        this.updateFPS(currentTime);
        
        // 更新手柄状态
        this.eventHandler.updateGamepadStates();
        
        if (!this.isPaused) {
            // 更新游戏逻辑
            this.update(deltaTime);
        } else {
            // 游戏暂停时仍需要更新屏幕震动以确保其能正常结束
            this.gameState.updateScreenShake(deltaTime);
        }
        
        // 渲染游戏
        this.render();
        
        // 继续游戏循环
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 更新游戏逻辑
    update(deltaTime) {
        // 更新游戏时间
        this.gameState.updatePlayTime();
        
        // 更新玩家
        if (this.gameState.player) {
            this.updatePlayer(deltaTime);
        }
        
        // 更新敌人
        this.updateEnemies(deltaTime);
        
        // 更新子弹
        this.updateBullets(deltaTime);
        
        // 更新墙壁
        this.updateWalls(deltaTime);
        
        // 更新爆炸
        this.updateExplosions(deltaTime);
        
        // 更新小地图
        if (this.minimapManager && this.minimapManager.update) {
            this.minimapManager.update(this.gameState);
        }
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        // 检查胜利条件
        this.checkVictory();
        
        // 更新UI
        this.updateUI();
    }
    
    // 更新玩家
    updatePlayer(deltaTime) {
        const player = this.gameState.player;
        if (!player.active) return;
        
        // 获取输入
        const movement = this.eventHandler.getMovementInput();
        const shooting = this.eventHandler.isShootPressed();
        
        // 确保movement对象有效
        if (!movement || typeof movement !== 'object') {
            return;
        }
        
        // 更新玩家状态
        player.update(deltaTime, {
            movement,
            shooting,
            walls: this.gameState.walls,
            enemies: this.gameState.enemies,
            bullets: this.gameState.bullets,
            collisionDetector: this.collisionDetector,
            canvasWidth: this.gameState.canvasWidth,
            canvasHeight: this.gameState.canvasHeight
        });
        
        // 射击现在由按键事件直接处理
    }
    
    // 更新敌人
    updateEnemies(deltaTime) {
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];
            
            if (!enemy.active) {
                this.gameState.enemies.splice(i, 1);
                continue;
            }
            
            const enemyBullet = enemy.update(deltaTime, {
                player: this.gameState.player,
                walls: this.gameState.walls,
                enemies: this.gameState.enemies,
                bullets: this.gameState.bullets,
                collisionDetector: this.collisionDetector,
                canvasWidth: this.gameState.canvasWidth,
                canvasHeight: this.gameState.canvasHeight
            });
            
            // 处理敌人射击的子弹
            if (enemyBullet) {
                this.gameState.bullets.push(enemyBullet);
            }
        }
    }
    

    
    // 更新子弹
    updateBullets(deltaTime) {
        for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = this.gameState.bullets[i];
            
            if (!bullet.active) {
                this.gameState.bullets.splice(i, 1);
                continue;
            }
            
            bullet.update(deltaTime, {
                walls: this.gameState.walls,
                tanks: [...this.gameState.enemies, this.gameState.player].filter(t => t && t.active),
                bullets: this.gameState.bullets,
                explosions: this.gameState.explosions,
                collisionDetector: this.collisionDetector,
                gameState: this.gameState,
                canvasWidth: this.gameState.canvasWidth,
                canvasHeight: this.gameState.canvasHeight
            });
        }
    }
    
    // 更新墙壁
    updateWalls(deltaTime) {
        for (let i = this.gameState.walls.length - 1; i >= 0; i--) {
            const wall = this.gameState.walls[i];
            
            if (!wall.active) {
                this.gameState.walls.splice(i, 1);
                continue;
            }
            
            wall.update(deltaTime, {
                player: this.gameState.player,
                enemies: this.gameState.enemies
            });
        }
    }
    
    // 更新爆炸
    updateExplosions(deltaTime) {
        for (let i = this.gameState.explosions.length - 1; i >= 0; i--) {
            const explosion = this.gameState.explosions[i];
            
            if (!explosion.active) {
                this.gameState.explosions.splice(i, 1);
                continue;
            }
            
            explosion.update(deltaTime);
        }
    }
    
    // 渲染游戏
    render() {
        this.gameRenderer.render(this.gameState, {
            isPaused: this.isPaused,
            fps: this.fps
        });
        
        // 渲染小地图
        if (this.minimapManager && typeof this.minimapManager.isEnabled === 'function' && this.minimapManager.isEnabled()) {
            this.minimapManager.render(this.gameState);
        }
    }
    
    // 开始敌人生成
    startEnemySpawning() {
        this.enemySpawnInterval = setInterval(() => {
            if (!this.isPaused && this.gameState.enemies.length < this.gameState.maxEnemies) {
                this.spawnEnemy();
            }
        }, this.gameState.enemySpawnRate);
    }
    
    // 停止敌人生成
    stopEnemySpawning() {
        if (this.enemySpawnInterval) {
            clearInterval(this.enemySpawnInterval);
            this.enemySpawnInterval = null;
        }
    }
    
    // 生成敌人
    spawnEnemy() {
        const spawnPositions = this.getEnemySpawnPositions();
        
        if (spawnPositions.length === 0) return;
        
        const spawnPos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
        
        const enemy = new Tank(
            spawnPos.x,
            spawnPos.y,
            this.gameState.tileSize * 0.8,
            this.gameState.tileSize * 0.8,
            'enemy'
        );
        
        this.gameState.enemies.push(enemy);
        this.gameState.totalEnemiesSpawned++; // 增加生成敌人计数
    }
    
    // 获取敌人生成位置
    getEnemySpawnPositions() {
        const positions = [];
        const tileSize = this.gameState.tileSize;
        const margin = tileSize * 2;
        
        // 在地图上边缘寻找合适的生成位置
        for (let col = 1; col < this.gameState.mapCols - 1; col++) {
            for (let row = 1; row < 4; row++) { // 只在上方几行生成
                const x = col * tileSize;
                const y = row * tileSize;
                
                // 检查是否与玩家距离足够远
                if (this.gameState.player) {
                    const dx = x - this.gameState.player.x;
                    const dy = y - this.gameState.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < margin) continue;
                }
                
                // 检查是否与墙壁碰撞
                const testRect = { x, y, width: tileSize * 0.8, height: tileSize * 0.8 };
                let collision = false;
                
                for (const wall of this.gameState.walls) {
                    if (this.collisionDetector.rectCollision(testRect, wall)) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    positions.push({ x, y });
                }
            }
        }
        
        return positions;
    }
    
    // 检查游戏结束
    checkGameOver() {
        if (!this.gameState.player || !this.gameState.player.active || this.gameState.player.health <= 0) {
            // 防止重复扣减生命，使用标志位
            if (!this.playerDeathProcessed) {
            this.playerDeathProcessed = true;
            // 玩家死亡时扣掉一条生命
            this.gameState.lives--;
            
            // 播放玩家死亡音效
            if (window.audioManager) {
                window.audioManager.play('player_death', 0.8, 1.0);
            }
            
            if (this.gameState.lives < 0) {
                this.gameOver();
            } else {
                this.respawnPlayer();
            }
        }
        }
    }
    
    // 检查胜利条件
    checkVictory() {
        // 只有在游戏开始且已经生成过敌人的情况下才检查胜利条件
        if (this.gameState.gameStarted && this.gameState.enemies.length === 0 && !this.gameState.gameOver) {
            // 确保至少已经尝试生成过敌人（避免游戏刚开始就胜利）
            if (this.gameState.totalEnemiesSpawned > 0) {
                this.victory();
            }
        }
    }
    
    // 胜利
    victory() {
        this.stopGame();
        this.gameState.gameOver = true;
        this.gameState.victory = true;
        
        // 播放胜利音效
        if (window.audioManager) {
            window.audioManager.play('victory', 0.8, 1.0);
        }
        
        // 更新全局统计数据
        if (this.gameState.updateGlobalStats) {
            this.gameState.updateGlobalStats();
        }
        
        // 显示胜利画面
        if (this.ui) {
            const stats = this.getGameStats();
            this.ui.showGameOverStats(stats);
        }
        
        // 显示胜利画面
        this.gameRenderer.drawGameOverScreen(this.gameState);
    }
    

    
    // 玩家复活
    respawnPlayer() {
        // 不在这里扣生命，生命扣减应该在玩家死亡时处理
        
        setTimeout(() => {
            this.createPlayer();
            // 恢复满血
            this.gameState.player.health = this.gameState.player.maxHealth;
            this.gameState.player.active = true;
            this.gameState.player.invulnerable = true;
            this.gameState.player.invulnerableTime = 3000; // 3秒无敌时间
            // 重置死亡处理标志，允许下次死亡时正常处理
            this.playerDeathProcessed = false;
        }, 2000);
    }
    
    // 游戏结束
    gameOver() {
        this.stopGame();
        this.gameState.gameOver = true;
        
        // 播放失败音效
        if (window.audioManager) {
            window.audioManager.play('game_over', 0.7, 1.0);
        }
        
        // 更新全局统计数据
        if (this.gameState.updateGlobalStats) {
            this.gameState.updateGlobalStats();
        }
        
        // 显示游戏结束菜单
        if (this.ui) {
            const stats = this.getGameStats();
            this.ui.showGameOverStats(stats);
        }
        
        // 显示游戏结束画面
        this.gameRenderer.drawGameOverScreen(this.gameState);
    }
    
    // 更新FPS
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }
    
    // 更新UI
    updateUI() {
        // 更新头部统计信息
        this.updateElement('scoreDisplay', this.gameState.score);
        this.updateElement('levelDisplay', this.gameState.level);
        this.updateElement('livesDisplay', this.gameState.lives);
        this.updateElement('timeDisplay', this.formatTime(this.gameState.playTime));
        
        // 更新玩家状态
        this.updatePlayerStatus();
        
        // 更新游戏信息
        this.updateGameInfo();
        
        // 更新技能冷却显示
        this.updateSkillCooldownDisplay();
    }
    
    // 更新玩家状态
    updatePlayerStatus() {
        if (!this.gameState.player) return;
        
        const player = this.gameState.player;
        
        // 更新生命值条
        const healthBar = document.getElementById('playerHealthBar');
        const healthText = document.getElementById('playerHealthText');
        if (healthBar && healthText) {
            const healthPercent = (player.health / player.maxHealth) * 100;
            healthBar.style.width = healthPercent + '%';
            healthText.textContent = `${player.health}/${player.maxHealth}`;
            
            // 根据血量改变颜色
            if (healthPercent > 60) {
                healthBar.style.backgroundColor = '#4CAF50';
            } else if (healthPercent > 30) {
                healthBar.style.backgroundColor = '#FF9800';
            } else {
                healthBar.style.backgroundColor = '#F44336';
            }
        }
        
        // 更新弹药显示
        this.updateElement('ammoDisplay', player.ammo === -1 ? '∞' : player.ammo);
        
        // 更新武器类型
        this.updateElement('weaponDisplay', this.getPlayerWeaponType());
        
        // 更新血量数值显示
        this.updateElement('playerLivesDisplay', player.health);
    }
    
    // 更新游戏信息
    updateGameInfo() {
        this.updateElement('enemyCount', this.gameState.enemies.length);
        this.updateElement('killCount', this.gameState.enemiesKilled);
        
        // 计算命中率
        const accuracy = this.gameState.bulletsShot > 0 ? 
            (this.gameState.bulletsHit / this.gameState.bulletsShot * 100).toFixed(1) : 0;
        this.updateElement('accuracyDisplay', accuracy + '%');
        
        // 更新全局统计数据
        if (this.gameState.globalStats) {
            this.updateElement('high-score', this.gameState.globalStats.highScore);
            this.updateElement('total-kills', this.gameState.globalStats.totalKills);
            this.updateElement('total-play-time', this.formatTime(this.gameState.globalStats.totalPlayTime));
        }
    }
    
    // 更新元素内容的辅助方法
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    // 格式化时间
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 更新血量显示
    updateHealthDisplay() {
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        
        if (healthBar && healthText && this.gameState.player) {
            const healthPercent = (this.gameState.player.health / this.gameState.player.maxHealth) * 100;
            healthBar.style.width = healthPercent + '%';
            healthText.textContent = `${this.gameState.player.health}/${this.gameState.player.maxHealth}`;
            
            // 根据血量改变颜色
            if (healthPercent > 60) {
                healthBar.style.backgroundColor = '#4CAF50';
            } else if (healthPercent > 30) {
                healthBar.style.backgroundColor = '#FF9800';
            } else {
                healthBar.style.backgroundColor = '#F44336';
            }
        }
    }
    
    // 更新技能冷却显示
    updateSkillCooldownDisplay() {
        if (!this.gameState.player) return;
        
        const player = this.gameState.player;
        
        // 更新激光技能冷却显示
        const laserCooldownElement = document.getElementById('laserCooldown');
        if (laserCooldownElement) {
            if (player.specialAbilities && player.specialAbilities.laser) {
                const laser = player.specialAbilities.laser;
                if (laser.available) {
                    laserCooldownElement.textContent = '就绪';
                    laserCooldownElement.style.color = '#4CAF50';
                } else {
                    const remainingTime = Math.ceil(laser.cooldown / 1000);
                    laserCooldownElement.textContent = `${remainingTime}s`;
                    laserCooldownElement.style.color = '#F44336';
                }
            }
        }
        
        // 更新超级子弹技能冷却显示
        const superShotCooldownElement = document.getElementById('superShotCooldown');
        if (superShotCooldownElement) {
            if (player.specialAbilities && player.specialAbilities.superShot) {
                const superShot = player.specialAbilities.superShot;
                if (superShot.available) {
                    superShotCooldownElement.textContent = '就绪';
                    superShotCooldownElement.style.color = '#4CAF50';
                } else {
                    const remainingTime = Math.ceil(superShot.cooldown / 1000);
                    superShotCooldownElement.textContent = `${remainingTime}s`;
                    superShotCooldownElement.style.color = '#F44336';
                }
            }
        }
        
        // 更新护盾技能显示
        const shieldStatusElement = document.getElementById('shieldCooldown');
        if (shieldStatusElement) {
            if (player.specialAbilities && player.specialAbilities.shield) {
                const shield = player.specialAbilities.shield;
                if (shield.active) {
                    const remainingTime = Math.ceil(shield.duration / 1000);
                    shieldStatusElement.textContent = `激活 ${remainingTime}s`;
                    shieldStatusElement.style.color = '#2196F3';
                } else if (shield.cooldown > 0) {
                    const cooldownTime = Math.ceil(shield.cooldown / 1000);
                    shieldStatusElement.textContent = `冷却 ${cooldownTime}s`;
                    shieldStatusElement.style.color = '#F44336';
                } else {
                    shieldStatusElement.textContent = '就绪';
                    shieldStatusElement.style.color = '#4CAF50';
                }
            }
        }
    }
    

    
    // 销毁游戏引擎
    destroy() {
        this.stopGame();
        this.eventHandler.destroy();
        

    }
    
    // 获取游戏统计信息
    getGameStats() {
        const accuracy = this.gameState.bulletsShot > 0 ? 
            Math.round((this.gameState.bulletsHit / this.gameState.bulletsShot) * 100) : 0;
        
        return {
            score: this.gameState.score,
            lives: this.gameState.lives,
            level: this.gameState.level,
            enemiesKilled: this.gameState.enemiesKilled,
            playTime: Math.floor(this.gameState.playTime / 1000),
            enemyCount: this.gameState.enemies.length,
            kills: this.gameState.enemiesKilled,
            accuracy: accuracy,
            playerLives: this.gameState.lives,
            maxLives: 3,
            ammo: this.gameState.player ? this.gameState.player.ammo : 0,
            weaponType: this.getPlayerWeaponType(),
            isVictory: this.gameState.victory || false,
            fps: this.fps,
            // 全局统计数据
            highScore: this.gameState.globalStats ? this.gameState.globalStats.highScore : 0,
            totalKills: this.gameState.globalStats ? this.gameState.globalStats.totalKills : 0,
            totalPlayTime: this.gameState.globalStats ? this.gameState.globalStats.totalPlayTime : 0
        };
    }
    
    // 获取玩家武器类型
    getPlayerWeaponType() {
        if (!this.gameState.player) return '普通';
        
        const player = this.gameState.player;
        if (player.specialAbilities) {
            if (player.specialAbilities.laser && player.specialAbilities.laser.active) {
                return '激光';
            }
            if (player.specialAbilities.superShot && player.specialAbilities.superShot.active) {
                return '超级子弹';
            }
        }
        return '普通';
    }
}