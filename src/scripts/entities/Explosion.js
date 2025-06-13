// 爆炸效果类
class Explosion {
    constructor(x, y, type = 'normal', options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.startTime = Date.now();
        
        // 根据类型设置属性
        this.setupExplosionProperties();
        
        // 合并自定义选项
        Object.assign(this, options);
        
        // 粒子系统
        this.particles = [];
        this.sparks = [];
        this.shockwaves = [];
        
        // 初始化粒子
        this.initializeParticles();
        
        // 音效（如果有音频系统）
        this.playExplosionSound();
    }
    
    // 根据类型设置爆炸属性
    setupExplosionProperties() {
        switch (this.type) {
            case 'small':
                this.duration = 500;
                this.radius = 30;
                this.particleCount = 8;
                this.sparkCount = 5;
                this.color = '#FF6B35';
                this.shockwaveCount = 1;
                break;
                
            case 'medium':
                this.duration = 800;
                this.radius = 50;
                this.particleCount = 15;
                this.sparkCount = 10;
                this.color = '#FF4500';
                this.shockwaveCount = 2;
                break;
                
            case 'large':
                this.duration = 1200;
                this.radius = 80;
                this.particleCount = 25;
                this.sparkCount = 20;
                this.color = '#FF0000';
                this.shockwaveCount = 3;
                break;
                
            case 'super':
                this.duration = 1500;
                this.radius = 120;
                this.particleCount = 40;
                this.sparkCount = 30;
                this.color = '#FF1493';
                this.shockwaveCount = 4;
                break;
                
            case 'laser':
                this.duration = 600;
                this.radius = 40;
                this.particleCount = 12;
                this.sparkCount = 15;
                this.color = '#00FFFF';
                this.shockwaveCount = 2;
                break;
                
            default:
                this.duration = 600;
                this.radius = 40;
                this.particleCount = 12;
                this.sparkCount = 8;
                this.color = '#FF6B35';
                this.shockwaveCount = 1;
        }
    }
    
    // 初始化粒子
    initializeParticles() {
        // 创建主要粒子
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / this.particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;
            const size = 3 + Math.random() * 5;
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: size,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                color: this.getParticleColor(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // 创建火花
        for (let i = 0; i < this.sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            
            this.sparks.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 2,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.03,
                color: this.getSparkColor(),
                alpha: 0.8 + Math.random() * 0.2
            });
        }
        
        // 创建冲击波
        for (let i = 0; i < this.shockwaveCount; i++) {
            this.shockwaves.push({
                radius: 0,
                maxRadius: this.radius * (1.5 + i * 0.5),
                width: 3 + i * 2,
                life: 1.0,
                decay: 0.015 + i * 0.005,
                delay: i * 100 // 延迟启动
            });
        }
    }
    
    // 获取粒子颜色
    getParticleColor() {
        const colors = {
            'small': ['#FF6B35', '#FF8E53', '#FFA500'],
            'medium': ['#FF4500', '#FF6347', '#FF7F50'],
            'large': ['#FF0000', '#FF4500', '#FF6B35'],
            'super': ['#FF1493', '#FF69B4', '#FFB6C1'],
            'laser': ['#00FFFF', '#40E0D0', '#87CEEB']
        };
        
        const typeColors = colors[this.type] || colors['small'];
        return typeColors[Math.floor(Math.random() * typeColors.length)];
    }
    
    // 获取火花颜色
    getSparkColor() {
        const sparkColors = {
            'small': ['#FFD700', '#FFA500', '#FF8C00'],
            'medium': ['#FF4500', '#FFD700', '#FF6347'],
            'large': ['#FF0000', '#FF4500', '#FFD700'],
            'super': ['#FF1493', '#FFD700', '#FF69B4'],
            'laser': ['#FFFFFF', '#00FFFF', '#87CEEB']
        };
        
        const typeColors = sparkColors[this.type] || sparkColors['small'];
        return typeColors[Math.floor(Math.random() * typeColors.length)];
    }
    
    // 播放爆炸音效
    playExplosionSound() {
        if (window.audioManager) {
            // 根据爆炸类型播放不同音效
            switch (this.type) {
                case 'large':
                    window.audioManager.play('explosion', 1.0, 0.8);
                    break;
                case 'medium':
                    window.audioManager.play('explosion', 0.8, 1.0);
                    break;
                case 'small':
                    window.audioManager.play('explosion', 0.6, 1.2);
                    break;
                default:
                    window.audioManager.play('explosion', 0.7, 1.0);
            }
        }
    }
    
    // 更新爆炸效果
    update() {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        // 检查是否结束
        if (progress >= 1.0) {
            this.active = false;
            return;
        }
        
        // 更新粒子
        this.updateParticles();
        
        // 更新火花
        this.updateSparks();
        
        // 更新冲击波
        this.updateShockwaves(elapsed);
    }
    
    // 更新粒子
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 应用重力和阻力
            particle.vy += 0.1; // 重力
            particle.vx *= 0.98; // 阻力
            particle.vy *= 0.98;
            
            // 更新旋转
            particle.rotation += particle.rotationSpeed;
            
            // 更新生命值
            particle.life -= particle.decay;
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 更新火花
    updateSparks() {
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            
            // 更新位置
            spark.x += spark.vx;
            spark.y += spark.vy;
            
            // 应用重力
            spark.vy += 0.15;
            
            // 更新生命值
            spark.life -= spark.decay;
            
            // 移除死亡火花
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }
    
    // 更新冲击波
    updateShockwaves(elapsed) {
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const shockwave = this.shockwaves[i];
            
            // 检查延迟
            if (elapsed < shockwave.delay) continue;
            
            // 扩展半径
            const adjustedElapsed = elapsed - shockwave.delay;
            const expansionProgress = adjustedElapsed / (this.duration - shockwave.delay);
            shockwave.radius = shockwave.maxRadius * expansionProgress;
            
            // 更新生命值
            shockwave.life -= shockwave.decay;
            
            // 移除死亡冲击波
            if (shockwave.life <= 0 || shockwave.radius >= shockwave.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }
    }
    
    // 绘制爆炸效果
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        // 绘制冲击波
        this.drawShockwaves(ctx, progress);
        
        // 绘制主爆炸光球
        this.drawMainExplosion(ctx, progress);
        
        // 绘制粒子
        this.drawParticles(ctx);
        
        // 绘制火花
        this.drawSparks(ctx);
        
        // 绘制特殊效果
        this.drawSpecialEffects(ctx, progress);
        
        ctx.restore();
    }
    
    // 绘制冲击波
    drawShockwaves(ctx, progress) {
        this.shockwaves.forEach(shockwave => {
            if (shockwave.radius > 0) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${shockwave.life * 0.8})`;
                ctx.lineWidth = shockwave.width;
                ctx.beginPath();
                ctx.arc(this.x, this.y, shockwave.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内层冲击波
                ctx.strokeStyle = `rgba(255, 200, 100, ${shockwave.life * 0.6})`;
                ctx.lineWidth = shockwave.width * 0.5;
                ctx.stroke();
            }
        });
    }
    
    // 绘制主爆炸光球
    drawMainExplosion(ctx, progress) {
        const currentRadius = this.radius * (0.2 + 0.8 * progress) * (1.2 - progress);
        const opacity = (1 - progress) * 0.8;
        
        if (currentRadius > 0 && opacity > 0) {
            // 外层光晕
            const outerGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius * 1.5
            );
            
            const rgb = this.hexToRgb(this.color);
            outerGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.8})`);
            outerGradient.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.6})`);
            outerGradient.addColorStop(1, `rgba(${rgb.r/2}, ${rgb.g/2}, ${rgb.b/2}, 0)`);
            
            ctx.fillStyle = outerGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 内层核心
            const innerGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius
            );
            
            innerGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            innerGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.8})`);
            innerGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.3})`);
            
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制粒子
    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            
            ctx.globalAlpha = particle.life;
            
            // 移动到粒子位置并旋转
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // 解析粒子颜色
            let particleRGB;
            if (particle.color.startsWith('#')) {
                particleRGB = this.hexToRgb(particle.color);
            } else {
                // 假设是RGB格式
                const matches = particle.color.match(/\d+/g);
                if (matches && matches.length >= 3) {
                    particleRGB = {
                        r: parseInt(matches[0]),
                        g: parseInt(matches[1]),
                        b: parseInt(matches[2])
                    };
                } else {
                    particleRGB = { r: 255, g: 255, b: 255 };
                }
            }
            
            // 粒子发光效果
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.radius * 2;
            
            // 根据爆炸类型绘制不同形状的粒子
            if (this.type === 'super') {
                // 星型粒子
                this.drawStarParticle(ctx, particle);
            } else if (this.type === 'laser') {
                // 菱形粒子
                this.drawDiamondParticle(ctx, particle);
            } else {
                // 圆形粒子
                this.drawCircleParticle(ctx, particle);
            }
            
            ctx.restore();
        });
    }
    
    // 绘制火花
    drawSparks(ctx) {
        this.sparks.forEach(spark => {
            ctx.save();
            
            ctx.globalAlpha = spark.life * spark.alpha;
            
            // 火花发光
            ctx.shadowColor = spark.color;
            ctx.shadowBlur = spark.radius * 3;
            
            // 绘制火花轨迹
            ctx.strokeStyle = spark.color;
            ctx.lineWidth = spark.radius;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(spark.x, spark.y);
            ctx.lineTo(spark.x - spark.vx * 3, spark.y - spark.vy * 3);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    // 绘制特殊效果
    drawSpecialEffects(ctx, progress) {
        // 为超级爆炸添加额外的光环效果
        if (this.type === 'super' && progress < 0.7) {
            const ringCount = 3;
            for (let i = 0; i < ringCount; i++) {
                const ringRadius = this.radius * (0.8 + i * 0.3) * progress;
                const ringOpacity = (1 - progress) * (0.6 - i * 0.15);
                
                if (ringOpacity > 0) {
                    ctx.strokeStyle = `rgba(255, 20, 147, ${ringOpacity})`;
                    ctx.lineWidth = 2 + i;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
        
        // 为激光爆炸添加电弧效果
        if (this.type === 'laser' && progress < 0.6) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${(1 - progress) * 0.8})`;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2 / 6) + progress * Math.PI;
                const length = this.radius * (0.5 + Math.random() * 0.5);
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                
                // 创建闪电形状
                let x = this.x;
                let y = this.y;
                const segments = 3;
                const segmentLength = length / segments;
                
                for (let j = 0; j < segments; j++) {
                    const segAngle = angle + (Math.random() - 0.5) * 0.5;
                    x += Math.cos(segAngle) * segmentLength;
                    y += Math.sin(segAngle) * segmentLength;
                    ctx.lineTo(x, y);
                }
                
                ctx.stroke();
            }
        }
    }
    
    // 绘制星型粒子
    drawStarParticle(ctx, particle) {
        const spikes = 5;
        const outerRadius = particle.radius;
        const innerRadius = particle.radius * 0.5;
        
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制菱形粒子
    drawDiamondParticle(ctx, particle) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        
        ctx.moveTo(0, -particle.radius);
        ctx.lineTo(particle.radius, 0);
        ctx.lineTo(0, particle.radius);
        ctx.lineTo(-particle.radius, 0);
        
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制圆形粒子
    drawCircleParticle(ctx, particle) {
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, particle.radius
        );
        
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 十六进制颜色转RGB
    hexToRgb(hex) {
        hex = hex.replace('#', '');
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    }
}