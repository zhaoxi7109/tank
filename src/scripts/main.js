// 主入口文件

// 全局游戏实例
let game = null;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化游戏...');
    
    try {
        // 初始化音频管理器
        window.audioManager = new AudioManager();
        console.log('音频管理器初始化成功!');
        
        // 创建游戏引擎实例
        // 将第12行的 'game-canvas' 改为 'gameCanvas'
        game = new GameEngine('gameCanvas');
        
        // 将游戏实例设置为全局对象，方便调试
        window.game = game;
        
        console.log('游戏初始化成功!');
        
        // 绑定额外的事件监听器
        bindAdditionalEvents();
        
        // 显示初始画面
        showWelcomeMessage();
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showErrorMessage('游戏初始化失败，请刷新页面重试。');
    }
});

// 绑定额外的事件监听器
function bindAdditionalEvents() {
    // 绑定游戏控制按钮
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', function() {
            if (game) {
                game.startGame();
                showMessage('游戏开始！');
            }
        });
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', function() {
            if (game) {
                game.restartGame();
                showMessage('游戏重新开始！');
            }
        });
    }
    
    // 暂停按钮事件已在ui.js中处理
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'F1':
                e.preventDefault();
                toggleDebugMode();
                break;
            case 'F2':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'F5':
                e.preventDefault();
                if (game) {
                    game.restartGame();
                }
                break;
        }
    });
    
    // 窗口关闭前保存游戏状态
    window.addEventListener('beforeunload', function(e) {
        if (game && game.gameState.gameStarted && !game.gameState.gameOver) {
            game.gameState.saveState();
        }
    });
    
    // 处理页面可见性变化
    document.addEventListener('visibilitychange', function() {
        if (game) {
            if (document.hidden) {
                // 页面隐藏时自动暂停
                if (game.isRunning && !game.isPaused) {
                    game.pauseGame();
                }
            }
        }
    });
    
    // 绑定设置按钮事件
    bindSettingsEvents();
}

// 绑定设置相关事件
function bindSettingsEvents() {
    // 难度选择
    const difficultySelect = document.getElementById('difficultySelect');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', function(e) {
            if (game) {
                game.gameState.setDifficulty(e.target.value);
                showMessage(`难度已设置为: ${e.target.value}`);
            }
        });
    }
    
    // 音效开关
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', function(e) {
            // 这里可以添加音效控制逻辑
            showMessage(e.target.checked ? '音效已开启' : '音效已关闭');
        });
    }
    
    // 显示FPS开关
    const fpsToggle = document.getElementById('fpsToggle');
    if (fpsToggle) {
        fpsToggle.addEventListener('change', function(e) {
            if (game && game.gameRenderer) {
                game.gameRenderer.setRenderOptions({
                    showFPS: e.target.checked
                });
            }
        });
    }
    
    // 显示网格开关
    const gridToggle = document.getElementById('gridToggle');
    if (gridToggle) {
        gridToggle.addEventListener('change', function(e) {
            if (game && game.gameRenderer) {
                game.gameRenderer.setRenderOptions({
                    showGrid: e.target.checked
                });
            }
        });
    }
}

// 切换调试模式
function toggleDebugMode() {
    if (game && game.gameRenderer) {
        const currentDebug = game.gameRenderer.showDebugInfo;
        game.gameRenderer.setRenderOptions({
            showDebugInfo: !currentDebug
        });
        showMessage(currentDebug ? '调试模式已关闭' : '调试模式已开启');
    }
}

// 切换全屏模式
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // 进入全屏
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen().then(() => {
                showMessage('已进入全屏模式 (按F2退出)');
            }).catch(err => {
                console.error('进入全屏失败:', err);
            });
        }
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                showMessage('已退出全屏模式');
            }).catch(err => {
                console.error('退出全屏失败:', err);
            });
        }
    }
}

// 显示欢迎消息
function showWelcomeMessage() {
    const messages = [
        '欢迎来到坦克大战!',
        '使用WASD或方向键移动',
        '空格键或鼠标左键射击',
        'F1: 调试模式 | F2: 全屏 | F5: 重新开始'
    ];
    
    messages.forEach((message, index) => {
        setTimeout(() => {
            showMessage(message, 'info', 3000);
        }, index * 1000);
    });
}

// 显示消息
function showMessage(text, type = 'info', duration = 2000) {
    if (game && game.gameState) {
        game.gameState.addMessage(text, type, duration);
    } else {
        // 如果游戏还未初始化，使用浏览器通知
        console.log(`[${type.toUpperCase()}] ${text}`);
    }
}

// 显示错误消息
function showErrorMessage(text) {
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f44336;
        color: white;
        padding: 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = text;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 游戏工具函数
const GameUtils = {
    // 获取游戏统计信息
    getStats() {
        if (game && game.gameState) {
            return game.gameState.getGameStats();
        }
        return null;
    },
    
    // 保存游戏
    saveGame() {
        if (game && game.gameState) {
            const success = game.gameState.saveState();
            showMessage(success ? '游戏已保存' : '保存失败');
            return success;
        }
        return false;
    },
    
    // 加载游戏
    loadGame() {
        if (game && game.gameState) {
            const success = game.gameState.loadState();
            showMessage(success ? '游戏已加载' : '没有保存的游戏');
            return success;
        }
        return false;
    },
    
    // 重置游戏
    resetGame() {
        if (game) {
            game.restartGame();
            showMessage('游戏已重置');
        }
    },
    
    // 设置难度
    setDifficulty(difficulty) {
        if (game && game.gameState) {
            game.gameState.setDifficulty(difficulty);
            showMessage(`难度已设置为: ${difficulty}`);
        }
    },
    
    // 获取性能信息
    getPerformanceInfo() {
        if (game) {
            return {
                fps: game.fps,
                objectCounts: game.gameState.getObjectCounts(),
                renderStats: game.gameRenderer.getRenderStats()
            };
        }
        return null;
    },
    
    // 截图功能
    takeScreenshot() {
        if (game && game.canvas) {
            try {
                const dataURL = game.canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `tank-game-${Date.now()}.png`;
                link.href = dataURL;
                link.click();
                showMessage('截图已保存');
                return true;
            } catch (error) {
                console.error('截图失败:', error);
                showMessage('截图失败');
                return false;
            }
        }
        return false;
    }
};

// 将工具函数暴露到全局
window.GameUtils = GameUtils;

// 错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showErrorMessage('游戏运行时发生错误，请查看控制台获取详细信息。');
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    showErrorMessage('游戏运行时发生异步错误。');
});

// 导出主要对象（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        game,
        GameUtils
    };
}

console.log('坦克大战游戏脚本加载完成');
console.log('可用的调试命令:');
console.log('- game: 游戏实例');
console.log('- GameUtils: 游戏工具函数');
console.log('- F1: 切换调试模式');
console.log('- F2: 切换全屏模式');
console.log('- F5: 重新开始游戏');