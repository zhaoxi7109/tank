// 事件处理工具类
class EventHandler {
    constructor() {
        // 初始化状态
        this.keyStates = {
            // 移动
            'up': false,
            'down': false,
            'left': false,
            'right': false,
            // 射击和技能
            'shoot': false,
            'skill1': false,
            'skill2': false,
            'skill3': false,
            'reload': false,
            'interact': false,
            // 游戏控制
            'menu': false,
            'scoreboard': false
        };
        this.mouseStates = {
            leftClick: false,
            middleClick: false,
            rightClick: false,
            x: 0,
            y: 0
        };
        this.gamepadStates = [];
        this.eventListeners = {};
        
        // 键盘按键映射
        this.keyMappings = {
            // 移动
            'ArrowUp': 'up',
            'KeyW': 'up',
            'ArrowDown': 'down',
            'KeyS': 'down',
            'ArrowLeft': 'left',
            'KeyA': 'left',
            'ArrowRight': 'right',
            'KeyD': 'right',
            
            // 射击和技能
            'Space': 'shoot',
            'KeyJ': 'shoot',
            'KeyQ': 'special1',
            'KeyE': 'special2',
            'KeyC': 'skill3',
            'KeyR': 'reload',
            'KeyF': 'interact',
            
            // 游戏控制
            'Escape': 'pause',
            'KeyP': 'pause',
            'KeyM': 'menu',
            'Tab': 'scoreboard'
        };
        
        // 鼠标按键映射
        this.mouseButtonMappings = {
            0: 'leftClick',
            1: 'middleClick',
            2: 'rightClick'
        };
        
        this.init();
    }
    
    // 初始化事件监听
    init() {
        this.bindKeyboardEvents();
        this.bindMouseEvents();
        this.bindGamepadEvents();
        this.bindWindowEvents();
    }
    
    // 绑定键盘事件
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            const action = this.keyMappings[e.code];
            if (action) {
                e.preventDefault();
                this.keyStates[action] = true;
                this.triggerEvent('keydown', { action, originalEvent: e });
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const action = this.keyMappings[e.code];
            if (action) {
                e.preventDefault();
                this.keyStates[action] = false;
                this.triggerEvent('keyup', { action, originalEvent: e });
            }
        });
    }
    
    // 绑定鼠标事件
    bindMouseEvents() {
        document.addEventListener('mousedown', (e) => {
            const button = this.mouseButtonMappings[e.button];
            if (button) {
                this.mouseStates[button] = true;
                this.mouseStates.x = e.clientX;
                this.mouseStates.y = e.clientY;
                this.triggerEvent('mousedown', { button, x: e.clientX, y: e.clientY, originalEvent: e });
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            const button = this.mouseButtonMappings[e.button];
            if (button) {
                this.mouseStates[button] = false;
                this.triggerEvent('mouseup', { button, x: e.clientX, y: e.clientY, originalEvent: e });
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouseStates.x = e.clientX;
            this.mouseStates.y = e.clientY;
            this.triggerEvent('mousemove', { x: e.clientX, y: e.clientY, originalEvent: e });
        });
        
        document.addEventListener('wheel', (e) => {
            this.triggerEvent('wheel', { deltaY: e.deltaY, originalEvent: e });
        });
        
        // 只在游戏画布上阻止右键菜单
        if (this.canvas) {
            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }
    
    // 绑定手柄事件
    bindGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {

            this.triggerEvent('gamepadconnected', { gamepad: e.gamepad });
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {

            this.triggerEvent('gamepaddisconnected', { gamepad: e.gamepad });
        });
    }
    
    // 绑定窗口事件
    bindWindowEvents() {
        window.addEventListener('resize', (e) => {
            this.triggerEvent('resize', { width: window.innerWidth, height: window.innerHeight });
        });
        
        window.addEventListener('focus', (e) => {
            this.triggerEvent('focus', {});
        });
        
        window.addEventListener('blur', (e) => {
            // 窗口失焦时清除所有按键状态
            this.clearAllStates();
            this.triggerEvent('blur', {});
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', (e) => {
            if (document.hidden) {
                this.clearAllStates();
                this.triggerEvent('hidden', {});
            } else {
                this.triggerEvent('visible', {});
            }
        });
    }
    
    // 更新手柄状态
    updateGamepadStates() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            const prevState = this.gamepadStates[i] || {};
            const currentState = {
                buttons: {},
                axes: {}
            };
            
            // 检查按钮状态
            for (let j = 0; j < gamepad.buttons.length; j++) {
                const button = gamepad.buttons[j];
                const pressed = button.pressed;
                const wasPressed = prevState.buttons && prevState.buttons[j];
                
                currentState.buttons[j] = pressed;
                
                // 触发按钮事件
                if (pressed && !wasPressed) {
                    this.triggerEvent('gamepadButtonDown', { gamepadIndex: i, buttonIndex: j });
                } else if (!pressed && wasPressed) {
                    this.triggerEvent('gamepadButtonUp', { gamepadIndex: i, buttonIndex: j });
                }
            }
            
            // 检查摇杆状态
            for (let j = 0; j < gamepad.axes.length; j++) {
                const axisValue = gamepad.axes[j];
                currentState.axes[j] = axisValue;
                
                // 摇杆死区处理
                if (Math.abs(axisValue) > 0.1) {
                    this.triggerEvent('gamepadAxisMove', { 
                        gamepadIndex: i, 
                        axisIndex: j, 
                        value: axisValue 
                    });
                }
            }
            
            this.gamepadStates[i] = currentState;
        }
    }
    
    // 添加事件监听器
    addEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
    }
    
    // 移除事件监听器
    removeEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            const index = this.eventListeners[eventType].indexOf(callback);
            if (index > -1) {
                this.eventListeners[eventType].splice(index, 1);
            }
        }
    }
    
    // 触发事件
    triggerEvent(eventType, data) {
        if (this.eventListeners[eventType]) {
            for (const callback of this.eventListeners[eventType]) {
                try {
                    callback(data);
                } catch (error) {
        
                }
            }
        }
    }
    
    // 检查按键是否按下
    isKeyPressed(action) {
        // 确保keyStates存在且包含该动作键
        if (!this.keyStates || !(action in this.keyStates)) {
            return false;
        }
        return !!this.keyStates[action];
    }
    
    // 检查鼠标按键是否按下
    isMousePressed(button) {
        return !!this.mouseStates[button];
    }
    
    // 获取鼠标位置
    getMousePosition() {
        return {
            x: this.mouseStates.x || 0,
            y: this.mouseStates.y || 0
        };
    }
    
    // 检查手柄按钮是否按下
    isGamepadButtonPressed(gamepadIndex, buttonIndex) {
        const gamepadState = this.gamepadStates[gamepadIndex];
        return gamepadState && gamepadState.buttons && gamepadState.buttons[buttonIndex];
    }
    
    // 获取手柄摇杆值
    getGamepadAxisValue(gamepadIndex, axisIndex) {
        const gamepadState = this.gamepadStates[gamepadIndex];
        if (gamepadState && gamepadState.axes && gamepadState.axes[axisIndex] !== undefined) {
            return gamepadState.axes[axisIndex];
        }
        return 0;
    }
    
    // 清除所有状态
    clearAllStates() {
        // 重置所有按键状态为false，而不是清空对象
        for (const key in this.keyStates) {
            this.keyStates[key] = false;
        }
        for (const button in this.mouseStates) {
            if (button !== 'x' && button !== 'y') {
                this.mouseStates[button] = false;
            }
        }
    }
    
    // 获取移动输入
    getMovementInput() {
        try {
            const movement = {
                up: false,
                down: false,
                left: false,
                right: false
            };
            
            // 确保keyStates对象存在且包含必要的键
            if (!this.keyStates) {
    
                this.keyStates = {
                    'up': false,
                    'down': false,
                    'left': false,
                    'right': false,
                    'shoot': false,
                    'skill1': false,
                    'skill2': false,
                    'skill3': false,
                    'reload': false,
                    'interact': false,
                    'menu': false,
                    'scoreboard': false
                };
            }
            
            // 键盘输入 - 使用安全的方式获取按键状态
            movement.left = this.isKeyPressed('left') || false;
            movement.right = this.isKeyPressed('right') || false;
            movement.up = this.isKeyPressed('up') || false;
            movement.down = this.isKeyPressed('down') || false;
            
            // 手柄输入（第一个手柄的左摇杆）
            const gamepadX = this.getGamepadAxisValue(0, 0);
            const gamepadY = this.getGamepadAxisValue(0, 1);
            
            if (gamepadX < -0.1) movement.left = true;
            if (gamepadX > 0.1) movement.right = true;
            if (gamepadY < -0.1) movement.up = true;
            if (gamepadY > 0.1) movement.down = true;
            
            return movement;
        } catch (error) {
            return {
                up: false,
                down: false,
                left: false,
                right: false
            };
        }
    }
    
    // 检查射击输入
    isShootPressed() {
        const keyPressed = this.isKeyPressed('shoot');
        const mousePressed = this.isMousePressed('leftClick');
        const gamepadPressed = this.isGamepadButtonPressed(0, 0);
        const result = keyPressed || mousePressed || gamepadPressed;
        
        if (result) {

        }
        
        return result;
    }
    
    // 检查特殊技能输入
    isSpecialPressed(skillIndex = 1) {
        const skillKey = `special${skillIndex}`;
        return this.isKeyPressed(skillKey) || 
               this.isMousePressed('rightClick') || 
               this.isGamepadButtonPressed(0, skillIndex); // B/X按钮
    }
    
    // 检查暂停输入
    isPausePressed() {
        return this.isKeyPressed('pause') || 
               this.isGamepadButtonPressed(0, 9); // Start按钮
    }
    
    // 设置键盘映射
    setKeyMapping(keyCode, action) {
        this.keyMappings[keyCode] = action;
    }
    
    // 获取键盘映射
    getKeyMapping(keyCode) {
        return this.keyMappings[keyCode];
    }
    
    // 重置键盘映射为默认
    resetKeyMappings() {
        this.keyMappings = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right',
            'Space': 'shoot',
            'Enter': 'shoot',
            'KeyJ': 'shoot',
            'KeyQ': 'special1',
            'KeyE': 'special2',
            'KeyR': 'reload',
            'KeyF': 'interact',
            'Escape': 'pause',
            'KeyP': 'pause',
            'KeyM': 'menu',
            'Tab': 'scoreboard'
        };
    }
    
    // 获取所有按下的按键
    getPressedKeys() {
        const pressed = [];
        for (const action in this.keyStates) {
            if (this.keyStates[action]) {
                pressed.push(action);
            }
        }
        return pressed;
    }
    
    // 获取所有按下的鼠标按键
    getPressedMouseButtons() {
        const pressed = [];
        for (const button in this.mouseStates) {
            if (button !== 'x' && button !== 'y' && this.mouseStates[button]) {
                pressed.push(button);
            }
        }
        return pressed;
    }
    
    // 销毁事件处理器
    destroy() {
        // 移除所有事件监听器
        this.eventListeners = {};
        this.clearAllStates();
    }
    
    // 获取输入状态摘要
    getInputSummary() {
        return {
            movement: this.getMovementInput(),
            shoot: this.isShootPressed(),
            special1: this.isSpecialPressed(1),
            special2: this.isSpecialPressed(2),
            pause: this.isPausePressed(),
            pressedKeys: this.getPressedKeys(),
            pressedMouseButtons: this.getPressedMouseButtons(),
            mousePosition: this.getMousePosition()
        };
    }
}