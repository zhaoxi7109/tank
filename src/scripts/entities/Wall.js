// 墙壁类
class Wall {
    constructor(x, y, width, height, type = 'brick') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.active = true;
        
        // 根据类型设置属性
        this.setupWallProperties();
        
        // 特殊效果
        this.animationTime = 0;
        this.lastHealTime = 0;
        this.glowIntensity = 0;
        
        // 边界墙标记
        this.isBoundary = (type === 'boundary');
    }
    
    // 根据类型设置墙壁属性
    setupWallProperties() {
        switch (this.type) {
            case 'brick':
                this.health = 50;
                this.maxHealth = 50;
                this.color = '#8B4513';
                this.destructible = true;
                break;
                
            case 'steel':
                this.health = 150;
                this.maxHealth = 150;
                this.color = '#708090';
                this.destructible = true;
                break;
                
            case 'explosive':
                this.health = 30;
                this.maxHealth = 30;
                this.color = '#FF4500';
                this.destructible = true;
                this.explosionRadius = 80;
                break;
                
            case 'reflective':
                this.health = 100;
                this.maxHealth = 100;
                this.color = '#4169E1';
                this.destructible = true;
                break;
                
            case 'healing':
                this.health = 80;
                this.maxHealth = 80;
                this.color = '#32CD32';
                this.destructible = true;
                this.healRate = 2; // 每秒恢复2点血量
                break;
                
            case 'crystal':
                this.health = 200;
                this.maxHealth = 200;
                this.color = '#FF69B4';
                this.destructible = true;
                this.shieldRegenRate = 1000; // 1秒恢复1点护盾
                break;
                
            case 'boundary':
                this.health = Infinity;
                this.maxHealth = Infinity;
                this.color = '#2F4F4F';
                this.destructible = false;
                break;
                
            default:
                this.health = 50;
                this.maxHealth = 50;
                this.color = '#8B4513';
                this.destructible = true;
        }
    }
    
    // 更新墙壁状态
    update(gameState) {
        if (!this.active) return;
        
        this.animationTime += 16; // 假设60FPS
        
        // 特殊墙壁的更新逻辑
        switch (this.type) {
            case 'healing':
                this.updateHealingWall(gameState);
                break;
            case 'crystal':
                this.updateCrystalWall(gameState);
                break;
            case 'explosive':
                this.updateExplosiveWall();
                break;
            case 'reflective':
                this.updateReflectiveWall();
                break;
        }
        
        // 自愈逻辑（自愈墙）
        if (this.type === 'healing' && this.health < this.maxHealth) {
            const now = Date.now();
            if (now - this.lastHealTime >= 1000) { // 每秒恢复
                this.health = Math.min(this.maxHealth, this.health + this.healRate);
                this.lastHealTime = now;
            }
        }
    }
    
    // 更新治疗墙
    updateHealingWall(gameState) {
        // 检查附近的友方单位并治疗
        const healRange = 60;
        const { player } = gameState;
        
        if (player && player.active && player.type === 'player') {
            const distance = Math.sqrt(
                Math.pow(player.x + player.width/2 - (this.x + this.width/2), 2) +
                Math.pow(player.y + player.height/2 - (this.y + this.height/2), 2)
            );
            
            if (distance <= healRange) {
                // 治疗玩家
                const now = Date.now();
                if (now - this.lastHealTime >= 1000) {
                    gameState.healPlayer(5); // 每秒恢复5点血量
                    this.lastHealTime = now;
                    
                    // 创建治疗特效
                    gameState.addSpecialEffect({
                        type: 'heal',
                        x: player.x + player.width/2,
                        y: player.y + player.height/2,
                        duration: 500
                    });
                }
            }
        }
        
        // 发光效果
        this.glowIntensity = 0.5 + 0.3 * Math.sin(this.animationTime * 0.005);
    }
    
    // 更新水晶墙
    updateCrystalWall(gameState) {
        // 水晶墙的闪烁效果
        this.glowIntensity = 0.7 + 0.3 * Math.sin(this.animationTime * 0.008);
        
        // 护盾再生（如果有护盾系统）
        const now = Date.now();
        if (now - this.lastHealTime >= this.shieldRegenRate) {
            // 为附近的友方单位提供护盾
            const { player } = gameState;
            if (player && player.active) {
                const distance = Math.sqrt(
                    Math.pow(player.x + player.width/2 - (this.x + this.width/2), 2) +
                    Math.pow(player.y + player.height/2 - (this.y + this.height/2), 2)
                );
                
                if (distance <= 80) {
                    // 激活玩家护盾
                    if (player.specialAbilities && player.specialAbilities.shield) {
                        player.specialAbilities.shield.active = true;
                        player.specialAbilities.shield.duration = 3000;
                    }
                    this.lastHealTime = now;
                }
            }
        }
    }
    
    // 更新爆炸墙
    updateExplosiveWall() {
        // 爆炸墙的危险闪烁
        if (this.health < this.maxHealth * 0.5) {
            this.glowIntensity = 0.8 + 0.2 * Math.sin(this.animationTime * 0.02);
        }
    }
    
    // 更新反射墙
    updateReflectiveWall() {
        // 反射墙的能量波动
        this.glowIntensity = 0.4 + 0.4 * Math.sin(this.animationTime * 0.01);
    }
    
    // 受到伤害
    takeDamage(damage) {
        if (!this.destructible) return false;
        
        this.health -= damage;
        
        // 创建受击效果
        this.glowIntensity = 1.0;
        
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true; // 墙壁被摧毁
        }
        
        return false; // 墙壁受损但未被摧毁
    }
    
    // 爆炸（爆炸墙专用）
    explode(gameState) {
        if (this.type !== 'explosive') return;
        
        // 对爆炸范围内的所有单位造成伤害
        const explosionX = this.x + this.width / 2;
        const explosionY = this.y + this.height / 2;
        
        // 伤害玩家
        const { player } = gameState;
        if (player && player.active) {
            const distance = Math.sqrt(
                Math.pow(player.x + player.width/2 - explosionX, 2) +
                Math.pow(player.y + player.height/2 - explosionY, 2)
            );
            
            if (distance <= this.explosionRadius) {
                const damage = Math.max(10, 50 - distance);
                player.takeDamage(damage);
            }
        }
        
        // 伤害敌方坦克
        const { enemies } = gameState;
        if (enemies) {
            enemies.forEach(enemy => {
                if (enemy.active) {
                    const distance = Math.sqrt(
                        Math.pow(enemy.x + enemy.width/2 - explosionX, 2) +
                        Math.pow(enemy.y + enemy.height/2 - explosionY, 2)
                    );
                    
                    if (distance <= this.explosionRadius) {
                        const damage = Math.max(10, 50 - distance);
                        enemy.takeDamage(damage);
                    }
                }
            });
        }
        
        // 伤害附近的其他墙壁
        const { walls } = gameState;
        if (walls) {
            walls.forEach(wall => {
                if (wall !== this && wall.active && wall.destructible) {
                    const distance = Math.sqrt(
                        Math.pow(wall.x + wall.width/2 - explosionX, 2) +
                        Math.pow(wall.y + wall.height/2 - explosionY, 2)
                    );
                    
                    if (distance <= this.explosionRadius) {
                        const damage = Math.max(5, 30 - distance * 0.5);
                        wall.takeDamage(damage);
                    }
                }
            });
        }
        
        this.active = false;
    }
    
    // 绘制墙壁
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 根据类型绘制不同效果
        switch (this.type) {
            case 'brick':
                this.drawBrickWall(ctx);
                break;
            case 'steel':
                this.drawSteelWall(ctx);
                break;
            case 'explosive':
                this.drawExplosiveWall(ctx);
                break;
            case 'reflective':
                this.drawReflectiveWall(ctx);
                break;
            case 'healing':
                this.drawHealingWall(ctx);
                break;
            case 'crystal':
                this.drawCrystalWall(ctx);
                break;
            case 'boundary':
                this.drawBoundaryWall(ctx);
                break;
            default:
                this.drawBrickWall(ctx);
        }
        
        // 绘制血量条（如果受损）
        if (this.destructible && this.health < this.maxHealth && this.health > 0) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    // 绘制砖墙
    drawBrickWall(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 砖块纹理
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        
        // 水平线
        for (let i = 1; i < 3; i++) {
            const y = this.y + (this.height / 3) * i;
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
        
        // 垂直线（交错）
        for (let row = 0; row < 3; row++) {
            const y = this.y + (this.height / 3) * row;
            const offset = (row % 2) * (this.width / 4);
            
            for (let i = 1; i < 4; i++) {
                const x = this.x + (this.width / 4) * i + offset;
                if (x < this.x + this.width) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + this.height / 3);
                    ctx.stroke();
                }
            }
        }
    }
    
    // 绘制钢墙
    drawSteelWall(ctx) {
        // 基础颜色
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 金属光泽
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 钢板接缝
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 2;
        
        // 十字接缝
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.moveTo(this.x, this.y + this.height/2);
        ctx.lineTo(this.x + this.width, this.y + this.height/2);
        ctx.stroke();
    }
    
    // 绘制爆炸墙
    drawExplosiveWall(ctx) {
        // 基础颜色
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 危险标志
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', this.x + this.width/2, this.y + this.height/2 + 6);
        
        // 闪烁效果（当受损时）
        if (this.glowIntensity > 0.5) {
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 10 * this.glowIntensity;
            ctx.fillStyle = `rgba(255, 69, 0, ${this.glowIntensity * 0.3})`;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    // 绘制反射墙
    drawReflectiveWall(ctx) {
        // 基础颜色
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 能量波动效果
        ctx.shadowColor = '#4169E1';
        ctx.shadowBlur = 5 + 5 * this.glowIntensity;
        
        // 反射面
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, `rgba(65, 105, 225, ${0.3 + 0.2 * this.glowIntensity})`);
        gradient.addColorStop(0.5, `rgba(135, 206, 250, ${0.5 + 0.3 * this.glowIntensity})`);
        gradient.addColorStop(1, `rgba(65, 105, 225, ${0.3 + 0.2 * this.glowIntensity})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 能量线条
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * this.glowIntensity})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            const offset = (this.animationTime * 0.01 + i * Math.PI / 3) % (Math.PI * 2);
            const x = this.x + this.width/2 + Math.cos(offset) * this.width/4;
            const y = this.y + this.height/2 + Math.sin(offset) * this.height/4;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 绘制治疗墙
    drawHealingWall(ctx) {
        // 基础颜色
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 治疗光环
        ctx.shadowColor = '#32CD32';
        ctx.shadowBlur = 8 * this.glowIntensity;
        
        // 十字标志
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + this.width/2 - 2, this.y + 8, 4, this.height - 16);
        ctx.fillRect(this.x + 8, this.y + this.height/2 - 2, this.width - 16, 4);
        
        // 治疗粒子效果
        for (let i = 0; i < 5; i++) {
            const angle = (this.animationTime * 0.005 + i * Math.PI * 2 / 5) % (Math.PI * 2);
            const radius = 15 + 5 * Math.sin(this.animationTime * 0.01 + i);
            const x = this.x + this.width/2 + Math.cos(angle) * radius;
            const y = this.y + this.height/2 + Math.sin(angle) * radius;
            
            ctx.fillStyle = `rgba(50, 205, 50, ${0.3 + 0.3 * this.glowIntensity})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制水晶墙
    drawCrystalWall(ctx) {
        // 基础颜色
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 水晶光效
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 10 * this.glowIntensity;
        
        // 水晶面
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        ctx.fillStyle = `rgba(255, 105, 180, ${0.4 + 0.3 * this.glowIntensity})`;
        ctx.beginPath();
        ctx.moveTo(centerX, this.y + 5);
        ctx.lineTo(this.x + this.width - 5, centerY);
        ctx.lineTo(centerX, this.y + this.height - 5);
        ctx.lineTo(this.x + 5, centerY);
        ctx.closePath();
        ctx.fill();
        
        // 内部光芒
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * this.glowIntensity})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制边界墙
    drawBoundaryWall(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 边界纹理
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 1;
        
        // 网格纹理
        for (let i = 0; i <= 4; i++) {
            const x = this.x + (this.width / 4) * i;
            const y = this.y + (this.height / 4) * i;
            
            if (i <= 4) {
                ctx.beginPath();
                ctx.moveTo(x, this.y);
                ctx.lineTo(x, this.y + this.height);
                ctx.stroke();
            }
            
            if (i <= 4) {
                ctx.beginPath();
                ctx.moveTo(this.x, y);
                ctx.lineTo(this.x + this.width, y);
                ctx.stroke();
            }
        }
    }
    
    // 绘制血量条
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 3;
        const barX = this.x;
        const barY = this.y - 6;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const healthPercent = this.health / this.maxHealth;
        let healthColor = '#4CAF50';
        if (healthPercent < 0.5) healthColor = '#FF9800';
        if (healthPercent < 0.25) healthColor = '#F44336';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}