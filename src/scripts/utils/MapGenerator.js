// 地图生成器类
class MapGenerator {
    constructor() {
        // 地图模板集合 - 16x12适合游戏窗口
        this.mapTemplates = [
            // 标准地图
            [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
            // 十字路口地图
            [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 1, 1, 0, 0],
                [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
                [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
            // 迷宫式地图
            [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 2, 2, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 2, 2, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
            // 要塞地图
            [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ],
        ];
        
        // 墙体类型定义
        this.wallTypes = {
            0: null,        // 空地
            1: 'brick',     // 砖墙
            2: 'steel',     // 钢墙
            3: 'explosive', // 爆炸墙
            4: 'reflective',// 反射墙
            5: 'healing',   // 自愈墙
            6: 'crystal',   // 水晶墙
            7: 'boundary'   // 边界墙
        };
    }
    
    // 生成随机地图
    generateRandomMap(mapRows, mapCols) {
        // 创建空白地图
        const baseMap = this.createEmptyMap(mapRows, mapCols);
        
        // 添加边界墙
        this.addBoundaryWalls(baseMap, mapRows, mapCols);
        
        // 随机选择一个模板作为基础
        const template = this.getRandomTemplate();
        
        // 应用模板到地图中心区域
        this.applyTemplate(baseMap, template, mapRows, mapCols);
        
        // 添加随机变异
        this.addRandomMutations(baseMap, mapRows, mapCols);
        
        // 添加特殊墙体
        this.addSpecialWalls(baseMap, mapRows, mapCols);
        
        // 确保玩家出生点畅通
        this.ensurePlayerSpawnArea(baseMap, mapRows, mapCols);
        
        return baseMap;
    }
    
    // 创建空白地图
    createEmptyMap(rows, cols) {
        const map = [];
        for (let row = 0; row < rows; row++) {
            map[row] = [];
            for (let col = 0; col < cols; col++) {
                map[row][col] = 0; // 初始化为空地
            }
        }
        return map;
    }
    
    // 添加边界墙
    addBoundaryWalls(map, rows, cols) {
        // 上下边界
        for (let col = 0; col < cols; col++) {
            map[0][col] = 7; // 上边界
            map[rows - 1][col] = 7; // 下边界
        }
        
        // 左右边界
        for (let row = 0; row < rows; row++) {
            map[row][0] = 7; // 左边界
            map[row][cols - 1] = 7; // 右边界
        }
    }
    
    // 获取随机模板
    getRandomTemplate() {
        return this.mapTemplates[Math.floor(Math.random() * this.mapTemplates.length)];
    }
    
    // 应用模板到地图
    applyTemplate(map, template, mapRows, mapCols) {
        const templateRows = template.length;
        const templateCols = template[0].length;
        
        // 计算模板在地图中的位置（居中）
        const startRow = Math.floor((mapRows - templateRows) / 2);
        const startCol = Math.floor((mapCols - templateCols) / 2);
        
        // 应用模板
        for (let row = 0; row < templateRows; row++) {
            for (let col = 0; col < templateCols; col++) {
                const mapRow = startRow + row;
                const mapCol = startCol + col;
                
                // 确保在地图范围内且不覆盖边界墙
                if (mapRow > 0 && mapRow < mapRows - 1 && 
                    mapCol > 0 && mapCol < mapCols - 1) {
                    map[mapRow][mapCol] = template[row][col];
                }
            }
        }
    }
    
    // 添加随机变异
    addRandomMutations(map, rows, cols) {
        for (let row = 2; row < rows - 2; row++) {
            for (let col = 2; col < cols - 2; col++) {
                // 10%的概率砖墙变空地
                if (map[row][col] === 1 && Math.random() < 0.1) {
                    map[row][col] = 0;
                }
                // 25%的概率空地变砖墙
                else if (map[row][col] === 0 && Math.random() < 0.25) {
                    map[row][col] = 1;
                }
            }
        }
    }
    
    // 添加特殊墙体
    addSpecialWalls(map, rows, cols) {
        // 使用网格系统分布钢墙，避免聚堆
        this.addSteelWalls(map, rows, cols);
        
        // 分布特殊墙体
        this.addRandomSpecialWalls(map, rows, cols);
    }
    
    // 添加钢墙
    addSteelWalls(map, rows, cols) {
        const gridSize = 3; // 每3x3区域最多放置一个钢墙
        const gridRows = Math.ceil(rows / gridSize);
        const gridCols = Math.ceil(cols / gridSize);
        
        for (let gridRow = 0; gridRow < gridRows; gridRow++) {
            for (let gridCol = 0; gridCol < gridCols; gridCol++) {
                // 35% 概率在此网格区域添加钢墙
                if (Math.random() < 0.35) {
                    const startRow = Math.max(2, gridRow * gridSize);
                    const startCol = Math.max(2, gridCol * gridSize);
                    const endRow = Math.min(startRow + gridSize, rows - 2);
                    const endCol = Math.min(startCol + gridSize, cols - 2);
                    
                    // 在此网格区域内随机选择位置
                    for (let attempts = 0; attempts < 5; attempts++) {
                        const row = startRow + Math.floor(Math.random() * (endRow - startRow));
                        const col = startCol + Math.floor(Math.random() * (endCol - startCol));
                        
                        if (map[row][col] === 0 || map[row][col] === 1) {
                            map[row][col] = 2; // 钢墙
                            break;
                        }
                    }
                }
            }
        }
    }
    
    // 添加随机特殊墙体
    addRandomSpecialWalls(map, rows, cols) {
        const specialWallTypes = [3, 4, 5, 6]; // 爆炸墙、反弹墙、自愈墙、水晶墙
        const specialPositions = [];
        
        // 尝试放置8个特殊墙体
        for (let i = 0; i < 8; i++) {
            for (let attempts = 0; attempts < 30; attempts++) {
                const row = 1 + Math.floor(Math.random() * (rows - 2));
                const col = 1 + Math.floor(Math.random() * (cols - 2));
                
                // 检查是否与已有特殊墙体距离足够远
                if (this.isPositionValid(row, col, specialPositions, map)) {
                    const wallType = specialWallTypes[Math.floor(Math.random() * specialWallTypes.length)];
                    map[row][col] = wallType;
                    specialPositions.push({row, col});
                    break;
                }
            }
        }
    }
    
    // 检查位置是否有效
    isPositionValid(row, col, existingPositions, map) {
        // 检查当前位置是否可以放置
        if (map[row][col] !== 0 && map[row][col] !== 1) {
            return false;
        }
        
        // 检查与已有特殊墙体的距离
        for (const pos of existingPositions) {
            const distance = Math.abs(pos.row - row) + Math.abs(pos.col - col);
            if (distance < 3) {
                return false;
            }
        }
        
        return true;
    }
    
    // 确保玩家出生点畅通
    ensurePlayerSpawnArea(map, rows, cols) {
        // 玩家出生在底部中央
        const playerRow = rows - 3; // 距离底部3格
        const playerCol = Math.floor(cols / 2);
        
        // 清除玩家周围3x3区域
        for (let row = playerRow - 1; row <= playerRow + 1; row++) {
            for (let col = playerCol - 1; col <= playerCol + 1; col++) {
                if (row >= 1 && row < rows - 1 && col >= 1 && col < cols - 1) {
                    if (map[row][col] !== 7) { // 不清除边界墙
                        map[row][col] = 0;
                    }
                }
            }
        }
        
        // 确保从玩家位置到地图中心有一条通路
        this.ensurePathToCenter(map, rows, cols, playerRow, playerCol);
    }
    
    // 确保到中心的通路
    ensurePathToCenter(map, rows, cols, startRow, startCol) {
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        
        // 创建垂直通路
        for (let row = startRow; row >= centerRow; row--) {
            if (map[row][startCol] !== 7) { // 不清除边界墙
                // 30%概率保留墙体以增加游戏乐趣
                if (Math.random() > 0.3) {
                    map[row][startCol] = 0;
                }
            }
            
            // 清除通路两侧的部分墙体
            if (startCol > 1 && map[row][startCol - 1] !== 7 && Math.random() > 0.5) {
                map[row][startCol - 1] = 0;
            }
            if (startCol < cols - 2 && map[row][startCol + 1] !== 7 && Math.random() > 0.5) {
                map[row][startCol + 1] = 0;
            }
        }
    }
    
    // 生成特定类型的地图
    generateSpecificMap(type, rows, cols) {
        switch (type) {
            case 'empty':
                return this.generateEmptyMap(rows, cols);
            case 'maze':
                return this.generateMazeMap(rows, cols);
            case 'fortress':
                return this.generateFortressMap(rows, cols);
            case 'arena':
                return this.generateArenaMap(rows, cols);
            default:
                return this.generateRandomMap(rows, cols);
        }
    }
    
    // 生成空旷地图
    generateEmptyMap(rows, cols) {
        const map = this.createEmptyMap(rows, cols);
        this.addBoundaryWalls(map, rows, cols);
        
        // 只添加少量障碍物
        for (let i = 0; i < 5; i++) {
            const row = 2 + Math.floor(Math.random() * (rows - 4));
            const col = 2 + Math.floor(Math.random() * (cols - 4));
            map[row][col] = 1;
        }
        
        this.ensurePlayerSpawnArea(map, rows, cols);
        return map;
    }
    
    // 生成迷宫地图
    generateMazeMap(rows, cols) {
        const map = this.createEmptyMap(rows, cols);
        this.addBoundaryWalls(map, rows, cols);
        
        // 使用递归回溯算法生成迷宫
        this.generateMaze(map, rows, cols);
        
        this.ensurePlayerSpawnArea(map, rows, cols);
        return map;
    }
    
    // 递归回溯迷宫生成
    generateMaze(map, rows, cols) {
        // 填充所有内部区域为墙
        for (let row = 1; row < rows - 1; row++) {
            for (let col = 1; col < cols - 1; col++) {
                map[row][col] = 1;
            }
        }
        
        // 从随机位置开始挖掘通路
        const startRow = 2;
        const startCol = 2;
        const stack = [{row: startRow, col: startCol}];
        const visited = new Set();
        
        map[startRow][startCol] = 0;
        visited.add(`${startRow},${startCol}`);
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getMazeNeighbors(current.row, current.col, rows, cols, visited);
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // 挖掘到下一个单元格
                const wallRow = current.row + (next.row - current.row) / 2;
                const wallCol = current.col + (next.col - current.col) / 2;
                
                map[next.row][next.col] = 0;
                map[wallRow][wallCol] = 0;
                
                visited.add(`${next.row},${next.col}`);
                stack.push(next);
            } else {
                stack.pop();
            }
        }
    }
    
    // 获取迷宫邻居
    getMazeNeighbors(row, col, rows, cols, visited) {
        const neighbors = [];
        const directions = [
            {row: -2, col: 0},  // 上
            {row: 2, col: 0},   // 下
            {row: 0, col: -2},  // 左
            {row: 0, col: 2}    // 右
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow > 0 && newRow < rows - 1 && 
                newCol > 0 && newCol < cols - 1 && 
                !visited.has(`${newRow},${newCol}`)) {
                neighbors.push({row: newRow, col: newCol});
            }
        }
        
        return neighbors;
    }
    
    // 生成要塞地图
    generateFortressMap(rows, cols) {
        const map = this.createEmptyMap(rows, cols);
        this.addBoundaryWalls(map, rows, cols);
        
        // 在四个角落创建要塞
        this.createFortress(map, 2, 2, 4, 4);
        this.createFortress(map, 2, cols - 6, 4, 4);
        this.createFortress(map, rows - 6, 2, 4, 4);
        this.createFortress(map, rows - 6, cols - 6, 4, 4);
        
        // 在中心创建大要塞
        const centerRow = Math.floor(rows / 2) - 2;
        const centerCol = Math.floor(cols / 2) - 2;
        this.createFortress(map, centerRow, centerCol, 4, 4);
        
        this.ensurePlayerSpawnArea(map, rows, cols);
        return map;
    }
    
    // 创建要塞结构
    createFortress(map, startRow, startCol, width, height) {
        // 外墙
        for (let row = startRow; row < startRow + height; row++) {
            for (let col = startCol; col < startCol + width; col++) {
                if (row === startRow || row === startRow + height - 1 || 
                    col === startCol || col === startCol + width - 1) {
                    map[row][col] = 2; // 钢墙
                }
            }
        }
        
        // 在中心放置特殊墙体
        const centerRow = startRow + Math.floor(height / 2);
        const centerCol = startCol + Math.floor(width / 2);
        if (map[centerRow] && map[centerRow][centerCol] !== undefined) {
            map[centerRow][centerCol] = 6; // 水晶墙
        }
    }
    
    // 生成竞技场地图
    generateArenaMap(rows, cols) {
        const map = this.createEmptyMap(rows, cols);
        this.addBoundaryWalls(map, rows, cols);
        
        // 创建圆形竞技场
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        const radius = Math.min(rows, cols) / 3;
        
        // 添加圆形墙壁
        for (let row = 1; row < rows - 1; row++) {
            for (let col = 1; col < cols - 1; col++) {
                const distance = Math.sqrt(
                    Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
                );
                
                if (distance > radius - 2 && distance < radius) {
                    map[row][col] = 1;
                }
            }
        }
        
        // 在圆心添加特殊结构
        map[centerRow][centerCol] = 6; // 水晶墙
        
        this.ensurePlayerSpawnArea(map, rows, cols);
        return map;
    }
    
    // 验证地图有效性
    validateMap(map) {
        // 检查是否有足够的空地
        let emptySpaces = 0;
        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                if (map[row][col] === 0) {
                    emptySpaces++;
                }
            }
        }
        
        const totalSpaces = map.length * map[0].length;
        const emptyRatio = emptySpaces / totalSpaces;
        
        // 至少30%的空地
        return emptyRatio >= 0.3;
    }
    
    // 获取墙体类型
    getWallType(value) {
        return this.wallTypes[value] || null;
    }
}