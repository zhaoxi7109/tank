// 小地图管理器
class MinimapManager {
    constructor(containerId) {
        // 创建canvas元素
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'minimap-canvas';
        
        // 确保canvas元素有效并且可以获取2D上下文
        if (!this.canvas || typeof this.canvas.getContext !== 'function') {
            throw new Error('无效的canvas元素或不支持getContext方法');
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('无法获取2D渲染上下文');
        }
        this.enabled = true;
        this.scale = 0.1; // 缩放比例
        this.width = 140;
        this.height = 105;
        this.padding = 5;
        
        // 颜色配置
        this.colors = {
            background: 'rgba(0, 0, 0, 0.8)',
            border: '#ffffff',
            player: '#00ff00',
            enemy: '#ff0000',
            wall: '#666666',
            bullet: '#ffff00',
            explosion: '#ff8800',
            powerup: '#00ffff',
            grid: 'rgba(255, 255, 255, 0.1)'
        };
        
        // 显示选项
        this.showGrid = false;
        this.showBullets = true;
        this.showExplosions = true;
        this.showPowerups = true;
        this.showPlayerTrail = true;
        this.showEnemyPaths = false;
        
        // 玩家轨迹
        this.playerTrail = [];
        this.maxTrailLength = 50;
        
        // 敌人路径
        this.enemyPaths = new Map();
        this.maxPathLength = 30;
        
        this.setupCanvas();
    }
    
    // 设置画布
    setupCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        // 设置画布样式
        this.canvas.style.border = '2px solid #ffffff';
        this.canvas.style.borderRadius = '5px';
        this.canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    }
    
    // 更新小地图
    update(gameState) {
        if (!this.enabled || !gameState) return;
        
        // 更新玩家轨迹
        if (gameState.player && gameState.player.active) {
            this.updatePlayerTrail(gameState.player);
        }
        
        // 更新敌人路径
        this.updateEnemyPaths(gameState.enemies);
        
        // 绘制小地图
        this.render(gameState);
    }
    
    // 更新玩家轨迹
    updatePlayerTrail(player) {
        if (!this.showPlayerTrail) return;
        
        const trailPoint = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            timestamp: Date.now()
        };
        
        this.playerTrail.push(trailPoint);
        
        // 限制轨迹长度
        if (this.playerTrail.length > this.maxTrailLength) {
            this.playerTrail.shift();
        }
        
        // 移除过旧的轨迹点
        const now = Date.now();
        this.playerTrail = this.playerTrail.filter(point => 
            now - point.timestamp < 10000 // 10秒
        );
    }
    
    // 更新敌人路径
    updateEnemyPaths(enemies) {
        if (!this.showEnemyPaths) return;
        
        const now = Date.now();
        
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const enemyId = enemy.id || enemy.x + '_' + enemy.y;
            
            if (!this.enemyPaths.has(enemyId)) {
                this.enemyPaths.set(enemyId, []);
            }
            
            const path = this.enemyPaths.get(enemyId);
            const pathPoint = {
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                timestamp: now
            };
            
            path.push(pathPoint);
            
            // 限制路径长度
            if (path.length > this.maxPathLength) {
                path.shift();
            }
        }
        
        // 清理不活跃的敌人路径
        for (const [enemyId, path] of this.enemyPaths.entries()) {
            const lastPoint = path[path.length - 1];
            if (!lastPoint || now - lastPoint.timestamp > 5000) {
                this.enemyPaths.delete(enemyId);
            }
        }
    }
    
    // 渲染小地图
    render(gameState) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 计算缩放比例
        const scaleX = (this.width - this.padding * 2) / gameState.canvasWidth;
        const scaleY = (this.height - this.padding * 2) / gameState.canvasHeight;
        
        this.ctx.save();
        this.ctx.translate(this.padding, this.padding);
        
        // 绘制背景
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width - this.padding * 2, this.height - this.padding * 2);
        
        // 绘制网格
        if (this.showGrid) {
            this.drawGrid(gameState, scaleX, scaleY);
        }
        
        // 绘制玩家轨迹
        if (this.showPlayerTrail) {
            this.drawPlayerTrail(scaleX, scaleY);
        }
        
        // 绘制敌人路径
        if (this.showEnemyPaths) {
            this.drawEnemyPaths(scaleX, scaleY);
        }
        
        // 绘制墙壁
        this.drawWalls(gameState.walls, scaleX, scaleY);
        
        // 绘制道具
        if (this.showPowerups && gameState.powerups) {
            this.drawPowerups(gameState.powerups, scaleX, scaleY);
        }
        
        // 绘制子弹
        if (this.showBullets) {
            this.drawBullets(gameState.bullets, scaleX, scaleY);
        }
        
        // 绘制爆炸
        if (this.showExplosions && gameState.explosions) {
            this.drawExplosions(gameState.explosions, scaleX, scaleY);
        }
        
        // 绘制敌人
        this.drawEnemies(gameState.enemies, scaleX, scaleY);
        
        // 绘制玩家
        this.drawPlayer(gameState.player, scaleX, scaleY);
        
        this.ctx.restore();
        
        // 绘制边框
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);
        
        // 绘制信息
        this.drawInfo(gameState);
    }
    
    // 绘制网格
    drawGrid(gameState, scaleX, scaleY) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        const gridSize = 50; // 网格大小
        const scaledGridX = gridSize * scaleX;
        const scaledGridY = gridSize * scaleY;
        
        // 垂直线
        for (let x = 0; x < this.width - this.padding * 2; x += scaledGridX) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height - this.padding * 2);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y < this.height - this.padding * 2; y += scaledGridY) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width - this.padding * 2, y);
            this.ctx.stroke();
        }
    }
    
    // 绘制玩家轨迹
    drawPlayerTrail(scaleX, scaleY) {
        if (this.playerTrail.length < 2) return;
        
        this.ctx.strokeStyle = this.colors.player;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        
        this.ctx.beginPath();
        for (let i = 0; i < this.playerTrail.length; i++) {
            const point = this.playerTrail[i];
            const x = point.x * scaleX;
            const y = point.y * scaleY;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    // 绘制敌人路径
    drawEnemyPaths(scaleX, scaleY) {
        this.ctx.strokeStyle = this.colors.enemy;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        for (const path of this.enemyPaths.values()) {
            if (path.length < 2) continue;
            
            this.ctx.beginPath();
            for (let i = 0; i < path.length; i++) {
                const point = path[i];
                const x = point.x * scaleX;
                const y = point.y * scaleY;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    // 绘制墙壁
    drawWalls(walls, scaleX, scaleY) {
        this.ctx.fillStyle = this.colors.wall;
        
        for (const wall of walls) {
            if (!wall.active) continue;
            
            this.ctx.fillRect(
                wall.x * scaleX,
                wall.y * scaleY,
                wall.width * scaleX,
                wall.height * scaleY
            );
        }
    }
    
    // 绘制玩家
    drawPlayer(player, scaleX, scaleY) {
        if (!player || !player.active) return;
        
        this.ctx.fillStyle = this.colors.player;
        
        const x = player.x * scaleX;
        const y = player.y * scaleY;
        const width = Math.max(5, player.width * scaleX);
        const height = Math.max(5, player.height * scaleY);
        
        // 绘制玩家方块
        this.ctx.fillRect(x, y, width, height);
        
        // 绘制方向指示器
        this.ctx.strokeStyle = this.colors.player;
        this.ctx.lineWidth = 2;
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const dirX = Math.cos(player.angle) * width;
        const dirY = Math.sin(player.angle) * height;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + dirX, centerY + dirY);
        this.ctx.stroke();
    }
    
    // 绘制敌人
    drawEnemies(enemies, scaleX, scaleY) {
        this.ctx.fillStyle = this.colors.enemy;
        
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const x = enemy.x * scaleX;
            const y = enemy.y * scaleY;
            const width = Math.max(4, enemy.width * scaleX);
            const height = Math.max(4, enemy.height * scaleY);
            
            this.ctx.fillRect(x, y, width, height);
        }
    }
    
    // 绘制子弹
    drawBullets(bullets, scaleX, scaleY) {
        this.ctx.fillStyle = this.colors.bullet;
        
        for (const bullet of bullets) {
            if (!bullet.active) continue;
            
            const x = bullet.x * scaleX;
            const y = bullet.y * scaleY;
            const size = Math.max(1, 3 * Math.min(scaleX, scaleY));
            
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
        }
    }
    
    // 绘制爆炸
    drawExplosions(explosions, scaleX, scaleY) {
        for (const explosion of explosions) {
            if (!explosion.active) continue;
            
            const x = explosion.x * scaleX;
            const y = explosion.y * scaleY;
            const radius = explosion.radius * Math.min(scaleX, scaleY);
            
            this.ctx.fillStyle = this.colors.explosion;
            this.ctx.globalAlpha = 0.7;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    // 绘制道具
    drawPowerups(powerups, scaleX, scaleY) {
        this.ctx.fillStyle = this.colors.powerup;
        
        for (const powerup of powerups) {
            if (!powerup.active) continue;
            
            const x = powerup.x * scaleX;
            const y = powerup.y * scaleY;
            const size = Math.max(2, powerup.width * Math.min(scaleX, scaleY));
            
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
        }
    }
    
    // 绘制信息
    drawInfo(gameState) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '9px Arial';
        this.ctx.textAlign = 'left';
        
        // 显示敌人数量
        const enemyCount = gameState.enemies.filter(e => e.active).length;
        this.ctx.fillText(`敌人: ${enemyCount}`, 5, this.height - 18);
        
        // 显示当前难度
        const difficulty = gameState.getDifficultySettings();
        if (difficulty && difficulty.name) {
            this.ctx.fillText(`难度: ${difficulty.name}`, 5, this.height - 6);
        }
    }
    
    // 设置显示选项
    setShowGrid(show) {
        this.showGrid = show;
    }
    
    setShowBullets(show) {
        this.showBullets = show;
    }
    
    setShowExplosions(show) {
        this.showExplosions = show;
    }
    
    setShowPowerups(show) {
        this.showPowerups = show;
    }
    
    setShowPlayerTrail(show) {
        this.showPlayerTrail = show;
        if (!show) {
            this.playerTrail = [];
        }
    }
    
    setShowEnemyPaths(show) {
        this.showEnemyPaths = show;
        if (!show) {
            this.enemyPaths.clear();
        }
    }
    
    // 设置启用状态
    setEnabled(enabled) {
        this.enabled = enabled;
        this.canvas.style.display = enabled ? 'block' : 'none';
    }
    
    // 获取启用状态
    isEnabled() {
        return this.enabled;
    }
    
    // 调整大小
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.setupCanvas();
    }
    
    // 获取画布元素
    getCanvas() {
        return this.canvas;
    }
}

// 导出类
window.MinimapManager = MinimapManager;