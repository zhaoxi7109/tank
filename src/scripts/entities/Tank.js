// 坦克类
class Tank {
    constructor(x, y, width = 40, height = 40, type = 'player') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.id = type === 'player' ? 'player' : 'enemy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.direction = 'up';
        this.speed = type === 'player' ? 3 : 2;
        this.health = type === 'player' ? 100 : 50;
        this.maxHealth = this.health;
        this.lastShot = 0;
        this.shootCooldown = type === 'player' ? 300 : 1500;
        this.active = true;
        this.visible = true;
        this.invincible = false;
        this.invincibleTime = 0;
        
        // 通用位置跟踪属性
        this.stuckCounter = 0;
        this.lastPosition = { x: this.x, y: this.y };
        
        // AI相关属性（敌方坦克）
        if (type === 'enemy') {
            this.lastDirectionChange = 0;
            this.directionChangeInterval = 2000 + Math.random() * 3000;
            this.lastPlayerSeen = 0;
            this.chaseMode = false;
            this.patrolDirection = this.getRandomDirection();
            this.aggressiveness = 0.3 + Math.random() * 0.4; // 攻击性：0.3-0.7
        }
        
        // 特殊能力（仅玩家坦克拥有）
        if (type === 'player') {
            this.specialAbilities = {
                superShot: { available: true, cooldown: 0, maxCooldown: 10000 },
                laser: { available: true, cooldown: 0, maxCooldown: 1000 }, // 1秒冷却
                shield: { active: false, duration: 0, maxDuration: 3000, cooldown: 0, maxCooldown: 4000 }, // 4秒冷却
                speedBoost: { active: false, duration: 0, maxDuration: 2000 }
            };
        } else {
            // 敌方坦克没有特殊能力
            this.specialAbilities = {
                superShot: { available: false, cooldown: 0, maxCooldown: 10000 },
                laser: { available: false, cooldown: 0, maxCooldown: 8000 },
                shield: { active: false, duration: 0, maxDuration: 3000, cooldown: 0, maxCooldown: 12000 },
                speedBoost: { active: false, duration: 0, maxDuration: 2000 }
            };
        }
        
        // 蓄能射击
        this.charging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 1000; // 1秒最大蓄能时间（减少50%）
    }
    
    // 更新坦克状态
    update(deltaTime, gameState) {
        if (!this.active) return;
        
        // 更新无敌状态
        if (this.invincible && Date.now() > this.invincibleTime) {
            this.invincible = false;
            this.visible = true;
        }
        
        // 更新特殊能力
        this.updateSpecialAbilities();
        
        // 根据类型更新
        if (this.type === 'player') {
            this.updatePlayer(gameState);
            return null; // 玩家射击由按键事件处理
        } else {
            return this.updateAI(gameState); // 返回敌方坦克射击的子弹
        }
    }
    
    // 更新玩家坦克
    updatePlayer(gameState) {
        const { movement, shooting, walls, canvasWidth, canvasHeight } = gameState;
        const canvas = { width: canvasWidth, height: canvasHeight };
        
        // 确保movement对象存在
        if (!movement || typeof movement !== 'object') {
            return;
        }
        
        // 移动处理
        let newX = this.x;
        let newY = this.y;
        let moved = false;
        
        if (movement.up) {
            newY -= this.getEffectiveSpeed();
            this.direction = 'up';
            moved = true;
        }
        if (movement.down) {
            newY += this.getEffectiveSpeed();
            this.direction = 'down';
            moved = true;
        }
        if (movement.left) {
            newX -= this.getEffectiveSpeed();
            this.direction = 'left';
            moved = true;
        }
        if (movement.right) {
            newX += this.getEffectiveSpeed();
            this.direction = 'right';
            moved = true;
        }
        
        // 碰撞检测
        if (moved && !this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        }
        
        // 射击处理现在由按键事件直接处理
        return null;
    }
    
    // 更新AI坦克
    updateAI(gameState) {
        const { player, walls, canvasWidth, canvasHeight, enemies } = gameState;
        const canvas = { width: canvasWidth, height: canvasHeight };
        const now = Date.now();
        
        // 检查是否卡住
        if (Math.abs(this.x - this.lastPosition.x) < 1 && Math.abs(this.y - this.lastPosition.y) < 1) {
            this.stuckCounter++;
            if (this.stuckCounter > 20) { // 减少卡住检测时间
                this.direction = this.getRandomDirection();
                this.stuckCounter = 0;
                this.lastStuckTime = now;
            }
        } else {
            this.stuckCounter = 0;
            this.lastPosition = { x: this.x, y: this.y };
        }
        
        // 视线检测
        const canSeePlayer = this.canSeePlayer(player, walls);
        const distanceToPlayer = this.getDistanceToPlayer(player);
        const playerHealth = player.health / player.maxHealth;
        const myHealth = this.health / this.maxHealth;
        
        // 初始化AI状态
        if (!this.aiState) {
            this.aiState = {
                strategy: 'aggressive',
                lastStrategyChange: now,
                stuckCounter: 0,
                lastPosition: { x: this.x, y: this.y },
                circleDirection: Math.random() < 0.5 ? 1 : -1,
                retreatTarget: null
            };
        }
        
        // 动态策略调整
        if (now - this.aiState.lastStrategyChange > 3000) {
            if (myHealth < 0.3) {
                this.aiState.strategy = 'defensive';
            } else if (playerHealth < 0.4) {
                this.aiState.strategy = 'aggressive';
            } else if (distanceToPlayer > 150) {
                this.aiState.strategy = 'approach';
            } else {
                this.aiState.strategy = Math.random() < 0.6 ? 'tactical' : 'aggressive';
            }
            this.aiState.lastStrategyChange = now;
        }
        
        // 团队协作：检查附近友军
        const nearbyAllies = this.getNearbyAllies(enemies);
        const shouldCoordinate = nearbyAllies.length > 0;
        
        if (canSeePlayer) {
            this.lastPlayerSeen = now;
            this.chaseMode = true;
            
            // 智能定位：根据玩家位置和友军位置选择最佳攻击角度
            if (shouldCoordinate) {
                this.coordinatedAttack(player, nearbyAllies, walls);
            } else {
                this.facePlayer(player);
            }
            
            // 检查射击路径上是否有友军
            const wouldHitAlly = this.wouldHitAlly(enemies, walls);
            
            // 智能射击决策
            const canShoot = this.canShoot();
            const shouldShoot = this.shouldShoot(player, distanceToPlayer, wouldHitAlly);
            
            if (canShoot && shouldShoot && !wouldHitAlly) {
                // 根据距离选择武器类型
                const bullet = this.smartShoot(distanceToPlayer);
                if (bullet) {
                    return bullet;
                }
            }
        }
        
        // 追击模式持续时间根据距离调整
        const chaseTimeout = distanceToPlayer > 150 ? 2000 : 4000;
        if (this.chaseMode && now - this.lastPlayerSeen > chaseTimeout) {
            this.chaseMode = false;
        }

        // 预测性射击：即使看不到玩家，也会向玩家可能出现的位置射击
        if (!canSeePlayer && this.canShoot() && this.lastPlayerSeen && now - this.lastPlayerSeen < 1000) {
            if (Math.random() < 0.05) { // 5%的概率预测性射击
                const bullet = this.predictiveShoot(player);
                if (bullet) {
                    return bullet;
                }
            }
        }

        // 移动逻辑 - 根据是否能看到玩家决定行为
        if (canSeePlayer) {
            // 能看到玩家时执行战术策略
            switch (this.aiState.strategy) {
                case 'defensive':
                    this.executeDefensiveStrategy(player, enemies, walls, canvas);
                    break;
                case 'aggressive':
                    this.executeAggressiveStrategy(player, enemies, walls, canvas);
                    break;
                case 'tactical':
                    this.executeTacticalStrategy(player, enemies, walls, canvas);
                    break;
                case 'approach':
                    this.executeApproachStrategy(player, enemies, walls, canvas);
                    break;
                default:
                    this.smartMoveTowardsPlayer(player, walls, canvas, nearbyAllies);
            }
        } else {
            // 看不到玩家时进行自然的随机移动
            if (this.chaseMode && now - this.lastPlayerSeen < 3000) {
                // 刚失去视线时短暂搜索
                this.searchForPlayer(player, walls, canvas, now);
            } else {
                // 完全失去玩家踪迹时进行自然巡逻
                this.chaseMode = false;
                this.naturalPatrol(walls, canvas, now, enemies);
            }
        }
        
        // 战略性使用特殊技能
        this.useSpecialAbilitiesStrategically(player, distanceToPlayer, myHealth, walls);
        
        return null;
    }
    
    // 智能移动到玩家位置
    smartMoveTowardsPlayer(player, walls, canvas, nearbyAllies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 理想攻击距离：既不太近也不太远
        const idealDistance = 80;
        const minDistance = 50;
        const maxDistance = 120;
        
        let targetDirection = this.direction;
        
        if (distance < minDistance) {
            // 距离太近，后退
            if (Math.abs(dx) > Math.abs(dy)) {
                targetDirection = dx > 0 ? 'left' : 'right';
            } else {
                targetDirection = dy > 0 ? 'up' : 'down';
            }
        } else if (distance > maxDistance) {
            // 距离太远，接近
            if (Math.abs(dx) > Math.abs(dy)) {
                targetDirection = dx > 0 ? 'right' : 'left';
            } else {
                targetDirection = dy > 0 ? 'down' : 'up';
            }
        } else {
            // 在理想距离范围内，尝试保持侧向移动以获得更好的射击角度
            const sideDirections = [];
            if (Math.abs(dx) > Math.abs(dy)) {
                // 玩家在水平方向，尝试垂直移动
                sideDirections.push('up', 'down');
            } else {
                // 玩家在垂直方向，尝试水平移动
                sideDirections.push('left', 'right');
            }
            
            // 随机选择侧向移动，但有概率保持当前方向避免频繁改变
            if (Math.random() < 0.3) {
                targetDirection = sideDirections[Math.floor(Math.random() * sideDirections.length)];
            }
        }
        
        // 避免频繁改变方向
        if (this.direction !== targetDirection) {
            if (!this.lastDirectionChangeTime) this.lastDirectionChangeTime = 0;
            const now = Date.now();
            if (now - this.lastDirectionChangeTime > 500) { // 至少500ms才能改变方向
                this.direction = targetDirection;
                this.lastDirectionChangeTime = now;
            }
        }
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }
        
        // 检查碰撞
        const wouldCollideWithWalls = this.checkCollision(newX, newY, walls, canvas);
        const wouldCollideWithPlayer = this.rectCollision(
            {x: newX, y: newY, width: this.width, height: this.height}, 
            player
        );
        
        if (!wouldCollideWithWalls && !wouldCollideWithPlayer) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰撞时，选择一个可行的方向
            const allDirections = ['up', 'down', 'left', 'right'];
            const validDirections = [];
            
            for (const dir of allDirections) {
                let testX = this.x;
                let testY = this.y;
                
                switch (dir) {
                    case 'up': testY -= this.speed; break;
                    case 'down': testY += this.speed; break;
                    case 'left': testX -= this.speed; break;
                    case 'right': testX += this.speed; break;
                }
                
                const testCollideWalls = this.checkCollision(testX, testY, walls, canvas);
                const testCollidePlayer = this.rectCollision(
                    {x: testX, y: testY, width: this.width, height: this.height}, 
                    player
                );
                
                if (!testCollideWalls && !testCollidePlayer) {
                    validDirections.push({dir, x: testX, y: testY});
                }
            }
            
            if (validDirections.length > 0) {
                // 优先选择朝向玩家的方向
                let bestDirection = validDirections[0];
                for (const option of validDirections) {
                    const newDx = player.x - option.x;
                    const newDy = player.y - option.y;
                    const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
                    
                    const currentDx = player.x - bestDirection.x;
                    const currentDy = player.y - bestDirection.y;
                    const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
                    
                    // 选择距离更接近理想距离的方向
                    if (Math.abs(newDistance - idealDistance) < Math.abs(currentDistance - idealDistance)) {
                        bestDirection = option;
                    }
                }
                
                this.direction = bestDirection.dir;
                this.x = bestDirection.x;
                this.y = bestDirection.y;
            }
        }
    }
    
    // 智能巡逻
    intelligentPatrol(walls, canvas, now, enemies) {
        // 初始化巡逻相关变量
        if (!this.lastDirectionChange) this.lastDirectionChange = 0;
        if (!this.directionChangeInterval) this.directionChangeInterval = 2000 + Math.random() * 3000;
        if (!this.patrolDirection) this.patrolDirection = this.getRandomDirection();
        
        // 定期改变方向
        if (now - this.lastDirectionChange > this.directionChangeInterval) {
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = now;
            this.directionChangeInterval = 2000 + Math.random() * 3000;
        }
        
        this.direction = this.patrolDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }
        
        // 检查碰撞
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰到障碍物，改变方向
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = now;
        }
    }
    

    
    // 执行防御策略
    executeDefensiveStrategy(player, enemies, walls, canvas) {
        const distance = this.getDistanceToPlayer(player);
        
        if (distance < 80) {
            // 距离太近，后退
            this.retreatFromPlayer(player, walls, canvas);
        } else {
            // 寻找掩护
            this.seekCover(player, walls, canvas);
        }
    }
    
    // 执行攻击策略
    executeAggressiveStrategy(player, enemies, walls, canvas) {
        this.smartMoveTowardsPlayer(player, walls, canvas, this.getNearbyAllies(enemies));
    }
    
    // 执行战术策略
    executeTacticalStrategy(player, enemies, walls, canvas) {
        const distance = this.getDistanceToPlayer(player);
        const nearbyAllies = this.getNearbyAllies(enemies);
        
        if (nearbyAllies.length > 0) {
            // 有友军时进行协调攻击
            this.coordinatedAttack(player, nearbyAllies, walls);
            this.circleAroundPlayer(player, walls, canvas);
        } else {
            // 单独作战时保持距离并侧向移动
            if (distance < 60) {
                this.circleAroundPlayer(player, walls, canvas);
            } else {
                this.smartMoveTowardsPlayer(player, walls, canvas, []);
            }
        }
    }
    
    // 执行接近策略
    executeApproachStrategy(player, enemies, walls, canvas) {
        this.smartMoveTowardsPlayer(player, walls, canvas, this.getNearbyAllies(enemies));
    }
    
    // 从玩家处后退
    retreatFromPlayer(player, walls, canvas) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        
        let retreatDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
            retreatDirection = dx > 0 ? 'right' : 'left';
        } else {
            retreatDirection = dy > 0 ? 'down' : 'up';
        }
        
        this.direction = retreatDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 如果后退路径被阻挡，尝试侧向移动
            this.circleAroundPlayer(player, walls, canvas);
        }
    }
    
    // 寻找掩护
    seekCover(player, walls, canvas) {
        // 寻找最近的墙壁作为掩护
        let bestWall = null;
        let bestDistance = Infinity;
        
        for (const wall of walls) {
            const wallCenterX = wall.x + wall.width / 2;
            const wallCenterY = wall.y + wall.height / 2;
            const distance = Math.sqrt(
                Math.pow(wallCenterX - this.x, 2) + Math.pow(wallCenterY - this.y, 2)
            );
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestWall = wall;
            }
        }
        
        if (bestWall) {
            // 移动到墙壁附近
            const dx = bestWall.x + bestWall.width / 2 - this.x;
            const dy = bestWall.y + bestWall.height / 2 - this.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            let newX = this.x;
            let newY = this.y;
            
            switch (this.direction) {
                case 'up': newY -= this.speed; break;
                case 'down': newY += this.speed; break;
                case 'left': newX -= this.speed; break;
                case 'right': newX += this.speed; break;
            }
            
            if (!this.checkCollision(newX, newY, walls, canvas)) {
                this.x = newX;
                this.y = newY;
            }
        } else {
            // 没有墙壁时进行常规巡逻
            this.intelligentPatrol(walls, canvas, Date.now(), []);
        }
    }
    
    // 围绕玩家移动
    circleAroundPlayer(player, walls, canvas) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算垂直于玩家方向的移动向量
        let perpX, perpY;
        if (Math.abs(dx) > Math.abs(dy)) {
            perpX = 0;
            perpY = this.aiState.circleDirection;
        } else {
            perpX = this.aiState.circleDirection;
            perpY = 0;
        }
        
        // 设置移动方向
        if (Math.abs(perpX) > Math.abs(perpY)) {
            this.direction = perpX > 0 ? 'right' : 'left';
        } else {
            this.direction = perpY > 0 ? 'down' : 'up';
        }
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 如果碰到障碍物，改变环绕方向
             this.aiState.circleDirection *= -1;
         }
     }
     
     // 战略性使用特殊技能
     useSpecialAbilitiesStrategically(player, distance, myHealth, walls) {
         const playerHealth = player.health / player.maxHealth;
         
         // 激光技能使用条件
         if (this.specialAbilities.laser.available) {
             if ((distance < 80 && this.hasLineOfSight(player, walls)) || 
                 (myHealth < 0.4 && distance < 120)) {
                 this.specialAbilities.laser.available = false;
                 this.specialAbilities.laser.cooldown = this.specialAbilities.laser.maxCooldown;
                 
                 // 播放激光音效
                 if (window.audioManager) {
                     window.audioManager.play('laser', 0.8, 1.0);
                 }
                 return;
             }
         }
         
         // 护盾技能使用条件
         if (this.specialAbilities.shield.cooldown <= 0 && !this.specialAbilities.shield.active) {
             if (myHealth < 0.5 || (distance < 60 && playerHealth > 0.6)) {
                 this.specialAbilities.shield.active = true;
                 this.specialAbilities.shield.duration = this.specialAbilities.shield.maxDuration;
                 
                 // 播放护盾激活音效
                 if (window.audioManager) {
                     window.audioManager.play('shield_activate', 0.7, 1.0);
                 }
                 return;
             }
         }
         
         // 超级射击使用条件
         if (this.specialAbilities.superShot.available) {
             if (distance > 100 && this.hasLineOfSight(player, walls)) {
                 this.specialAbilities.superShot.available = false;
                 this.specialAbilities.superShot.cooldown = this.specialAbilities.superShot.maxCooldown;
                 
                 // 播放超级射击音效
                 if (window.audioManager) {
                     window.audioManager.play('laser', 1.0, 0.8);
                 }
                 return;
             }
         }
     }
     
     // 获取有效速度（考虑速度提升）
    getEffectiveSpeed() {
        return this.specialAbilities.speedBoost.active ? this.speed * 1.5 : this.speed;
    }
    
    // 更新特殊能力
    updateSpecialAbilities() {
        const now = Date.now();
        
        // 更新激光冷却
        if (this.specialAbilities.laser.cooldown > 0) {
            this.specialAbilities.laser.cooldown -= 16;
            if (this.specialAbilities.laser.cooldown <= 0) {
                this.specialAbilities.laser.available = true;
            }
        }
        
        // 更新护盾
        if (this.specialAbilities.shield.active) {
            this.specialAbilities.shield.duration -= 16; // 假设60FPS
            if (this.specialAbilities.shield.duration <= 0) {
                this.specialAbilities.shield.active = false;
                // 开始护盾冷却
                this.specialAbilities.shield.cooldown = this.specialAbilities.shield.maxCooldown;
            }
        }
        
        // 更新护盾冷却
        if (this.specialAbilities.shield.cooldown > 0) {
            this.specialAbilities.shield.cooldown -= 16;
        }
        
        // 更新速度提升
        if (this.specialAbilities.speedBoost.active) {
            this.specialAbilities.speedBoost.duration -= 16;
            if (this.specialAbilities.speedBoost.duration <= 0) {
                this.specialAbilities.speedBoost.active = false;
            }
        }
        
        // 更新超级射击冷却
        if (this.specialAbilities.superShot.cooldown > 0) {
            this.specialAbilities.superShot.cooldown -= 16;
            if (this.specialAbilities.superShot.cooldown <= 0) {
                this.specialAbilities.superShot.available = true;
            }
        }
    }
    
    // 碰撞检测
    checkCollision(x, y, walls, canvas) {
        // 画布边界检测
        if (x < 0 || y < 0 || x + this.width > canvas.width || y + this.height > canvas.height) {
            return true;
        }
        
        // 墙壁碰撞检测
        if (!walls || !Array.isArray(walls)) {
            return false; // 如果walls未定义或不是数组，返回false
        }
        
        const tankRect = { x, y, width: this.width, height: this.height };
        return walls.some(wall => this.rectCollision(tankRect, wall));
    }
    
    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 射击方法
    shoot() {

        
        if (!this.canShoot()) {

            return null;
        }
        
        this.lastShot = Date.now();
        
        // 计算子弹起始位置
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        
        // 根据方向调整子弹位置
        switch (this.direction) {
            case 'up':
                bulletY = this.y;
                break;
            case 'down':
                bulletY = this.y + this.height;
                break;
            case 'left':
                bulletX = this.x;
                break;
            case 'right':
                bulletX = this.x + this.width;
                break;
        }
        
        // 检查是否使用蓄能射击
        let bulletType = 'normal';
        if (this.charging && this.type === 'player') {
            const chargeTime = Date.now() - this.chargeStartTime;
            if (chargeTime >= this.maxChargeTime) {
                bulletType = 'super';
            } else if (chargeTime >= this.maxChargeTime * 0.5) {
                bulletType = 'charged';
            }
            this.charging = false;
        }
        

        
        const bullet = new Bullet(bulletX, bulletY, this.direction, this.type, bulletType);
        
        // 播放射击音效
        if (window.audioManager) {
            switch (bulletType) {
                case 'super':
                    window.audioManager.play('laser', 0.8, 1.0);
                    break;
                case 'charged':
                    window.audioManager.play('shoot', 0.7, 0.8);
                    break;
                default:
                    window.audioManager.play('shoot', 0.5, 1.0);
            }
        }

        return bullet;
    }
    
    // 检查是否可以射击
    canShoot() {
        const now = Date.now();
        const canShoot = now - this.lastShot >= this.shootCooldown;

        return canShoot;
    }
    
    // 开始蓄能
    startCharging() {
        if (this.type === 'player' && !this.charging) {
            this.charging = true;
            this.chargeStartTime = Date.now();
        }
    }
    
    // 停止蓄能并射击
    stopCharging() {
        if (this.charging) {
            const bullet = this.shoot();
            this.charging = false;
            return bullet;
        }
        return null;
    }
    
    // 创建特殊子弹
    createSpecialBullet(bulletType) {
        if (!this.canShoot()) {
            return null;
        }
        
        this.lastShot = Date.now();
        
        // 计算子弹发射位置
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        
        // 根据方向调整子弹位置
        switch (this.direction) {
            case 'up':
                bulletY = this.y;
                break;
            case 'down':
                bulletY = this.y + this.height;
                break;
            case 'left':
                bulletX = this.x;
                break;
            case 'right':
                bulletX = this.x + this.width;
                break;
        }
        
        const bullet = new Bullet(bulletX, bulletY, this.direction, this.type, bulletType);
        return bullet;
    }
    
    // 受到伤害
    takeDamage(damage) {
        if (this.invincible || this.specialAbilities.shield.active) {
            return false;
        }
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
        }
        
        return true;
    }
    
    // AI相关方法
    
    // 获取到玩家的距离
    getDistanceToPlayer(player) {
        if (!player || !player.active) return Infinity;
        return Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );
    }
    
    // 获取附近的友军
    getNearbyAllies(enemies) {
        const allies = [];
        const maxDistance = 120;
        
        for (const enemy of enemies) {
            if (enemy !== this && enemy.active && enemy.type === 'enemy') {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2)
                );
                if (distance <= maxDistance) {
                    allies.push({ tank: enemy, distance });
                }
            }
        }
        
        return allies.sort((a, b) => a.distance - b.distance);
    }
    
    // 协调攻击
    coordinatedAttack(player, nearbyAllies, walls) {
        // 计算包围角度
        const playerCenter = { x: player.x + player.width/2, y: player.y + player.height/2 };
        const myCenter = { x: this.x + this.width/2, y: this.y + this.height/2 };
        
        // 计算理想攻击角度（尝试从不同角度包围玩家）
        const angleToPlayer = Math.atan2(playerCenter.y - myCenter.y, playerCenter.x - myCenter.x);
        const allyAngles = nearbyAllies.map(ally => {
            const allyCenter = { x: ally.tank.x + ally.tank.width/2, y: ally.tank.y + ally.tank.height/2 };
            return Math.atan2(playerCenter.y - allyCenter.y, playerCenter.x - allyCenter.x);
        });
        
        // 选择与友军角度差异最大的方向
        let bestAngle = angleToPlayer;
        let maxAngleDiff = 0;
        
        for (let testAngle = angleToPlayer - Math.PI/2; testAngle <= angleToPlayer + Math.PI/2; testAngle += Math.PI/4) {
            let minDiff = Math.PI;
            for (const allyAngle of allyAngles) {
                const diff = Math.abs(testAngle - allyAngle);
                minDiff = Math.min(minDiff, diff);
            }
            if (minDiff > maxAngleDiff) {
                maxAngleDiff = minDiff;
                bestAngle = testAngle;
            }
        }
        
        // 根据最佳角度设置方向
        const dx = Math.cos(bestAngle);
        const dy = Math.sin(bestAngle);
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    // 智能射击决策
    shouldShoot(player, distance, wouldHitAlly) {
        if (wouldHitAlly) return false;
        
        // 检查是否能看到玩家
        const canSeePlayer = this.canSeePlayer(player, []);
        
        // 如果看不到玩家，有小概率随机射击
        if (!canSeePlayer) {
            return Math.random() < 0.05; // 5%概率随机射击
        }
        
        // 根据距离调整射击概率
        let shootProbability = this.aggressiveness;
        
        if (distance < 60) {
            shootProbability *= 1.5; // 近距离提高射击概率
        } else if (distance > 150) {
            shootProbability *= 0.7; // 远距离降低射击概率
        }
        
        // 根据玩家移动速度调整
        if (player.lastPosition) {
            const playerSpeed = Math.sqrt(
                Math.pow(player.x - player.lastPosition.x, 2) + 
                Math.pow(player.y - player.lastPosition.y, 2)
            );
            if (playerSpeed > 2) {
                shootProbability *= 0.8; // 玩家移动快时降低命中概率
            }
        }
        
        return Math.random() < shootProbability;
    }
    
    // 智能射击（根据距离选择武器）
    smartShoot(distance) {
        // 近距离使用普通子弹，远距离使用特殊武器
        if (distance > 100 && this.specialAbilities.laser.available && Math.random() < 0.3) {
            // 30%概率使用激光
            this.specialAbilities.laser.available = false;
            this.specialAbilities.laser.cooldown = this.specialAbilities.laser.maxCooldown;
            return this.createSpecialBullet('laser');
        } else if (distance > 80 && this.specialAbilities.superShot.available && Math.random() < 0.2) {
            // 20%概率使用超级子弹
            this.specialAbilities.superShot.available = false;
            this.specialAbilities.superShot.cooldown = this.specialAbilities.superShot.maxCooldown;
            return this.createSpecialBullet('super');
        } else {
            return this.shoot();
        }
    }
    
    // 预测性射击
    predictiveShoot(player) {
        if (!player.lastPosition) return null;
        
        // 计算玩家移动向量
        const playerVelocity = {
            x: player.x - player.lastPosition.x,
            y: player.y - player.lastPosition.y
        };
        
        // 预测玩家位置
        const predictionFrames = 10;
        const predictedX = player.x + playerVelocity.x * predictionFrames;
        const predictedY = player.y + playerVelocity.y * predictionFrames;
        
        // 朝向预测位置
        const dx = predictedX - this.x;
        const dy = predictedY - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        return this.shoot();
    }
    
    canSeePlayer(player, walls) {
        if (!player || !player.active) return false;
        
        const distance = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );
        
        // 视线范围限制
        if (distance > 200) return false;
        
        // 检查是否有墙壁阻挡
        return !this.isLineBlocked(this.x + this.width/2, this.y + this.height/2, 
                                  player.x + player.width/2, player.y + player.height/2, walls);
    }
    
    // 检查两点间是否有墙壁阻挡
    isLineBlocked(x1, y1, x2, y2, walls) {
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        const dx = (x2 - x1) / steps;
        const dy = (y2 - y1) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const x = x1 + dx * i;
            const y = y1 + dy * i;
            
            for (const wall of walls) {
                if (x >= wall.x && x <= wall.x + wall.width &&
                    y >= wall.y && y <= wall.y + wall.height) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 检查射击是否会误伤友军
    wouldHitAlly(enemies, walls) {
        if (!enemies || enemies.length === 0) return false;
        
        // 计算射击方向
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        let dx = 0, dy = 0;
        
        switch (this.direction) {
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
        }
        
        // 模拟子弹路径，检查是否会击中友军
        const bulletSpeed = 5;
        const maxDistance = 300; // 最大检测距离
        
        for (let distance = 0; distance < maxDistance; distance += bulletSpeed) {
            bulletX += dx * bulletSpeed;
            bulletY += dy * bulletSpeed;
            
            // 检查是否击中墙壁（如果击中墙壁，子弹会停止）
            for (const wall of walls) {
                if (bulletX >= wall.x && bulletX <= wall.x + wall.width &&
                    bulletY >= wall.y && bulletY <= wall.y + wall.height) {
                    return false; // 击中墙壁，不会误伤友军
                }
            }
            
            // 检查是否击中友军
            for (const enemy of enemies) {
                if (enemy !== this && enemy.active && enemy.type === 'enemy') {
                    if (bulletX >= enemy.x && bulletX <= enemy.x + enemy.width &&
                        bulletY >= enemy.y && bulletY <= enemy.y + enemy.height) {
                        return true; // 会误伤友军
                    }
                }
            }
        }
        
        return false;
    }
    
    // 面向玩家
    facePlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    // 向玩家移动
    moveTowardsPlayer(player, walls, canvas) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 理想攻击距离：既不太近也不太远
        const idealDistance = 80;
        const minDistance = 50;
        const maxDistance = 120;
        
        let targetDirection = this.direction;
        
        if (distance < minDistance) {
            // 距离太近，后退
            if (Math.abs(dx) > Math.abs(dy)) {
                targetDirection = dx > 0 ? 'left' : 'right';
            } else {
                targetDirection = dy > 0 ? 'up' : 'down';
            }
        } else if (distance > maxDistance) {
            // 距离太远，接近
            if (Math.abs(dx) > Math.abs(dy)) {
                targetDirection = dx > 0 ? 'right' : 'left';
            } else {
                targetDirection = dy > 0 ? 'down' : 'up';
            }
        } else {
            // 在理想距离范围内，尝试保持侧向移动以获得更好的射击角度
            const sideDirections = [];
            if (Math.abs(dx) > Math.abs(dy)) {
                // 玩家在水平方向，尝试垂直移动
                sideDirections.push('up', 'down');
            } else {
                // 玩家在垂直方向，尝试水平移动
                sideDirections.push('left', 'right');
            }
            
            // 随机选择侧向移动，但有概率保持当前方向避免频繁改变
            if (Math.random() < 0.3) {
                targetDirection = sideDirections[Math.floor(Math.random() * sideDirections.length)];
            }
        }
        
        // 避免频繁改变方向
        if (this.direction !== targetDirection) {
            if (!this.lastDirectionChangeTime) this.lastDirectionChangeTime = 0;
            const now = Date.now();
            if (now - this.lastDirectionChangeTime > 500) { // 至少500ms才能改变方向
                this.direction = targetDirection;
                this.lastDirectionChangeTime = now;
            }
        }
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }
        
        // 检查碰撞
        const wouldCollideWithWalls = this.checkCollision(newX, newY, walls, canvas);
        const wouldCollideWithPlayer = this.rectCollision(
            {x: newX, y: newY, width: this.width, height: this.height}, 
            player
        );
        
        if (!wouldCollideWithWalls && !wouldCollideWithPlayer) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰撞时，选择一个可行的方向
            const allDirections = ['up', 'down', 'left', 'right'];
            const validDirections = [];
            
            for (const dir of allDirections) {
                let testX = this.x;
                let testY = this.y;
                
                switch (dir) {
                    case 'up': testY -= this.speed; break;
                    case 'down': testY += this.speed; break;
                    case 'left': testX -= this.speed; break;
                    case 'right': testX += this.speed; break;
                }
                
                const testCollideWalls = this.checkCollision(testX, testY, walls, canvas);
                const testCollidePlayer = this.rectCollision(
                    {x: testX, y: testY, width: this.width, height: this.height}, 
                    player
                );
                
                if (!testCollideWalls && !testCollidePlayer) {
                    validDirections.push({dir, x: testX, y: testY});
                }
            }
            
            if (validDirections.length > 0) {
                // 优先选择朝向玩家的方向
                let bestDirection = validDirections[0];
                for (const option of validDirections) {
                    const newDx = player.x - option.x;
                    const newDy = player.y - option.y;
                    const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
                    
                    const currentDx = player.x - bestDirection.x;
                    const currentDy = player.y - bestDirection.y;
                    const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
                    
                    // 选择距离更接近理想距离的方向
                    if (Math.abs(newDistance - idealDistance) < Math.abs(currentDistance - idealDistance)) {
                        bestDirection = option;
                    }
                }
                
                this.direction = bestDirection.dir;
                this.x = bestDirection.x;
                this.y = bestDirection.y;
            }
        }
    }
    
    // 巡逻
    patrol(walls, canvas, now) {
        // 定期改变方向
        if (now - this.lastDirectionChange > this.directionChangeInterval) {
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = now;
            this.directionChangeInterval = 2000 + Math.random() * 3000;
        }
        
        this.direction = this.patrolDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up':
                newY -= this.speed;
                break;
            case 'down':
                newY += this.speed;
                break;
            case 'left':
                newX -= this.speed;
                break;
            case 'right':
                newX += this.speed;
                break;
        }
        
        // 检查碰撞
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰到障碍物，改变方向
            this.patrolDirection = this.getRandomDirection();
            this.lastDirectionChange = now;
        }
    }
    

    
    // 执行防御策略
    executeDefensiveStrategy(player, enemies, walls, canvas) {
        const distance = this.getDistanceToPlayer(player);
        
        if (distance < 80) {
            // 距离太近，后退
            this.retreatFromPlayer(player, walls, canvas);
        } else {
            // 寻找掩护
            this.seekCover(player, walls, canvas);
        }
    }
    
    // 执行攻击策略
    executeAggressiveStrategy(player, enemies, walls, canvas) {
        this.smartMoveTowardsPlayer(player, walls, canvas, this.getNearbyAllies(enemies));
    }
    
    // 执行战术策略
    executeTacticalStrategy(player, enemies, walls, canvas) {
        const distance = this.getDistanceToPlayer(player);
        const nearbyAllies = this.getNearbyAllies(enemies);
        
        if (nearbyAllies.length > 0) {
            // 有友军时进行协调攻击
            this.coordinatedAttack(player, nearbyAllies, walls);
            this.circleAroundPlayer(player, walls, canvas);
        } else {
            // 单独作战时保持距离并侧向移动
            if (distance < 60) {
                this.circleAroundPlayer(player, walls, canvas);
            } else {
                this.smartMoveTowardsPlayer(player, walls, canvas, []);
            }
        }
    }
    
    // 执行接近策略
    executeApproachStrategy(player, enemies, walls, canvas) {
        this.smartMoveTowardsPlayer(player, walls, canvas, this.getNearbyAllies(enemies));
    }
    
    // 从玩家处后退
    retreatFromPlayer(player, walls, canvas) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        
        let retreatDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
            retreatDirection = dx > 0 ? 'right' : 'left';
        } else {
            retreatDirection = dy > 0 ? 'down' : 'up';
        }
        
        this.direction = retreatDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 如果后退路径被阻挡，尝试侧向移动
            this.circleAroundPlayer(player, walls, canvas);
        }
    }
    
    // 寻找掩护
    seekCover(player, walls, canvas) {
        // 寻找最近的墙壁作为掩护
        let bestWall = null;
        let bestDistance = Infinity;
        
        for (const wall of walls) {
            const wallCenterX = wall.x + wall.width / 2;
            const wallCenterY = wall.y + wall.height / 2;
            const distance = Math.sqrt(
                Math.pow(wallCenterX - this.x, 2) + Math.pow(wallCenterY - this.y, 2)
            );
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestWall = wall;
            }
        }
        
        if (bestWall) {
            // 移动到墙壁附近
            const dx = bestWall.x + bestWall.width / 2 - this.x;
            const dy = bestWall.y + bestWall.height / 2 - this.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
            
            let newX = this.x;
            let newY = this.y;
            
            switch (this.direction) {
                case 'up': newY -= this.speed; break;
                case 'down': newY += this.speed; break;
                case 'left': newX -= this.speed; break;
                case 'right': newX += this.speed; break;
            }
            
            if (!this.checkCollision(newX, newY, walls, canvas)) {
                this.x = newX;
                this.y = newY;
            }
        } else {
            // 没有墙壁时进行常规巡逻
            this.intelligentPatrol(walls, canvas, Date.now(), []);
        }
    }
    
    // 围绕玩家移动
    circleAroundPlayer(player, walls, canvas) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算垂直于玩家方向的移动向量
        let perpX, perpY;
        if (Math.abs(dx) > Math.abs(dy)) {
            perpX = 0;
            perpY = this.aiState.circleDirection;
        } else {
            perpX = this.aiState.circleDirection;
            perpY = 0;
        }
        
        // 设置移动方向
        if (Math.abs(perpX) > Math.abs(perpY)) {
            this.direction = perpX > 0 ? 'right' : 'left';
        } else {
            this.direction = perpY > 0 ? 'down' : 'up';
        }
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 如果碰到障碍物，改变环绕方向
            this.aiState.circleDirection *= -1;
        }
    }
    
    // 绘制坦克
    draw(ctx) {
        if (!this.active || !this.visible) return;
        
        ctx.save();
        
        // 无敌状态闪烁效果
        if (this.invincible) {
            ctx.globalAlpha = 0.5;
        }
        
        // 护盾效果
        if (this.specialAbilities.shield.active) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制坦克主体（带渐变效果）
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        if (this.type === 'player') {
            gradient.addColorStop(0, '#66BB6A');
            gradient.addColorStop(0.5, '#4CAF50');
            gradient.addColorStop(1, '#388E3C');
        } else {
            gradient.addColorStop(0, '#EF5350');
            gradient.addColorStop(0.5, '#F44336');
            gradient.addColorStop(1, '#D32F2F');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制坦克边框
        ctx.strokeStyle = this.type === 'player' ? '#2E7D32' : '#B71C1C';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 绘制履带
        ctx.fillStyle = '#424242';
        const trackWidth = 4;
        // 左履带
        ctx.fillRect(this.x - 2, this.y + 2, trackWidth, this.height - 4);
        // 右履带
        ctx.fillRect(this.x + this.width - 2, this.y + 2, trackWidth, this.height - 4);
        
        // 绘制履带细节
        ctx.fillStyle = '#616161';
        for (let i = 0; i < 3; i++) {
            const trackY = this.y + 4 + i * (this.height - 8) / 2;
            ctx.fillRect(this.x - 1, trackY, 2, 2);
            ctx.fillRect(this.x + this.width - 1, trackY, 2, 2);
        }
        
        // 绘制坦克中心装饰
        ctx.fillStyle = this.type === 'player' ? '#81C784' : '#E57373';
        const centerSize = 8;
        ctx.fillRect(this.x + this.width/2 - centerSize/2, this.y + this.height/2 - centerSize/2, centerSize, centerSize);
        
        // 绘制坦克炮管（增强版）
        const barrelGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        if (this.type === 'player') {
            barrelGradient.addColorStop(0, '#2E7D32');
            barrelGradient.addColorStop(1, '#1B5E20');
        } else {
            barrelGradient.addColorStop(0, '#C62828');
            barrelGradient.addColorStop(1, '#B71C1C');
        }
        ctx.fillStyle = barrelGradient;
        const barrelLength = 15;
        const barrelWidth = 8;
        
        let barrelX = this.x + this.width / 2 - barrelWidth / 2;
        let barrelY = this.y + this.height / 2 - barrelWidth / 2;
        let barrelW = barrelWidth;
        let barrelH = barrelWidth;
        
        switch (this.direction) {
            case 'up':
                barrelY = this.y - barrelLength;
                barrelH = barrelLength + barrelWidth;
                break;
            case 'down':
                barrelH = barrelLength + barrelWidth;
                break;
            case 'left':
                barrelX = this.x - barrelLength;
                barrelW = barrelLength + barrelWidth;
                break;
            case 'right':
                barrelW = barrelLength + barrelWidth;
                break;
        }
        
        ctx.fillRect(barrelX, barrelY, barrelW, barrelH);
        
        // 蓄能效果 - 40%大小的光圈
        if (this.charging) {
            const chargeTime = Date.now() - this.chargeStartTime;
            const chargeProgress = Math.min(chargeTime / this.maxChargeTime, 1);
            const baseRadius = (this.width/2) * 0.4; // 40%大小
            
            // 外圈蓄能光环
            ctx.strokeStyle = `hsl(${120 * chargeProgress}, 100%, 50%)`;
            ctx.lineWidth = 2 + chargeProgress * 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   baseRadius + 6 + chargeProgress * 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内圈光环
            ctx.strokeStyle = `hsl(${120 * chargeProgress}, 80%, 70%)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   baseRadius + 2 + chargeProgress * 3, 0, Math.PI * 2);
            ctx.stroke();
            
            // 能量粒子效果
            const particleCount = Math.floor(chargeProgress * 8);
            for (let i = 0; i < particleCount; i++) {
                const angle = (Date.now() * 0.005 + i * Math.PI * 2 / particleCount) % (Math.PI * 2);
                const particleRadius = baseRadius + 4 + Math.sin(Date.now() * 0.01 + i) * 2;
                const particleX = this.x + this.width/2 + Math.cos(angle) * particleRadius;
                const particleY = this.y + this.height/2 + Math.sin(angle) * particleRadius;
                
                ctx.fillStyle = `hsl(${120 * chargeProgress}, 100%, 70%)`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, 1 + chargeProgress, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 满蓄能闪烁效果
            if (chargeProgress >= 1) {
                const flash = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${flash * 0.8})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                       baseRadius + 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // 血量条（敌方坦克）
        if (this.type === 'enemy' && this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x;
            const barY = this.y - 8;
            
            // 背景
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 血量
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }
    
    // 搜索玩家（失去视线后的短暂搜索行为）
    searchForPlayer(player, walls, canvas, now) {
        if (!this.searchStartTime) {
            this.searchStartTime = now;
            this.searchDirection = this.getRandomDirection();
        }
        
        // 搜索时间限制
        if (now - this.searchStartTime > 2000) {
            this.searchStartTime = null;
            this.chaseMode = false;
            return;
        }
        
        // 每500ms改变一次搜索方向
        if (!this.lastSearchDirectionChange) this.lastSearchDirectionChange = now;
        if (now - this.lastSearchDirectionChange > 500) {
            this.searchDirection = this.getRandomDirection();
            this.lastSearchDirectionChange = now;
        }
        
        this.direction = this.searchDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰到障碍物时立即改变方向
            this.searchDirection = this.getRandomDirection();
            this.lastSearchDirectionChange = now;
        }
    }
    
    // 自然巡逻（更像真人的随机移动）
    naturalPatrol(walls, canvas, now, enemies) {
        // 初始化巡逻状态
        if (!this.patrolState) {
            this.patrolState = {
                currentDirection: this.getRandomDirection(),
                lastDirectionChange: now,
                moveTime: 1000 + Math.random() * 2000, // 1-3秒随机移动时间
                pauseTime: 500 + Math.random() * 1000,  // 0.5-1.5秒随机停顿时间
                isPausing: false,
                pauseStart: 0
            };
        }
        
        // 处理停顿状态
        if (this.patrolState.isPausing) {
            if (now - this.patrolState.pauseStart > this.patrolState.pauseTime) {
                this.patrolState.isPausing = false;
                this.patrolState.currentDirection = this.getRandomDirection();
                this.patrolState.lastDirectionChange = now;
                this.patrolState.moveTime = 1000 + Math.random() * 2000;
            }
            return; // 停顿期间不移动
        }
        
        // 检查是否需要改变方向或进入停顿
        if (now - this.patrolState.lastDirectionChange > this.patrolState.moveTime) {
            if (Math.random() < 0.3) {
                // 30%概率进入停顿状态
                this.patrolState.isPausing = true;
                this.patrolState.pauseStart = now;
                this.patrolState.pauseTime = 500 + Math.random() * 1000;
                return;
            } else {
                // 70%概率改变方向继续移动
                this.patrolState.currentDirection = this.getRandomDirection();
                this.patrolState.lastDirectionChange = now;
                this.patrolState.moveTime = 1000 + Math.random() * 2000;
            }
        }
        
        this.direction = this.patrolState.currentDirection;
        
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 'up': newY -= this.speed; break;
            case 'down': newY += this.speed; break;
            case 'left': newX -= this.speed; break;
            case 'right': newX += this.speed; break;
        }
        
        if (!this.checkCollision(newX, newY, walls, canvas)) {
            this.x = newX;
            this.y = newY;
        } else {
            // 碰到障碍物时立即改变方向
            this.patrolState.currentDirection = this.getRandomDirection();
            this.patrolState.lastDirectionChange = now;
            this.patrolState.moveTime = 1000 + Math.random() * 2000;
        }
    }
    
    // 添加hasLineOfSight方法（之前缺失的方法）
    hasLineOfSight(player, walls) {
        return this.canSeePlayer(player, walls);
    }
    
    // 获取随机方向
    getRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Math.floor(Math.random() * directions.length)];
    }
}