// 子弹类
class Bullet {
    constructor(x, y, direction, owner = 'player', type = 'normal') {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.owner = owner; // 'player' 或 'enemy'
        this.type = type; // 'normal', 'charged', 'super', 'laser'
        this.active = true;
        
        // 根据类型设置属性
        this.setupBulletProperties();
        
        // 设置速度向量
        this.setVelocity();
        
        // 特殊效果
        this.trail = []; // 轨迹效果
        this.maxTrailLength = this.type === 'laser' ? 15 : 8;
        
        // 激光子弹的特殊属性
        if (this.type === 'laser') {
            this.penetrationCount = 0;
            this.maxPenetration = 3;
        }
    }
    
    // 激光子弹的线性碰撞检测
    checkLaserCollisions(walls, tanks, gameState) {
        // 计算激光束的终点
        let endX = this.x;
        let endY = this.y;
        
        switch (this.direction) {
            case 'up':
                endY = this.y - this.laserLength;
                break;
            case 'down':
                endY = this.y + this.laserLength;
                break;
            case 'left':
                endX = this.x - this.laserLength;
                break;
            case 'right':
                endX = this.x + this.laserLength;
                break;
        }
        
        // 沿激光束路径检测碰撞
        const steps = Math.max(Math.abs(endX - this.x), Math.abs(endY - this.y));
        const stepX = (endX - this.x) / steps;
        const stepY = (endY - this.y) / steps;
        
        // 记录已经命中的坦克ID，避免重复伤害
        const hitTankIds = new Set();
        
        // 穿透计数器
        let penetrationCount = 0;
        const maxPenetration = this.maxPenetration;
        
        for (let i = 0; i <= steps; i += 2) { // 每2像素检测一次
            const checkX = this.x + stepX * i;
            const checkY = this.y + stepY * i;
            
            // 创建检测点
            const checkPoint = {
                x: checkX - 1,
                y: checkY - 1,
                width: 2,
                height: 2
            };
            
            // 检测与墙壁的碰撞
            for (const wall of walls) {
                if (wall.active && this.rectCollision(checkPoint, wall)) {
                    // 处理墙壁碰撞，但不立即返回，继续检测后续碰撞
                    if (wall.type === 'steel') {
                        wall.takeDamage(this.damage);
                        penetrationCount++;
                        if (penetrationCount >= maxPenetration) {
                            this.active = false;
                            return; // 达到最大穿透次数，停止检测
                        }
                    } else if (wall.type !== 'boundary') {
                        // 对普通墙壁造成伤害
                        wall.takeDamage(this.damage);
                        gameState.addExplosion(checkX, checkY, 'small');
                    }
                }
            }
            
            // 检测与坦克的碰撞
            for (const tank of tanks) {
                if (tank.active && this.rectCollision(checkPoint, tank) && !hitTankIds.has(tank.id)) {
                    // 敌方子弹不伤害敌方坦克（无友伤）
                    if (this.owner === 'enemy' && tank.type === 'enemy') {
                        continue;
                    }
                    // 玩家子弹不伤害玩家
                    if (this.owner === 'player' && tank.type === 'player') {
                        continue;
                    }
                    
                    // 计算实际伤害（穿透次数越多伤害越低）
                    let actualDamage = this.damage * Math.pow(0.8, penetrationCount);
                    
                    // 对坦克造成伤害
                    tank.takeDamage(actualDamage);
                    gameState.addExplosion(checkX, checkY, 'small');
                    
                    // 记录已命中的坦克，避免重复伤害
                    hitTankIds.add(tank.id);
                    
                    // 增加穿透计数
                    penetrationCount++;
                    if (penetrationCount >= maxPenetration) {
                        this.active = false;
                        return; // 达到最大穿透次数，停止检测
                    }
                }
            }
        }
        
        // 更新子弹的穿透计数
        this.penetrationCount = penetrationCount;
        
        // 反弹子弹属性
        if (this.type === 'bouncing') {
            this.bounceCount = 0;
            this.maxBounces = 3;
        }
        
        // 命中记录属性
        this.hasRecordedHit = false; // 是否已记录命中（防止重复计数）
        
        // 生命周期
        this.lifeTime = 0;
        this.maxLifeTime = this.type === 'laser' ? 3000 : 2000;
    }
    
    // 根据类型设置子弹属性
    setupBulletProperties() {
        switch (this.type) {
            case 'normal':
                this.width = 4;
                this.height = 4;
                this.speed = 8;
                this.damage = this.owner === 'player' ? 25 : 20;
                this.color = this.owner === 'player' ? '#FFD700' : '#FF4444';
                break;
                
            case 'charged':
                this.width = 6;
                this.height = 6;
                this.speed = 10;
                this.damage = 40;
                this.color = '#FF8C00';
                break;
                
            case 'super':
                this.width = 8;
                this.height = 8;
                this.speed = 12;
                this.damage = 60;
                this.color = '#FF0000';
                break;
                
            case 'laser':
                this.width = 2;
                this.height = 2;
                this.speed = 15;
                this.damage = 50;
                this.color = '#00FFFF';
                this.laserLength = 200; // 激光束长度
                break;
                
            case 'bouncing':
                this.width = 5;
                this.height = 5;
                this.speed = 7;
                this.damage = 20;
                this.color = '#9C27B0';
                break;
                
            default:
                this.width = 4;
                this.height = 4;
                this.speed = 8;
                this.damage = 25;
                this.color = '#FFD700';
        }
    }
    
    // 设置速度向量
    setVelocity() {
        switch (this.direction) {
            case 'up':
                this.vx = 0;
                this.vy = -this.speed;
                break;
            case 'down':
                this.vx = 0;
                this.vy = this.speed;
                break;
            case 'left':
                this.vx = -this.speed;
                this.vy = 0;
                break;
            case 'right':
                this.vx = this.speed;
                this.vy = 0;
                break;
        }
    }
    
    // 更新子弹状态
    update(deltaTime, gameState) {
        if (!this.active) return;
        
        // 更新生命周期
        this.lifeTime += deltaTime || 16; // 使用传入的deltaTime或默认16ms
        if (this.lifeTime >= this.maxLifeTime) {
            this.active = false;
            return;
        }
        
        // 保存当前位置到轨迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界检测 - 使用正确的canvas尺寸
        const canvasWidth = gameState.canvasWidth || gameState.gameState?.canvasWidth || 800;
        const canvasHeight = gameState.canvasHeight || gameState.gameState?.canvasHeight || 600;
        
        if (this.x < 0 || this.x > canvasWidth || 
            this.y < 0 || this.y > canvasHeight) {
            this.active = false;
            return;
        }
        
        // 碰撞检测
        this.checkCollisions(gameState);
    }
    
    // 碰撞检测
    checkCollisions(gameState) {
        const { walls, tanks, bullets } = gameState;
        // 获取真正的 gameState 对象（如果传入的是包装对象）
        const realGameState = gameState.gameState || gameState;
        
        let hasCollision = false;
        
        // 激光子弹使用特殊的线性碰撞检测
        if (this.type === 'laser') {
            this.checkLaserCollisions(walls, tanks, realGameState);
            return;
        }
        
        // 与墙壁的碰撞
        for (const wall of walls) {
            if (this.rectCollision(this, wall)) {
                this.handleWallCollision(wall, realGameState);
                hasCollision = true;
                return;
            }
        }
        
        // 与坦克的碰撞
        for (const tank of tanks) {
            if (tank.active && this.rectCollision(this, tank)) {
                // 敌方子弹不伤害敌方坦克（无友伤）
                if (this.owner === 'enemy' && tank.type === 'enemy') {
                    continue;
                }
                // 玩家子弹不伤害玩家
                if (this.owner === 'player' && tank.type === 'player') {
                    continue;
                }
                this.handleTankCollision(tank, realGameState);
                hasCollision = true;
                return;
            }
        }
        
        // 子弹间碰撞（可选功能）
        if (this.type === 'super') {
            for (const bullet of bullets) {
                if (bullet !== this && bullet.active && bullet.owner !== this.owner && 
                    this.rectCollision(this, bullet)) {
                    // 超级子弹可以摧毁其他子弹
                    bullet.active = false;
                    realGameState.addExplosion(bullet.x, bullet.y, 'small');
                }
            }
        }
    }
    
    // 处理与墙壁的碰撞
    handleWallCollision(wall, gameState) {
        switch (wall.type) {
            case 'brick':
                // 普通砖墙，子弹消失，墙壁受损
                this.active = false;
                wall.takeDamage(this.damage);
                gameState.addExplosion(this.x, this.y, 'small');
                break;
                
            case 'steel':
                if (this.type === 'super' || this.type === 'laser') {
                    // 超级子弹和激光可以穿透钢墙
                    wall.takeDamage(this.damage);
                    if (this.type === 'laser') {
                        this.penetrationCount++;
                        if (this.penetrationCount >= this.maxPenetration) {
                            this.active = false;
                        }
                    }
                } else {
                    this.active = false;
                }
                gameState.addExplosion(this.x, this.y, 'small');
                break;
                
            case 'reflective':
                // 反射墙，改变子弹方向
                this.handleReflection(wall);
                break;
                
            case 'explosive':
                // 爆炸墙，产生大爆炸
                this.active = false;
                wall.explode(gameState);
                gameState.addExplosion(wall.x + wall.width/2, wall.y + wall.height/2, 'large');
                break;
                
            case 'boundary':
                // 边界墙，子弹消失
                this.active = false;
                break;
                
            default:
                this.active = false;
                gameState.addExplosion(this.x, this.y, 'small');
        }
    }
    
    // 处理与坦克的碰撞
    handleTankCollision(tank, gameState) {
        // 计算实际伤害（激光穿透时伤害衰减）
        let actualDamage = this.damage;
        if (this.type === 'laser' && this.penetrationCount > 0) {
            // 每次穿透伤害衰减20%
            actualDamage = Math.floor(this.damage * Math.pow(0.8, this.penetrationCount));
        }
        
        // 造成伤害
        const damaged = tank.takeDamage(actualDamage);
        
        if (damaged) {
            // 创建击中效果
            gameState.addExplosion(this.x, this.y, 'medium');
            
            // 如果是玩家击中敌人
            if (this.owner === 'player' && tank.type === 'enemy') {
                // 只在第一次命中时记录（防止激光穿透重复计数）
                if (!this.hasRecordedHit) {
                    gameState.recordBulletHit();
                    this.hasRecordedHit = true;
                }
                gameState.addScore(50);
                
                // 播放击中音效
                if (window.audioManager) {
                    window.audioManager.play('hit', 0.6, 1.0);
                }
                
                // 如果敌人被摧毁，记录击杀
                if (!tank.active) {
                    gameState.recordEnemyKill();
                    gameState.addExplosion(tank.x + tank.width/2, tank.y + tank.height/2, 'large');
                    
                    // 播放敌人死亡音效
                    if (window.audioManager) {
                        window.audioManager.play('enemy_death', 0.8, 1.0);
                    }
                }
            }
            
            // 如果是敌人击中玩家
            if (this.owner === 'enemy' && tank.type === 'player') {
                // 敌人命中玩家也记录（用于敌人的统计）
                tank.takeDamage(actualDamage);
            }
        }
        
        // 激光子弹可以穿透，但需要正确处理碰撞检测
        if (this.type === 'laser') {
            this.penetrationCount++;
            if (this.penetrationCount >= this.maxPenetration) {
                this.active = false;
            }
            // 激光穿透时不立即失效，继续检测后续目标
        } else {
            this.active = false;
        }
    }
    
    // 处理反射
    handleReflection(wall) {
        // 简单的反射逻辑
        const bulletCenterX = this.x + this.width / 2;
        const bulletCenterY = this.y + this.height / 2;
        const wallCenterX = wall.x + wall.width / 2;
        const wallCenterY = wall.y + wall.height / 2;
        
        const dx = bulletCenterX - wallCenterX;
        const dy = bulletCenterY - wallCenterY;
        
        // 根据碰撞面反射
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平反射
            this.vx = -this.vx;
            this.direction = this.vx > 0 ? 'right' : 'left';
        } else {
            // 垂直反射
            this.vy = -this.vy;
            this.direction = this.vy > 0 ? 'down' : 'up';
        }
        
        // 反弹子弹计数
        if (this.type === 'bouncing') {
            this.bounceCount++;
            if (this.bounceCount >= this.maxBounces) {
                this.active = false;
            }
        }
        
        // 移动子弹避免卡在墙内
        this.x += this.vx * 2;
        this.y += this.vy * 2;
    }
    
    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 绘制子弹
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 绘制轨迹
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            
            ctx.beginPath();
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        }
        
        // 根据类型绘制不同效果
        switch (this.type) {
            case 'normal':
                this.drawNormalBullet(ctx);
                break;
            case 'charged':
                this.drawChargedBullet(ctx);
                break;
            case 'super':
                this.drawSuperBullet(ctx);
                break;
            case 'laser':
                this.drawLaserBullet(ctx);
                break;
            case 'bouncing':
                this.drawBouncingBullet(ctx);
                break;
            default:
                this.drawNormalBullet(ctx);
        }
        
        ctx.restore();
    }
    
    // 绘制普通子弹
    drawNormalBullet(ctx) {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        const time = Date.now() * 0.008;
        
        // 强化外层发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        
        // 外层光环
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4 + Math.sin(time) * 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/2 + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // 主体渐变（更丰富的颜色层次）
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width/2);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.2, '#FFFF99');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(0.8, this.owner === 'player' ? '#FFD700' : '#FF4500');
        gradient.addColorStop(1, this.owner === 'player' ? '#B8860B' : '#8B0000');
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 动态内核高亮
        const highlightSize = this.width/4 + Math.sin(time * 2) * 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(centerX - this.width/8, centerY - this.height/8, highlightSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加能量火花效果
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2 / 3);
            const sparkX = centerX + Math.cos(angle) * (this.width/2 + 2);
            const sparkY = centerY + Math.sin(angle) * (this.height/2 + 2);
            
            ctx.fillStyle = this.owner === 'player' ? '#FFD700' : '#FF6347';
            ctx.globalAlpha = 0.6 + Math.sin(time * 3 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // 绘制蓄能子弹
    drawChargedBullet(ctx) {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        const time = Date.now() * 0.008;
        
        // 超强发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        
        // 多层能量环效果
        for (let ring = 0; ring < 3; ring++) {
            const ringRadius = this.width/2 + 3 + ring * 2 + Math.sin(time + ring) * 3;
            const ringAlpha = 0.8 - ring * 0.2;
            
            ctx.strokeStyle = ring === 0 ? '#FFFFFF' : this.color;
            ctx.lineWidth = 2 - ring * 0.5;
            ctx.globalAlpha = ringAlpha;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 主体渐变（更强烈的能量感）
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width/2);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.1, '#FFFF99');
        gradient.addColorStop(0.3, '#FFFF00');
        gradient.addColorStop(0.6, this.color);
        gradient.addColorStop(0.8, '#FF6600');
        gradient.addColorStop(1, '#8B4513');
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 双重旋转的能量核心
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // 外层十字
        ctx.rotate(time);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(-this.width/3, -1.5, this.width * 2/3, 3);
        ctx.fillRect(-1.5, -this.height/3, 3, this.height * 2/3);
        
        // 内层反向旋转十字
        ctx.rotate(-time * 2);
        ctx.fillStyle = '#FFFF00';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-this.width/4, -1, this.width/2, 2);
        ctx.fillRect(-1, -this.height/4, 2, this.height/2);
        
        ctx.restore();
        
        // 增强的能量粒子效果
        for (let i = 0; i < 8; i++) {
            const angle = time * 2 + (i * Math.PI / 4);
            const distance = this.width/2 + 5 + Math.sin(time * 3 + i) * 3;
            const particleX = centerX + Math.cos(angle) * distance;
            const particleY = centerY + Math.sin(angle) * distance;
            
            const particleSize = 1.2 + Math.sin(time * 4 + i) * 0.5;
            ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : this.color;
            ctx.globalAlpha = 0.8 + Math.sin(time * 5 + i) * 0.2;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 添加能量波纹效果
        for (let wave = 0; wave < 2; wave++) {
            const waveRadius = (this.width/2 + 8) + Math.sin(time * 2 + wave * Math.PI) * 4;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3 + Math.sin(time * 3 + wave * Math.PI) * 0.2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // 绘制超级子弹
    drawSuperBullet(ctx) {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        const time = Date.now() * 0.01;
        
        // 穿甲弹的金属光泽效果
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        
        // 根据方向绘制穿甲弹形状
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // 根据移动方向旋转
        if (this.direction === 'up') {
            ctx.rotate(-Math.PI/2);
        } else if (this.direction === 'down') {
            ctx.rotate(Math.PI/2);
        } else if (this.direction === 'left') {
            ctx.rotate(Math.PI);
        }
        
        // 穿甲弹主体 - 金属渐变
        const bodyGradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        bodyGradient.addColorStop(0, '#C0C0C0'); // 银色
        bodyGradient.addColorStop(0.3, '#FFD700'); // 金色
        bodyGradient.addColorStop(0.7, '#B8860B'); // 暗金色
        bodyGradient.addColorStop(1, '#696969'); // 暗灰色
        
        // 绘制穿甲弹弹体（椭圆形）
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 穿甲弹尖端（三角形）
        ctx.fillStyle = '#2F4F4F'; // 深灰色尖端
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2 + 6, -3);
        ctx.lineTo(this.width/2 + 6, 3);
        ctx.closePath();
        ctx.fill();
        
        // 金属反光条纹
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-this.width/3, -this.height/3);
        ctx.lineTo(this.width/3, this.height/3);
        ctx.stroke();
        
        // 弹体上的螺纹效果
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.width/2 + 2, i * 2);
            ctx.lineTo(this.width/2 - 2, i * 2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
        
        // 能量尾迹效果
        const trailLength = 15;
        let trailX, trailY, trailWidth, trailHeight;
        
        if (this.direction === 'right') {
            trailX = this.x - trailLength;
            trailY = centerY - this.height/4;
            trailWidth = trailLength;
            trailHeight = this.height/2;
        } else if (this.direction === 'left') {
            trailX = this.x + this.width;
            trailY = centerY - this.height/4;
            trailWidth = trailLength;
            trailHeight = this.height/2;
        } else if (this.direction === 'down') {
            trailX = centerX - this.width/4;
            trailY = this.y - trailLength;
            trailWidth = this.width/2;
            trailHeight = trailLength;
        } else { // up
            trailX = centerX - this.width/4;
            trailY = this.y + this.height;
            trailWidth = this.width/2;
            trailHeight = trailLength;
        }
        
        // 金色能量尾迹
        const trailGradient = ctx.createLinearGradient(
            trailX, trailY,
            trailX + (this.direction === 'left' || this.direction === 'right' ? trailWidth : 0),
            trailY + (this.direction === 'up' || this.direction === 'down' ? trailHeight : 0)
        );
        trailGradient.addColorStop(0, 'transparent');
        trailGradient.addColorStop(0.5, '#FFD70040');
        trailGradient.addColorStop(1, '#FF8C0080');
        
        ctx.fillStyle = trailGradient;
        ctx.fillRect(trailX, trailY, trailWidth, trailHeight);
        
        // 重置阴影
        ctx.shadowBlur = 0;
    }
    
    // 绘制激光子弹
    drawLaserBullet(ctx) {
        // 计算激光束的终点
        let endX = this.x;
        let endY = this.y;
        
        switch (this.direction) {
            case 'up':
                endY = this.y - this.laserLength;
                break;
            case 'down':
                endY = this.y + this.laserLength;
                break;
            case 'left':
                endX = this.x - this.laserLength;
                break;
            case 'right':
                endX = this.x + this.laserLength;
                break;
        }
        
        // 外层光晕
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 中层激光束
        ctx.shadowBlur = 8;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        
        // 内层核心
        ctx.shadowBlur = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        
        // 重置阴影和透明度
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        // 添加激光粒子效果
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const particleX = this.x + (endX - this.x) * progress;
            const particleY = this.y + (endY - this.y) * progress;
            
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6 * Math.random();
            ctx.beginPath();
            ctx.arc(particleX + (Math.random() - 0.5) * 3, 
                   particleY + (Math.random() - 0.5) * 3, 
                   1 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    // 绘制反弹子弹
    drawBouncingBullet(ctx) {
        // 旋转效果
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.lifeTime * 0.01);
        
        // 菱形
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, 0);
        ctx.lineTo(0, this.height/2);
        ctx.lineTo(-this.width/2, 0);
        ctx.closePath();
        ctx.fill();
        
        // 内部高亮
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/4);
        ctx.lineTo(this.width/4, 0);
        ctx.lineTo(0, this.height/4);
        ctx.lineTo(-this.width/4, 0);
        ctx.closePath();
        ctx.fill();
    }
}