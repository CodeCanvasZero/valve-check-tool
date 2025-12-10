// 系统配置文件
const CONFIG = {
    // 是否启用检测功能：1=启用，0=禁用
    ENABLE_DETECTION: 1,
    
    // 是否记录使用次数：1=启用，0=禁用
    ENABLE_COUNTING: 1,
    
    // 是否显示调试信息：1=启用，0=禁用
    ENABLE_DEBUG: 0,
    
    // 系统模式：生产环境/开发环境/测试环境
    SYSTEM_MODE: 'production'
   	// SYSTEM_MODE: 'development'
   	//SYSTEM_MODE: 'test'
};

// 用户访问控制配置
const USER_ACCESS = {
    // 是否启用用户白名单：1=启用，0=禁用
    ENABLE_WHITELIST: 1,
    
    // 允许访问的用户名单（区分大小写）
    ALLOWED_USERS: [
        'admin0',
        '张三',
        '李四',
        '王五',
        '赵六',
        '锦鲤',
        '张树东',
        '蒋冰伟',
        '陈威',
        '汤剑峰',
        '陈凯',
        '李鑫',
        '马永杰',
        '董平发',
        '刘少威',
        '何峰',
        '杨渊',
        '杨嘉强',
        '技术员',
        '操作员',
        '检验员',
        'manager',
        'test'
    ],
    
    // 未授权时的提示信息
    UNAUTHORIZED_MESSAGE: '访问被拒绝：您不在授权用户名单中，请联系管理员。'
};

// 用户界面配置
const USER_UI = {
    // 是否默认隐藏用户名：true=隐藏，false=显示
    DEFAULT_HIDE_USERNAME: false,
    
    // 隐藏时显示的字符
    HIDDEN_CHAR: '*',
    
    // 隐藏时显示的字符数量
    HIDDEN_LENGTH: 3
};

// 根据模式自动设置配置（可选）
if (CONFIG.SYSTEM_MODE === 'development') {
    CONFIG.ENABLE_DETECTION = 1;
    CONFIG.ENABLE_COUNTING = 0;
    CONFIG.ENABLE_DEBUG = 1;
    // 开发环境可以禁用白名单方便测试
    USER_ACCESS.ENABLE_WHITELIST = 0;
} else if (CONFIG.SYSTEM_MODE === 'test') {
    CONFIG.ENABLE_DETECTION = 0;
    CONFIG.ENABLE_COUNTING = 0;
    CONFIG.ENABLE_DEBUG = 1;
    // 测试环境可以禁用白名单方便测试
    USER_ACCESS.ENABLE_WHITELIST = 0;
} else if (CONFIG.SYSTEM_MODE === 'production') {
    CONFIG.ENABLE_DETECTION = 1;
    CONFIG.ENABLE_COUNTING = 1;
    CONFIG.ENABLE_DEBUG = 0;
    // 生产环境启用白名单
    USER_ACCESS.ENABLE_WHITELIST = 1;
}