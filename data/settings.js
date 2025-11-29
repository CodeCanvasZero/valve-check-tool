// 系统配置文件
const CONFIG = {
    // 是否启用检测功能：1=启用，0=禁用
    ENABLE_DETECTION: 1,
    
    // 是否记录使用次数：1=启用，0=禁用
    ENABLE_COUNTING: 1,
    
    // 是否显示调试信息：1=启用，0=禁用
    ENABLE_DEBUG: 0,
    
    // 系统模式：'production'=生产环境, 'development'=开发环境, 'test'=测试环境
    // SYSTEM_MODE: 'production'
	SYSTEM_MODE: 'development'
	// SYSTEM_MODE: 'test'
};

// 根据模式自动设置配置（可选）
if (CONFIG.SYSTEM_MODE === 'development') {
    CONFIG.ENABLE_DETECTION = 1;
    CONFIG.ENABLE_COUNTING = 0;
    CONFIG.ENABLE_DEBUG = 1;
} else if (CONFIG.SYSTEM_MODE === 'test') {
    CONFIG.ENABLE_DETECTION = 0;
    CONFIG.ENABLE_COUNTING = 0;
    CONFIG.ENABLE_DEBUG = 1;
} else if (CONFIG.SYSTEM_MODE === 'production') {
    CONFIG.ENABLE_DETECTION = 1;
    CONFIG.ENABLE_COUNTING = 1;
    CONFIG.ENABLE_DEBUG = 0;
}
