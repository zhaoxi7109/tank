// UI交互脚本

// UI管理器类
class UIManager {
    constructor() {
        this.isInitialized = false;
        this.currentMenu = 'start';
        this.settings = {
            difficulty: 'normal',
            soundEnabled: true,
            showFPS: false,
            showGrid: false,
            showParticles: true,
            showTrails: true,
            masterVolume: 80,
            sfxVolume: 70,
            mouseSensitivity: 1.0,
            autoSave: true,
            minimapEnabled: true,
            minimapGrid: false,
            minimapTrails: false
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }
    
    setupUI() {
        this.bindMenuEvents();
        this.bindGameEvents();
        this.bindSettingsEvents();
        this.bindDialogEvents();
        this.loadSettings();
        this.hideLoadingScreen();
        this.isInitialized = true;
        
        console.log('UI管理器初始化完成');
    }
    
    // 绑定菜单事件
    bindMenuEvents() {
        // 开始游戏
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.hideMenu('start');
                if (window.game) {
                    window.game.startGame();
                }
            });
        }
        
        // 加载游戏
        const loadBtn = document.getElementById('loadGameBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (window.GameUtils && window.GameUtils.loadGame()) {
                    this.hideMenu('start');
                }
            });
        }
        
        // 显示设置
        const showSettingsBtn = document.getElementById('showSettingsBtn');
        if (showSettingsBtn) {
            showSettingsBtn.addEventListener('click', () => {
                this.showDialog('settings');
            });
        }
        
        // 显示帮助
        const showHelpBtn = document.getElementById('showHelpBtn');
        if (showHelpBtn) {
            showHelpBtn.addEventListener('click', () => {
                this.showDialog('help');
            });
        }
        
        // 继续游戏
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (window.game) {
                    window.game.resumeGame();
                }
                this.hideMenu('pause');
            });
        }
        
        // 重新开始
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (window.game) {
                    window.game.restartGame();
                }
                this.hideMenu('pause');
            });
        }
        
        // 主菜单
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                if (window.game) {
                    window.game.stopGame();
                }
                this.hideMenu('pause');
                this.showMenu('start');
            });
        }
        
        // 再玩一次
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                if (window.game) {
                    window.game.restartGame();
                }
                this.hideMenu('gameOver');
            });
        }
        
        // 返回菜单
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                if (window.game) {
                    window.game.stopGame();
                }
                this.hideMenu('gameOver');
                this.showMenu('start');
            });
        }
    }
    
    // 绑定游戏控制事件
    bindGameEvents() {
        // 暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (window.game) {
                    if (window.game.isPaused) {
                        window.game.resumeGame();
                    } else {
                        window.game.manualPause();
                    }
                }
            });
        }
        
        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showDialog('settings');
            });
        }
        
        // 全屏按钮
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // 快速设置
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.settings.difficulty = e.target.value;
                if (window.game && window.game.gameState) {
                    window.game.gameState.setDifficulty(e.target.value);
                }
                this.saveSettings();
            });
        }
        
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.settings.soundEnabled = e.target.checked;
                this.saveSettings();
                
                // 控制AudioManager的音效开关
                if (window.audioManager) {
                    window.audioManager.setEnabled(e.target.checked);
                }
            });
        }
        
        const fpsToggle = document.getElementById('fpsToggle');
        if (fpsToggle) {
            fpsToggle.addEventListener('change', (e) => {
                this.settings.showFPS = e.target.checked;
                this.updateFPSDisplay(e.target.checked);
                if (window.game && window.game.gameRenderer) {
                    window.game.gameRenderer.setRenderOptions({
                        showFPS: e.target.checked
                    });
                }
                this.saveSettings();
            });
        }
        
        const gridToggle = document.getElementById('gridToggle');
        if (gridToggle) {
            gridToggle.addEventListener('change', (e) => {
                this.settings.showGrid = e.target.checked;
                if (window.game && window.game.gameRenderer) {
                    window.game.gameRenderer.setRenderOptions({
                        showGrid: e.target.checked
                    });
                }
                this.saveSettings();
            });
        }
    }
    
    // 绑定设置对话框事件
    bindSettingsEvents() {
        // 标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // 音量滑块
        const masterVolume = document.getElementById('masterVolume');
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                this.settings.masterVolume = parseInt(e.target.value);
                document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
            });
            
            masterVolume.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        
        const sfxVolume = document.getElementById('sfxVolume');
        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                this.settings.sfxVolume = parseInt(e.target.value);
                document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
            });
            
            sfxVolume.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        
        // 鼠标灵敏度
        const mouseSensitivity = document.getElementById('mouseSensitivity');
        if (mouseSensitivity) {
            mouseSensitivity.addEventListener('input', (e) => {
                this.settings.mouseSensitivity = parseFloat(e.target.value);
                document.getElementById('mouseSensitivityValue').textContent = e.target.value;
            });
            
            mouseSensitivity.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        
        // 其他设置
        const showParticles = document.getElementById('showParticles');
        if (showParticles) {
            showParticles.addEventListener('change', (e) => {
                this.settings.showParticles = e.target.checked;
                this.saveSettings();
            });
        }
        
        const showTrails = document.getElementById('showTrails');
        if (showTrails) {
            showTrails.addEventListener('change', (e) => {
                this.settings.showTrails = e.target.checked;
                this.saveSettings();
            });
        }
        
        const autoSave = document.getElementById('autoSave');
        if (autoSave) {
            autoSave.addEventListener('change', (e) => {
                this.settings.autoSave = e.target.checked;
                this.saveSettings();
            });
        }
        
        // 小地图设置
        const minimapEnabledToggle = document.getElementById('minimapEnabled');
        if (minimapEnabledToggle) {
            minimapEnabledToggle.addEventListener('change', (e) => {
                this.settings.minimapEnabled = e.target.checked;
                this.saveSettings();
                
                // 控制小地图显示
                if (window.game && window.game.minimapManager) {
                    window.game.minimapManager.setEnabled(e.target.checked);
                }
            });
        }
        
        const minimapGridToggle = document.getElementById('minimapGrid');
        if (minimapGridToggle) {
            minimapGridToggle.addEventListener('change', (e) => {
                this.settings.minimapGrid = e.target.checked;
                this.saveSettings();
                
                // 控制小地图网格显示
                if (window.game && window.game.minimapManager) {
                    window.game.minimapManager.setShowGrid(e.target.checked);
                }
            });
        }
        
        const minimapTrailsToggle = document.getElementById('minimapTrails');
        if (minimapTrailsToggle) {
            minimapTrailsToggle.addEventListener('change', (e) => {
                this.settings.minimapTrails = e.target.checked;
                this.saveSettings();
                
                // 控制小地图轨迹显示
                if (window.game && window.game.minimapManager) {
                    window.game.minimapManager.setShowPlayerTrail(e.target.checked);
                    window.game.minimapManager.setShowEnemyPaths(e.target.checked);
                }
            });
        }
        
        // 游戏难度（设置对话框中的）
        const gameplayDifficulty = document.getElementById('gameplayDifficulty');
        if (gameplayDifficulty) {
            gameplayDifficulty.addEventListener('change', (e) => {
                this.settings.difficulty = e.target.value;
                // 同步快速设置中的难度选择
                const quickDifficulty = document.getElementById('difficultySelect');
                if (quickDifficulty) {
                    quickDifficulty.value = e.target.value;
                }
                if (window.game && window.game.gameState) {
                    window.game.gameState.setDifficulty(e.target.value);
                }
                this.saveSettings();
            });
        }
        
        // 保存设置
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                this.hideDialog('settings');
                this.showMessage('设置已保存', 'success');
            });
        }
        
        // 重置设置
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
                this.showMessage('设置已重置', 'info');
            });
        }
    }
    
    // 绑定对话框事件
    bindDialogEvents() {
        // 关闭设置对话框
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideDialog('settings');
            });
        }
        
        // 关闭帮助对话框
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => {
                this.hideDialog('help');
            });
        }
        
        // 点击对话框外部关闭
        const settingsDialog = document.getElementById('settingsDialog');
        if (settingsDialog) {
            settingsDialog.addEventListener('click', (e) => {
                if (e.target === settingsDialog) {
                    this.hideDialog('settings');
                }
            });
        }
        
        const helpDialog = document.getElementById('helpDialog');
        if (helpDialog) {
            helpDialog.addEventListener('click', (e) => {
                if (e.target === helpDialog) {
                    this.hideDialog('help');
                }
            });
        }
    }
    
    // 显示菜单
    showMenu(menuType) {
        this.hideAllMenus();
        
        const menuElement = document.getElementById(menuType + 'Menu');
        if (menuElement) {
            menuElement.classList.remove('hidden');
            this.currentMenu = menuType;
        }
    }
    
    // 隐藏菜单
    hideMenu(menuType) {
        const menuElement = document.getElementById(menuType + 'Menu');
        if (menuElement) {
            menuElement.classList.add('hidden');
        }
        
        if (this.currentMenu === menuType) {
            this.currentMenu = null;
        }
    }
    
    // 隐藏所有菜单
    hideAllMenus() {
        const menus = ['startMenu', 'pauseMenu', 'gameOverMenu'];
        menus.forEach(menuId => {
            const menu = document.getElementById(menuId);
            if (menu) {
                menu.classList.add('hidden');
            }
        });
    }
    
    // 显示对话框
    showDialog(dialogType) {
        const dialog = document.getElementById(dialogType + 'Dialog');
        if (dialog) {
            dialog.classList.remove('hidden');
            
            // 如果是设置对话框，同步当前设置
            if (dialogType === 'settings') {
                this.syncSettingsToDialog();
            }
        }
    }
    
    // 隐藏对话框
    hideDialog(dialogType) {
        const dialog = document.getElementById(dialogType + 'Dialog');
        if (dialog) {
            dialog.classList.add('hidden');
        }
    }
    
    // 切换标签页
    switchTab(tabName) {
        // 隐藏所有标签页
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 移除所有标签按钮的激活状态
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示目标标签页
        const targetPanel = document.getElementById(tabName + 'Tab');
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        
        // 激活对应的标签按钮
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }
    
    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer && gameContainer.requestFullscreen) {
                gameContainer.requestFullscreen().catch(err => {
                    console.error('进入全屏失败:', err);
                    this.showMessage('无法进入全屏模式', 'error');
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.error('退出全屏失败:', err);
                });
            }
        }
    }
    
    // 更新游戏统计显示
    updateGameStats(stats) {
        if (!stats) return;
        
        // 更新头部统计
        this.updateElement('scoreDisplay', stats.score || 0);
        this.updateElement('levelDisplay', stats.level || 1);
        this.updateElement('livesDisplay', stats.lives || 3);
        this.updateElement('timeDisplay', this.formatTime(stats.gameTime || 0));
        
        // 更新侧边栏信息
        this.updateElement('enemyCount', stats.enemyCount || 0);
        this.updateElement('killCount', stats.killCount || 0);
        this.updateElement('accuracyDisplay', (stats.accuracy || 0) + '%');
        
        // 更新玩家状态
        this.updatePlayerHealth(stats.playerHealth || 100, stats.playerMaxHealth || 100);
        this.updateElement('ammoDisplay', stats.ammo === -1 ? '∞' : stats.ammo || 0);
        this.updateElement('weaponDisplay', stats.weaponType || '普通');
    }
    
    // 更新玩家血量显示
    updatePlayerHealth(current, max) {
        const healthBar = document.getElementById('playerHealthBar');
        const healthText = document.getElementById('playerHealthText');
        
        if (healthBar) {
            const percentage = (current / max) * 100;
            healthBar.style.width = percentage + '%';
            
            // 根据血量改变颜色
            if (percentage > 60) {
                healthBar.style.backgroundColor = '#4CAF50';
            } else if (percentage > 30) {
                healthBar.style.backgroundColor = '#FF9800';
            } else {
                healthBar.style.backgroundColor = '#F44336';
            }
        }
        
        if (healthText) {
            healthText.textContent = `${current}/${max}`;
        }
    }
    
    // 更新FPS显示
    updateFPS(fps) {
        const fpsDisplay = document.getElementById('fpsDisplay');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${Math.round(fps)}`;
        }
    }
    
    // 更新FPS显示可见性
    updateFPSDisplay(show) {
        const fpsDisplay = document.getElementById('fpsDisplay');
        if (fpsDisplay) {
            if (show) {
                fpsDisplay.classList.remove('hidden');
            } else {
                fpsDisplay.classList.add('hidden');
            }
        }
    }
    
    // 显示游戏结束统计
    showGameOverStats(stats) {
        this.updateElement('finalScore', stats.score || 0);
        this.updateElement('finalTime', this.formatTime(stats.gameTime || 0));
        this.updateElement('finalKills', stats.killCount || 0);
        this.updateElement('finalAccuracy', (stats.accuracy || 0) + '%');
        
        // 设置游戏结束标题
        const title = document.getElementById('gameOverTitle');
        if (title) {
            title.textContent = stats.victory ? '胜利!' : '游戏结束';
        }
        
        this.showMenu('gameOver');
    }
    
    // 显示消息
    showMessage(text, type = 'info', duration = 3000) {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        
        container.appendChild(message);
        
        // 添加显示动画
        setTimeout(() => {
            message.classList.add('show');
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, duration);
    }
    
    // 隐藏加载屏幕
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }
    
    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem('tankGameSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }
    
    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('tankGameSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            this.applySettings();
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    // 应用设置
    applySettings() {
        // 应用到UI元素
        this.updateElement('difficultySelect', this.settings.difficulty, 'value');
        this.updateElement('soundToggle', this.settings.soundEnabled, 'checked');
        this.updateElement('fpsToggle', this.settings.showFPS, 'checked');
        this.updateElement('gridToggle', this.settings.showGrid, 'checked');
        
        this.updateFPSDisplay(this.settings.showFPS);
    }
    
    // 重置设置
    resetSettings() {
        this.settings = {
            difficulty: 'normal',
            soundEnabled: true,
            showFPS: false,
            showGrid: false,
            showParticles: true,
            showTrails: true,
            masterVolume: 80,
            sfxVolume: 70,
            mouseSensitivity: 1.0,
            autoSave: true,
            minimapEnabled: true,
            minimapGrid: false,
            minimapTrails: false
        };
        
        this.applySettings();
        this.syncSettingsToDialog();
        this.saveSettings();
    }
    
    // 同步设置到对话框
    syncSettingsToDialog() {
        this.updateElement('gameplayDifficulty', this.settings.difficulty, 'value');
        this.updateElement('showParticles', this.settings.showParticles, 'checked');
        this.updateElement('showTrails', this.settings.showTrails, 'checked');
        this.updateElement('autoSave', this.settings.autoSave, 'checked');
        
        // 小地图设置
        this.updateElement('minimapEnabled', this.settings.minimapEnabled, 'checked');
        this.updateElement('minimapGrid', this.settings.minimapGrid, 'checked');
        this.updateElement('minimapTrails', this.settings.minimapTrails, 'checked');
        
        this.updateElement('masterVolume', this.settings.masterVolume, 'value');
        this.updateElement('sfxVolume', this.settings.sfxVolume, 'value');
        this.updateElement('mouseSensitivity', this.settings.mouseSensitivity, 'value');
        
        this.updateElement('masterVolumeValue', this.settings.masterVolume + '%');
        this.updateElement('sfxVolumeValue', this.settings.sfxVolume + '%');
        this.updateElement('mouseSensitivityValue', this.settings.mouseSensitivity.toString());
    }
    
    // 更新元素内容或属性
    updateElement(id, value, property = 'textContent') {
        const element = document.getElementById(id);
        if (element) {
            if (property === 'textContent') {
                element.textContent = value;
            } else {
                element[property] = value;
            }
        }
    }
    
    // 格式化时间
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 获取设置
    getSettings() {
        return { ...this.settings };
    }
    
    // 更新设置
    updateSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveSettings();
        }
    }
    
    // 更新难度显示
    updateDifficultyDisplay(difficultyName) {
        // 更新设置面板中的难度选择
        this.updateElement('difficultySelect', difficultyName, 'value');
        this.updateElement('gameplayDifficulty', difficultyName, 'value');
        
        // 更新设置中的难度值
        this.settings.difficulty = difficultyName;
        
        console.log(`UI难度显示已更新为: ${difficultyName}`);
    }
}

// 创建全局UI管理器实例
window.uiManager = new UIManager();

// 暴露到全局
window.uiManager = uiManager;

// 导出（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

console.log('UI交互脚本加载完成');