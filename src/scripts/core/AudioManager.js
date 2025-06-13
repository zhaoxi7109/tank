// 音效管理器
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.audioContext = null;
        this.gainNode = null;
        
        this.init();
    }
    
    // 初始化音频系统
    init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            
            // 预加载音效
            this.preloadSounds();
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
            this.enabled = false;
        }
    }
    
    // 预加载音效（使用程序生成的音效）
    preloadSounds() {
        const soundConfigs = {
            // 射击音效
            shoot: {
                frequency: 800,
                duration: 0.1,
                type: 'square',
                volume: 0.3
            },
            // 爆炸音效
            explosion: {
                frequency: 200,
                duration: 0.5,
                type: 'sawtooth',
                volume: 0.5,
                noise: true
            },
            // 击中音效
            hit: {
                frequency: 600,
                duration: 0.15,
                type: 'triangle',
                volume: 0.4
            },
            // 护盾激活
            shield_activate: {
                frequency: 1200,
                duration: 0.3,
                type: 'sine',
                volume: 0.4
            },
            // 激光音效
            laser: {
                frequency: 1500,
                duration: 0.2,
                type: 'sawtooth',
                volume: 0.5
            },
            // 道具拾取
            pickup: {
                frequency: 1000,
                duration: 0.2,
                type: 'sine',
                volume: 0.3
            },
            // 敌人死亡
            enemy_death: {
                frequency: 300,
                duration: 0.4,
                type: 'square',
                volume: 0.4
            },
            // 玩家死亡
            player_death: {
                frequency: 150,
                duration: 1.0,
                type: 'sawtooth',
                volume: 0.6
            },
            // 墙壁破坏
            wall_break: {
                frequency: 400,
                duration: 0.3,
                type: 'noise',
                volume: 0.3
            },
            // 游戏胜利
            victory: {
                frequency: 800,
                duration: 1.5,
                type: 'sine',
                volume: 0.5,
                melody: [800, 1000, 1200, 1600]
            },
            // 游戏失败
            game_over: {
                frequency: 200,
                duration: 2.0,
                type: 'sawtooth',
                volume: 0.5,
                descending: true
            }
        };
        
        // 为每个音效创建音频缓冲区
        for (const [name, config] of Object.entries(soundConfigs)) {
            this.createSound(name, config);
        }
    }
    
    // 创建程序生成的音效
    createSound(name, config) {
        if (!this.audioContext) return;
        
        try {
            const duration = config.duration;
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);
            
            if (config.melody) {
                // 创建旋律音效
                this.createMelody(data, config, sampleRate);
            } else if (config.noise) {
                // 创建噪音音效
                this.createNoise(data, config);
            } else {
                // 创建基础音效
                this.createTone(data, config, sampleRate);
            }
            
            this.sounds.set(name, buffer);
        } catch (error) {
            console.warn(`创建音效 ${name} 失败:`, error);
        }
    }
    
    // 创建基础音调
    createTone(data, config, sampleRate) {
        const frequency = config.frequency;
        const duration = config.duration;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const progress = t / duration;
            
            let value = 0;
            
            switch (config.type) {
                case 'sine':
                    value = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    value = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
                case 'triangle':
                    value = 2 * Math.abs(2 * (frequency * t - Math.floor(frequency * t + 0.5))) - 1;
                    break;
            }
            
            // 应用包络
            let envelope = 1;
            if (progress < 0.1) {
                envelope = progress / 0.1; // 淡入
            } else if (progress > 0.8) {
                envelope = (1 - progress) / 0.2; // 淡出
            }
            
            // 如果是下降音调
            if (config.descending) {
                const currentFreq = frequency * (1 - progress * 0.8);
                value = Math.sin(2 * Math.PI * currentFreq * t);
            }
            
            data[i] = value * envelope * config.volume;
        }
    }
    
    // 创建噪音音效
    createNoise(data, config) {
        for (let i = 0; i < data.length; i++) {
            const progress = i / data.length;
            let envelope = 1;
            
            if (progress < 0.1) {
                envelope = progress / 0.1;
            } else if (progress > 0.7) {
                envelope = (1 - progress) / 0.3;
            }
            
            data[i] = (Math.random() * 2 - 1) * envelope * config.volume;
        }
    }
    
    // 创建旋律音效
    createMelody(data, config, sampleRate) {
        const melody = config.melody;
        const noteLength = data.length / melody.length;
        
        for (let noteIndex = 0; noteIndex < melody.length; noteIndex++) {
            const frequency = melody[noteIndex];
            const startSample = Math.floor(noteIndex * noteLength);
            const endSample = Math.floor((noteIndex + 1) * noteLength);
            
            for (let i = startSample; i < endSample && i < data.length; i++) {
                const t = i / sampleRate;
                const noteProgress = (i - startSample) / (endSample - startSample);
                
                let envelope = 1;
                if (noteProgress < 0.1) {
                    envelope = noteProgress / 0.1;
                } else if (noteProgress > 0.8) {
                    envelope = (1 - noteProgress) / 0.2;
                }
                
                data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * config.volume;
            }
        }
    }
    
    // 播放音效
    play(soundName, volume = 1.0, pitch = 1.0) {
        if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) {
            return;
        }
        
        try {
            const buffer = this.sounds.get(soundName);
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.playbackRate.value = pitch;
            
            const finalVolume = volume * this.sfxVolume * this.masterVolume;
            gainNode.gain.value = Math.max(0, Math.min(1, finalVolume));
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            
            // 自动清理
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
            
        } catch (error) {
            console.warn(`播放音效 ${soundName} 失败:`, error);
        }
    }
    
    // 设置音效开关
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    // 设置主音量
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
    }
    
    // 设置音效音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 停止所有音效
    stopAll() {
        if (this.audioContext) {
            try {
                this.audioContext.suspend();
            } catch (error) {
                console.warn('停止音效失败:', error);
            }
        }
    }
    
    // 恢复音效
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                this.audioContext.resume();
            } catch (error) {
                console.warn('恢复音效失败:', error);
            }
        }
    }
    
    // 获取可用音效列表
    getAvailableSounds() {
        return Array.from(this.sounds.keys());
    }
}

// 创建全局音效管理器实例
window.audioManager = new AudioManager();