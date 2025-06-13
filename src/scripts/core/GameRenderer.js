// 游戏渲染器类
class GameRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        
        // 渲染设置
        this.showDebugInfo = false;
        this.showFPS = true;
        this.showGrid = false;
        
        // 颜色主题
        this.colors = {
            background: '#1a1a1a',
            grid: '#333333',
            text: '#ffffff',
            ui: '#4CAF50',
            debug: '#ff0000'
        };
        
        // 字体设置
        this.fonts = {
            title: '48px Arial, sans-serif',
            subtitle: '24px Arial, sans-serif',
            ui: '16px Arial, sans-serif',
            debug: '12px monospace'
        };
    }
    
    // 主渲染方法
    render(gameState, options = {}) {
        this.clearCanvas();
        
        if (!gameState.gameStarted) {
            this.drawInitialScreen(gameState);
        } else if (gameState.gameOver) {
            this.drawGameOverScreen(gameState);
        } else {
            this.drawGame(gameState, options);
        }
        
        // 暂停状态下不绘制覆盖层，统一使用暂停菜单
        
        if (this.showFPS && options.fps !== undefined) {
            this.drawFPS(options.fps);
        }
    }
    
    // 清除画布
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    // 绘制初始画面
    drawInitialScreen(gameState) {
        const centerX = gameState.canvasWidth / 2;
        const centerY = gameState.canvasHeight / 2;
        
        // 绘制标题
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = this.fonts.title;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('坦克大战', centerX, centerY - 50);
        
        // 绘制提示文字
        this.ctx.font = this.fonts.subtitle;
        this.ctx.fillStyle = this.colors.ui;
        this.ctx.fillText('点击"开始游戏"按钮开始', centerX, centerY + 50);
        
        // 绘制控制说明
        this.ctx.font = this.fonts.ui;
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textAlign = 'left';
        
        const instructions = [
            '控制说明:',
            'WASD 或 方向键 - 移动',
            '空格键 或 鼠标左键 - 射击',
            'Q/E - 特殊技能',
            'P 或 ESC - 暂停游戏'
        ];
        
        const startY = centerY + 120;
        instructions.forEach((instruction, index) => {
            this.ctx.fillText(instruction, 50, startY + index * 25);
        });
    }
    
    // 绘制游戏画面
    drawGame(gameState, options) {
        // 绘制网格（如果启用）
        if (this.showGrid) {
            this.drawGrid(gameState);
        }
        
        // 绘制墙壁
        this.drawWalls(gameState.walls);
        
        // 绘制坦克
        this.drawTanks(gameState);
        
        // 绘制子弹
        this.drawBullets(gameState.bullets);
        
        // 绘制爆炸
        this.drawExplosions(gameState.explosions);
        
        // 绘制特效
        this.drawEffects(gameState);
        
        // 绘制调试信息
        if (this.showDebugInfo) {
            this.drawDebugInfo(gameState);
        }
    }
    
    // 绘制网格
    drawGrid(gameState) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        const tileSize = gameState.tileSize;
        
        // 绘制垂直线
        for (let x = 0; x <= gameState.canvasWidth; x += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, gameState.canvasHeight);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= gameState.canvasHeight; y += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(gameState.canvasWidth, y);
            this.ctx.stroke();
        }
    }
    
    // 绘制墙壁
    drawWalls(walls) {
        for (const wall of walls) {
            if (wall.active) {
                wall.draw(this.ctx);
            }
        }
    }
    
    // 绘制坦克
    drawTanks(gameState) {
        // 绘制敌方坦克
        for (const enemy of gameState.enemies) {
            if (enemy.active) {
                enemy.draw(this.ctx);
            }
        }
        
        // 绘制玩家坦克
        if (gameState.player && gameState.player.active) {
            gameState.player.draw(this.ctx);
        }
    }
    
    // 绘制子弹
    drawBullets(bullets) {
        for (const bullet of bullets) {
            if (bullet.active) {
                bullet.draw(this.ctx);
            }
        }
    }
    
    // 绘制爆炸
    drawExplosions(explosions) {
        for (const explosion of explosions) {
            if (explosion.active) {
                explosion.draw(this.ctx);
            }
        }
    }
    
    // 绘制特效
    drawEffects(gameState) {
        // 绘制粒子效果
        if (gameState.particles) {
            for (const particle of gameState.particles) {
                if (particle.active) {
                    this.drawParticle(particle);
                }
            }
        }
        
        // 绘制屏幕震动效果
        if (gameState.screenShake && gameState.screenShake.intensity > 0) {
            this.applyScreenShake(gameState.screenShake);
        }
    }
    
    // 绘制粒子
    drawParticle(particle) {
        this.ctx.save();
        
        this.ctx.globalAlpha = particle.alpha || 1;
        this.ctx.fillStyle = particle.color || '#ffffff';
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 应用屏幕震动
    applyScreenShake(screenShake) {
        const offsetX = (Math.random() - 0.5) * screenShake.intensity;
        const offsetY = (Math.random() - 0.5) * screenShake.intensity;
        
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
    }
    
    // 绘制暂停覆盖层
    drawPauseOverlay() {
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // 暂停文字
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = this.fonts.title;
        this.ctx.textAlign = 'center';
        
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        this.ctx.fillText('游戏暂停', centerX, centerY);
        
        this.ctx.font = this.fonts.subtitle;
        this.ctx.fillText('按 P 或 ESC 继续游戏', centerX, centerY + 60);
    }
    
    // 绘制游戏结束画面
    drawGameOverScreen(gameState) {
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, gameState.canvasWidth, gameState.canvasHeight);
        
        const centerX = gameState.canvasWidth / 2;
        const centerY = gameState.canvasHeight / 2;
        
        // 游戏结束标题
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = this.fonts.title;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束', centerX, centerY - 100);
        
        // 最终得分
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = this.fonts.subtitle;
        this.ctx.fillText(`最终得分: ${gameState.score}`, centerX, centerY - 40);
        
        // 统计信息
        this.ctx.font = this.fonts.ui;
        const stats = [
            `击杀敌人: ${gameState.enemiesKilled}`,
            `发射子弹: ${gameState.bulletsShot}`,
            `命中率: ${gameState.bulletsShot > 0 ? 
                (gameState.bulletsHit / gameState.bulletsShot * 100).toFixed(1) + '%' : '0%'}`,
            `游戏时长: ${this.formatTime(gameState.playTime)}`
        ];
        
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, centerX, centerY + 20 + index * 30);
        });
        
        // 重新开始提示
        this.ctx.fillStyle = this.colors.ui;
        this.ctx.font = this.fonts.subtitle;
        this.ctx.fillText('点击"重新开始"按钮再次游戏', centerX, centerY + 180);
    }
    
    // 绘制FPS
    drawFPS(fps) {
        this.ctx.fillStyle = this.colors.debug;
        this.ctx.font = this.fonts.debug;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
    }
    
    // 绘制调试信息
    drawDebugInfo(gameState) {
        this.ctx.fillStyle = this.colors.debug;
        this.ctx.font = this.fonts.debug;
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `玩家位置: (${Math.round(gameState.player?.x || 0)}, ${Math.round(gameState.player?.y || 0)})`,
            `敌人数量: ${gameState.enemies.length}`,
            `子弹数量: ${gameState.bullets.length}`,
            `墙壁数量: ${gameState.walls.length}`,
            `爆炸数量: ${gameState.explosions.length}`,
            `瓦片大小: ${gameState.tileSize}`,
            `画布尺寸: ${gameState.canvasWidth}x${gameState.canvasHeight}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 10, 50 + index * 15);
        });
        
        // 绘制碰撞框
        if (gameState.player) {
            this.drawCollisionBox(gameState.player, '#00ff00');
        }
        
        for (const enemy of gameState.enemies) {
            this.drawCollisionBox(enemy, '#ff0000');
        }
        
        for (const bullet of gameState.bullets) {
            this.drawCollisionBox(bullet, '#ffff00');
        }
    }
    
    // 绘制碰撞框
    drawCollisionBox(object, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(object.x, object.y, object.width, object.height);
    }
    
    // 绘制小地图
    drawMinimap(gameState, x, y, width, height) {
        this.ctx.save();
        
        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // 边框
        this.ctx.strokeStyle = this.colors.ui;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // 计算缩放比例
        const scaleX = width / gameState.canvasWidth;
        const scaleY = height / gameState.canvasHeight;
        
        // 绘制墙壁
        this.ctx.fillStyle = '#666666';
        for (const wall of gameState.walls) {
            if (wall.active) {
                this.ctx.fillRect(
                    x + wall.x * scaleX,
                    y + wall.y * scaleY,
                    wall.width * scaleX,
                    wall.height * scaleY
                );
            }
        }
        
        // 绘制玩家
        if (gameState.player && gameState.player.active) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(
                x + gameState.player.x * scaleX,
                y + gameState.player.y * scaleY,
                Math.max(2, gameState.player.width * scaleX),
                Math.max(2, gameState.player.height * scaleY)
            );
        }
        
        // 绘制敌人
        this.ctx.fillStyle = '#ff0000';
        for (const enemy of gameState.enemies) {
            if (enemy.active) {
                this.ctx.fillRect(
                    x + enemy.x * scaleX,
                    y + enemy.y * scaleY,
                    Math.max(2, enemy.width * scaleX),
                    Math.max(2, enemy.height * scaleY)
                );
            }
        }
        
        this.ctx.restore();
    }
    
    // 绘制血量条
    drawHealthBar(x, y, width, height, currentHealth, maxHealth, colors = {}) {
        const healthPercent = currentHealth / maxHealth;
        
        // 背景
        this.ctx.fillStyle = colors.background || '#333333';
        this.ctx.fillRect(x, y, width, height);
        
        // 血量
        let healthColor = colors.health || '#4CAF50';
        if (healthPercent < 0.3) {
            healthColor = colors.low || '#F44336';
        } else if (healthPercent < 0.6) {
            healthColor = colors.medium || '#FF9800';
        }
        
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, width * healthPercent, height);
        
        // 边框
        this.ctx.strokeStyle = colors.border || '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    // 绘制进度条
    drawProgressBar(x, y, width, height, progress, color = '#4CAF50') {
        // 背景
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, width, height);
        
        // 进度
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * progress, height);
        
        // 边框
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    // 绘制文字带阴影
    drawTextWithShadow(text, x, y, color = '#ffffff', shadowColor = '#000000', shadowOffset = 2) {
        // 阴影
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        
        // 文字
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
    
    // 格式化时间
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 设置渲染选项
    setRenderOptions(options) {
        if (options.showDebugInfo !== undefined) {
            this.showDebugInfo = options.showDebugInfo;
        }
        if (options.showFPS !== undefined) {
            this.showFPS = options.showFPS;
        }
        if (options.showGrid !== undefined) {
            this.showGrid = options.showGrid;
        }
    }
    
    // 获取渲染统计信息
    getRenderStats() {
        return {
            showDebugInfo: this.showDebugInfo,
            showFPS: this.showFPS,
            showGrid: this.showGrid,
            canvasSize: {
                width: this.ctx.canvas.width,
                height: this.ctx.canvas.height
            }
        };
    }
}