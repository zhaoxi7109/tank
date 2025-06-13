// 游戏状态管理类
class GameState {
    constructor() {
        // 游戏配置
        this.config = {
            // 地图设置
            mapRows: 20,
            mapCols: 25,
            
            // 游戏平衡
            maxEnemies: 8,
            enemySpawnRate: 3000, // 毫秒
            
            // 玩家设置
            playerStartLives: 3,
            playerMaxHealth: 100, // 每条生命的满血量
            
            // 难度设置
            difficultyLevels: {
                easy: {
                    enemySpeed: 0.7,
                    enemyHealth: 40,
                    enemyDamage: 12,
                    enemySpawnRate: 5000,
                    enemyAccuracy: 0.6,
                    maxEnemies: 3,
                    playerDamageMultiplier: 0.8,
                    scoreMultiplier: 0.8,
                    powerupSpawnRate: 8000,
                    name: '简单'
                },
                normal: {
                    enemySpeed: 1.0,
                    enemyHealth: 75,
                    enemyDamage: 20,
                    enemySpawnRate: 3000,
                    enemyAccuracy: 0.75,
                    maxEnemies: 5,
                    playerDamageMultiplier: 1.0,
                    scoreMultiplier: 1.0,
                    powerupSpawnRate: 10000,
                    name: '普通'
                },
                hard: {
                    enemySpeed: 1.3,
                    enemyHealth: 100,
                    enemyDamage: 30,
                    enemySpawnRate: 2000,
                    enemyAccuracy: 0.85,
                    maxEnemies: 7,
                    playerDamageMultiplier: 1.2,
                    scoreMultiplier: 1.5,
                    powerupSpawnRate: 12000,
                    name: '困难'
                },
                expert: {
                    enemySpeed: 1.5,
                    enemyHealth: 120,
                    enemyDamage: 40,
                    enemySpawnRate: 1500,
                    enemyAccuracy: 0.9,
                    maxEnemies: 10,
                    playerDamageMultiplier: 1.5,
                    scoreMultiplier: 2.0,
                    powerupSpawnRate: 15000,
                    name: '专家'
                }
            },
            
            // 得分设置
            scoreValues: {
                enemyKill: 100,
                wallDestroy: 10,
                survivalBonus: 1, // 每秒
                accuracyBonus: 50
            }
        };
        
        // 当前难度
        this.currentDifficulty = 'normal';
        
        this.reset();
    }
    
    // 重置游戏状态
    reset() {
        // 基本游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        
        // 玩家数据
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // 统计数据
        this.enemiesKilled = 0;
        this.bulletsShot = 0;
        this.bulletsHit = 0;
        this.wallsDestroyed = 0;
        this.playTime = 0;
        this.startTime = Date.now();
        this.totalEnemiesSpawned = 0; // 总共生成的敌人数量
        
        // 全局统计数据（不会重置）
        this.loadGlobalStats();
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.walls = [];
        this.explosions = [];
        this.particles = [];
        this.powerUps = [];
        
        // 地图数据
        this.mapGrid = [];
        this.mapRows = this.config.mapRows;
        this.mapCols = this.config.mapCols;
        
        // 画布尺寸
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.tileSize = 30;
        
        // 游戏设置
        this.maxEnemies = this.config.maxEnemies;
        this.enemySpawnRate = this.config.enemySpawnRate;
        
        // 特效
        this.screenShake = {
            intensity: 0,
            duration: 0
        };
        
        // 消息系统
        this.messages = [];
        

    }
    
    // 初始化游戏状态
    init() {
        this.calculateTileSize();
        this.updateDifficultySettings();
        

    }
    
    // 计算瓦片大小
    calculateTileSize() {
        // 根据画布尺寸和地图大小计算合适的瓦片大小
        const tileWidth = Math.floor(this.canvasWidth / this.mapCols);
        const tileHeight = Math.floor(this.canvasHeight / this.mapRows);
        
        this.tileSize = Math.min(tileWidth, tileHeight);
        
        // 确保瓦片大小至少为20像素
        this.tileSize = Math.max(20, this.tileSize);
    }
    
    // 更新难度设置
    updateDifficultySettings() {
        const difficulty = this.config.difficultyLevels[this.currentDifficulty];
        if (difficulty) {
            this.enemySpawnRate = difficulty.enemySpawnRate;
            this.maxEnemies = difficulty.maxEnemies;
            this.powerupSpawnRate = difficulty.powerupSpawnRate;
            
            // 通知UI更新难度显示
            if (window.uiManager) {
                window.uiManager.updateDifficultyDisplay(difficulty.name);
            }
            
            console.log(`难度已设置为: ${difficulty.name}`);
        }
    }
    
    // 设置难度
    setDifficulty(difficulty) {
        if (this.config.difficultyLevels[difficulty]) {
            this.currentDifficulty = difficulty;
            this.updateDifficultySettings();
    
        }
    }
    
    // 获取当前难度设置
    getDifficultySettings() {
        return this.config.difficultyLevels[this.currentDifficulty];
    }
    
    // 添加得分
    addScore(points, reason = '') {
        this.score += points;
        
        if (reason) {
            this.addMessage(`+${points} ${reason}`, 'score');
        }
        
        // 检查是否升级
        this.checkLevelUp();
    }
    
    // 检查升级
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.onLevelUp();
        }
    }
    
    // 升级处理
    onLevelUp() {
        this.addMessage(`等级提升! 等级 ${this.level}`, 'levelup');
        
        // 增加游戏难度
        this.maxEnemies = Math.min(15, this.maxEnemies + 1);
        this.enemySpawnRate = Math.max(1000, this.enemySpawnRate - 200);
        
        // 给玩家奖励
        if (this.player) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        }
        

    }
    
    // 记录敌人击杀
    recordEnemyKill() {
        this.enemiesKilled++;
        // 移除重复的命中计数，因为在Bullet.js中已经记录了命中
        this.addScore(this.config.scoreValues.enemyKill, '击杀敌人');
    }
    
    // 记录子弹发射
    recordBulletShot() {
        this.bulletsShot++;
    }
    
    // 记录子弹命中
    recordBulletHit() {
        this.bulletsHit++;
    }
    
    // 记录墙壁摧毁
    recordWallDestroy() {
        this.wallsDestroyed++;
        this.addScore(this.config.scoreValues.wallDestroy, '摧毁墙壁');
    }
    
    // 更新游戏时间
    updatePlayTime() {
        this.playTime = Date.now() - this.startTime;
        
        // 移除每秒自动加分，只有击杀敌人才加分
    }
    
    // 加载全局统计数据
    loadGlobalStats() {
        try {
            const saved = localStorage.getItem('tankGameGlobalStats');
            if (saved) {
                const stats = JSON.parse(saved);
                this.globalStats = {
                    highScore: stats.highScore || 0,
                    totalKills: stats.totalKills || 0,
                    totalPlayTime: stats.totalPlayTime || 0,
                    gamesPlayed: stats.gamesPlayed || 0
                };
            } else {
                this.globalStats = {
                    highScore: 0,
                    totalKills: 0,
                    totalPlayTime: 0,
                    gamesPlayed: 0
                };
            }
        } catch (e) {
            this.globalStats = {
                highScore: 0,
                totalKills: 0,
                totalPlayTime: 0,
                gamesPlayed: 0
            };
        }
    }
    
    // 保存全局统计数据
    saveGlobalStats() {
        try {
            localStorage.setItem('tankGameGlobalStats', JSON.stringify(this.globalStats));
        } catch (e) {
            console.warn('无法保存全局统计数据:', e);
        }
    }
    
    // 更新全局统计数据
    updateGlobalStats() {
        // 更新最高得分
        if (this.score > this.globalStats.highScore) {
            this.globalStats.highScore = this.score;
        }
        
        // 累加总击杀数（确保不重复累加）
        this.globalStats.totalKills += this.enemiesKilled;
        
        // 累加总游戏时间
        this.globalStats.totalPlayTime += Math.floor(this.playTime / 1000);
        
        // 增加游戏次数
        this.globalStats.gamesPlayed++;
        
        // 保存到本地存储
        this.saveGlobalStats();
        
        console.log('全局统计已更新:', this.globalStats);
    }
    
    // 添加屏幕震动
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    // 更新屏幕震动
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
                this.screenShake.duration = 0;
            } else {
                // 震动强度随时间线性衰减
                const progress = this.screenShake.duration / 100; // 基于100毫秒持续时间
                this.screenShake.intensity *= Math.max(0.1, progress); // 确保不会完全消失直到时间结束
            }
        }
    }
    
    // 添加消息
    addMessage(text, type = 'info', duration = 3000) {
        const message = {
            text,
            type,
            timestamp: Date.now(),
            duration,
            alpha: 1.0
        };
        
        this.messages.push(message);
        
        // 限制消息数量
        if (this.messages.length > 10) {
            this.messages.shift();
        }
    }
    
    // 更新消息
    updateMessages(deltaTime) {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const message = this.messages[i];
            const age = Date.now() - message.timestamp;
            
            if (age > message.duration) {
                this.messages.splice(i, 1);
            } else {
                // 淡出效果
                const fadeStart = message.duration * 0.7;
                if (age > fadeStart) {
                    const fadeProgress = (age - fadeStart) / (message.duration - fadeStart);
                    message.alpha = 1.0 - fadeProgress;
                }
            }
        }
    }
    
    // 添加粒子
    addParticle(particle) {
        this.particles.push(particle);
        
        // 限制粒子数量
        if (this.particles.length > 500) {
            this.particles.shift();
        }
    }
    
    // 添加爆炸效果
    addExplosion(x, y, type = 'normal', options = {}) {
        const explosion = new Explosion(x, y, type, options);
        this.explosions.push(explosion);
        
        // 添加屏幕震动（强度降低到10%）
        let shakeIntensity = 0.05;
        switch (type) {
            case 'small': shakeIntensity = 0.03; break;
            case 'medium': shakeIntensity = 0.05; break;
            case 'large': shakeIntensity = 0.08; break;
            case 'super': shakeIntensity = 0.12; break;
        }
        this.addScreenShake(shakeIntensity, 100);
        
        // 限制爆炸数量
        if (this.explosions.length > 50) {
            this.explosions.shift();
        }
    }
    
    // 更新粒子
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新粒子位置
            particle.x += particle.vx * deltaTime / 16;
            particle.y += particle.vy * deltaTime / 16;
            
            // 更新粒子生命
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 创建爆炸粒子
    createExplosionParticles(x, y, count = 20, color = '#ff6600') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                life: 500 + Math.random() * 500,
                maxLife: 1000,
                alpha: 1.0,
                active: true
            };
            
            this.addParticle(particle);
        }
    }
    
    // 获取游戏统计
    getGameStats() {
        const accuracy = this.bulletsShot > 0 ? 
            (this.bulletsHit / this.bulletsShot * 100).toFixed(1) : 0;
        
        return {
            score: this.score,
            level: this.level,
            lives: this.lives,
            enemiesKilled: this.enemiesKilled,
            bulletsShot: this.bulletsShot,
            bulletsHit: this.bulletsHit,
            accuracy: accuracy + '%',
            wallsDestroyed: this.wallsDestroyed,
            playTime: this.formatTime(this.playTime),
            difficulty: this.currentDifficulty
        };
    }
    
    // 获取对象数量统计
    getObjectCounts() {
        return {
            enemies: this.enemies.filter(e => e.active).length,
            bullets: this.bullets.filter(b => b.active).length,
            walls: this.walls.filter(w => w.active).length,
            explosions: this.explosions.filter(e => e.active).length,
            particles: this.particles.length,
            messages: this.messages.length
        };
    }
    
    // 清理无效对象
    cleanup() {
        // 清理非活跃的敌人
        this.enemies = this.enemies.filter(enemy => enemy.active);
        
        // 清理非活跃的子弹
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        // 清理非活跃的墙壁
        this.walls = this.walls.filter(wall => wall.active);
        
        // 清理非活跃的爆炸
        this.explosions = this.explosions.filter(explosion => explosion.active);
        
        // 清理过期的消息
        this.updateMessages(0);
        
        // 清理死亡的粒子
        this.particles = this.particles.filter(particle => particle.life > 0);
    }
    
    // 保存游戏状态
    saveState() {
        const saveData = {
            score: this.score,
            level: this.level,
            lives: this.lives,
            difficulty: this.currentDifficulty,
            playTime: this.playTime,
            stats: this.getGameStats(),
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('tankGameSave', JSON.stringify(saveData));

            return true;
        } catch (error) {

            return false;
        }
    }
    
    // 加载游戏状态
    loadState() {
        try {
            const saveData = localStorage.getItem('tankGameSave');
            if (saveData) {
                const data = JSON.parse(saveData);
                
                this.score = data.score || 0;
                this.level = data.level || 1;
                this.lives = data.lives || 3;
                this.currentDifficulty = data.difficulty || 'normal';
                this.playTime = data.playTime || 0;
                
                this.updateDifficultySettings();
                
    
                return true;
            }
        } catch (error) {

        }
        
        return false;
    }
    
    // 删除保存的状态
    deleteSaveState() {
        try {
            localStorage.removeItem('tankGameSave');

            return true;
        } catch (error) {

            return false;
        }
    }
    
    // 格式化时间
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }
    
    // 检查游戏是否结束
    checkGameOver() {
        if (!this.player || !this.player.active) {
            if (this.lives <= 0) {
                this.gameOver = true;
                return true;
            }
        }
        return false;
    }
    
    // 获取配置
    getConfig() {
        return { ...this.config };
    }
    
    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.updateDifficultySettings();
    }
}