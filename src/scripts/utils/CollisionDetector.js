// 碰撞检测工具类
class CollisionDetector {
    constructor() {
        // 碰撞检测精度
        this.precision = 0.1;
    }
    
    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 圆形碰撞检测
    circleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }
    
    // 点与矩形碰撞检测
    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    // 点与圆形碰撞检测
    pointInCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= circle.radius;
    }
    
    // 线段与矩形碰撞检测
    lineRectCollision(line, rect) {
        // 检查线段端点是否在矩形内
        if (this.pointInRect(line.start, rect) || this.pointInRect(line.end, rect)) {
            return true;
        }
        
        // 检查线段是否与矩形边相交
        const rectLines = [
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } }, // 上边
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }, // 右边
            { start: { x: rect.x + rect.width, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y + rect.height } }, // 下边
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y } } // 左边
        ];
        
        for (const rectLine of rectLines) {
            if (this.lineLineCollision(line, rectLine)) {
                return true;
            }
        }
        
        return false;
    }
    
    // 线段与线段碰撞检测
    lineLineCollision(line1, line2) {
        const x1 = line1.start.x;
        const y1 = line1.start.y;
        const x2 = line1.end.x;
        const y2 = line1.end.y;
        const x3 = line2.start.x;
        const y3 = line2.start.y;
        const x4 = line2.end.x;
        const y4 = line2.end.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < this.precision) {
            return false; // 平行线
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    // 检查坦克与墙壁碰撞
    checkTankWallCollision(tank, walls) {
        const tankRect = {
            x: tank.x,
            y: tank.y,
            width: tank.width,
            height: tank.height
        };
        
        for (const wall of walls) {
            if (!wall.active) continue;
            
            const wallRect = {
                x: wall.x,
                y: wall.y,
                width: wall.width,
                height: wall.height
            };
            
            if (this.rectCollision(tankRect, wallRect)) {
                return wall;
            }
        }
        
        return null;
    }
    
    // 检查坦克与坦克碰撞
    checkTankTankCollision(tank1, tank2) {
        if (!tank1.active || !tank2.active) return false;
        
        const rect1 = {
            x: tank1.x,
            y: tank1.y,
            width: tank1.width,
            height: tank1.height
        };
        
        const rect2 = {
            x: tank2.x,
            y: tank2.y,
            width: tank2.width,
            height: tank2.height
        };
        
        return this.rectCollision(rect1, rect2);
    }
    
    // 检查子弹与墙壁碰撞
    checkBulletWallCollision(bullet, walls) {
        const bulletRect = {
            x: bullet.x - bullet.width / 2,
            y: bullet.y - bullet.height / 2,
            width: bullet.width,
            height: bullet.height
        };
        
        for (const wall of walls) {
            if (!wall.active) continue;
            
            const wallRect = {
                x: wall.x,
                y: wall.y,
                width: wall.width,
                height: wall.height
            };
            
            if (this.rectCollision(bulletRect, wallRect)) {
                return wall;
            }
        }
        
        return null;
    }
    
    // 检查子弹与坦克碰撞
    checkBulletTankCollision(bullet, tank) {
        if (!tank.active) return false;
        
        const bulletRect = {
            x: bullet.x - bullet.width / 2,
            y: bullet.y - bullet.height / 2,
            width: bullet.width,
            height: bullet.height
        };
        
        const tankRect = {
            x: tank.x,
            y: tank.y,
            width: tank.width,
            height: tank.height
        };
        
        return this.rectCollision(bulletRect, tankRect);
    }
    
    // 检查爆炸与对象碰撞
    checkExplosionCollision(explosion, target) {
        if (!target.active) return false;
        
        const explosionCircle = {
            x: explosion.x,
            y: explosion.y,
            radius: explosion.radius
        };
        
        const targetRect = {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height
        };
        
        // 检查圆形与矩形碰撞
        return this.circleRectCollision(explosionCircle, targetRect);
    }
    
    // 圆形与矩形碰撞检测
    circleRectCollision(circle, rect) {
        // 找到矩形上距离圆心最近的点
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        // 计算距离
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= circle.radius;
    }
    
    // 检查视线是否被阻挡
    isLineOfSightBlocked(start, end, walls) {
        const line = { start, end };
        
        for (const wall of walls) {
            if (!wall.active) continue;
            
            const wallRect = {
                x: wall.x,
                y: wall.y,
                width: wall.width,
                height: wall.height
            };
            
            if (this.lineRectCollision(line, wallRect)) {
                return true;
            }
        }
        
        return false;
    }
    
    // 获取碰撞方向
    getCollisionDirection(moving, stationary) {
        const dx = (moving.x + moving.width / 2) - (stationary.x + stationary.width / 2);
        const dy = (moving.y + moving.height / 2) - (stationary.y + stationary.height / 2);
        
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDx > absDy) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }
    
    // 计算反射角度
    calculateReflectionAngle(incomingAngle, surfaceNormal) {
        // 入射角 = 反射角
        return 2 * surfaceNormal - incomingAngle;
    }
    
    // 获取墙面法向量
    getWallNormal(wall, collisionPoint) {
        const wallCenterX = wall.x + wall.width / 2;
        const wallCenterY = wall.y + wall.height / 2;
        
        const dx = collisionPoint.x - wallCenterX;
        const dy = collisionPoint.y - wallCenterY;
        
        // 确定碰撞发生在墙的哪一面
        const ratioX = dx / (wall.width / 2);
        const ratioY = dy / (wall.height / 2);
        
        if (Math.abs(ratioX) > Math.abs(ratioY)) {
            // 左右面碰撞
            return ratioX > 0 ? 0 : Math.PI; // 右面或左面
        } else {
            // 上下面碰撞
            return ratioY > 0 ? Math.PI / 2 : -Math.PI / 2; // 下面或上面
        }
    }
    
    // 检查位置是否在边界内
    isInBounds(x, y, width, height, bounds) {
        return x >= bounds.x &&
               y >= bounds.y &&
               x + width <= bounds.x + bounds.width &&
               y + height <= bounds.y + bounds.height;
    }
    
    // 获取最近的有效位置
    getClosestValidPosition(x, y, width, height, walls, bounds) {
        let bestX = x;
        let bestY = y;
        let minDistance = Infinity;
        
        // 在周围搜索有效位置
        const searchRadius = 50;
        const step = 5;
        
        for (let testX = x - searchRadius; testX <= x + searchRadius; testX += step) {
            for (let testY = y - searchRadius; testY <= y + searchRadius; testY += step) {
                // 检查是否在边界内
                if (!this.isInBounds(testX, testY, width, height, bounds)) {
                    continue;
                }
                
                // 检查是否与墙壁碰撞
                const testRect = { x: testX, y: testY, width, height };
                let collision = false;
                
                for (const wall of walls) {
                    if (!wall.active) continue;
                    
                    const wallRect = {
                        x: wall.x,
                        y: wall.y,
                        width: wall.width,
                        height: wall.height
                    };
                    
                    if (this.rectCollision(testRect, wallRect)) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    const distance = Math.sqrt((testX - x) ** 2 + (testY - y) ** 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestX = testX;
                        bestY = testY;
                    }
                }
            }
        }
        
        return { x: bestX, y: bestY };
    }
    
    // 检查路径是否畅通
    isPathClear(start, end, walls, stepSize = 5) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / stepSize);
        
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        for (let i = 0; i <= steps; i++) {
            const checkX = start.x + stepX * i;
            const checkY = start.y + stepY * i;
            
            const point = { x: checkX, y: checkY };
            
            for (const wall of walls) {
                if (!wall.active) continue;
                
                const wallRect = {
                    x: wall.x,
                    y: wall.y,
                    width: wall.width,
                    height: wall.height
                };
                
                if (this.pointInRect(point, wallRect)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 计算两点间距离
    getDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 计算两点间角度
    getAngle(from, to) {
        return Math.atan2(to.y - from.y, to.x - from.x);
    }
    
    // 标准化角度到 0-2π 范围
    normalizeAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
    }
    
    // 计算角度差
    getAngleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }
}