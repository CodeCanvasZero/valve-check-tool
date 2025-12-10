// GitHub Issues 计数配置
const GITHUB_OWNER = 'CodeCanvasZero';
const GITHUB_REPO = 'valve-check-tool';
const ISSUE_NUMBER = 1;

// 用户系统配置
const USER_SYSTEM_CONFIG = {
    STORAGE_KEY: 'valveCheckUserSystem',
    CURRENT_USER_KEY: 'valveCheckCurrentUser',
    MAX_RECENT_USERS: 5,
    USERNAME_DISPLAY_KEY: 'valveCheckUsernameDisplay'
};

// 使用次数记录功能
let localUsageCount = 0;    // 当前用户的使用次数
let totalUsageCount = 0;    // 所有用户的总使用次数（本地缓存）
let lastGitHubCount = 0;    // 最后一次从GitHub获取的计数

// 秘密统计按钮功能
let secretClickCount = 0;
let secretClickTimer = null;

// 用户系统功能
let currentUser = null;
let userSystem = {
    users: {},
    currentUser: null
};

// 用户名显示状态
let hideUsername = USER_UI.DEFAULT_HIDE_USERNAME;

// 检查用户是否在白名单中
function isUserAllowed(username) {
    // 如果禁用白名单，所有用户都允许
    if (USER_ACCESS.ENABLE_WHITELIST !== 1) {
        return true;
    }
    
    // 检查用户名是否在允许名单中
    return USER_ACCESS.ALLOWED_USERS.includes(username);
}

// 获取显示的用户名（根据隐藏设置）
function getDisplayUsername(username) {
    if (!username) return '加载中...';
    
    if (hideUsername) {
        return USER_UI.HIDDEN_CHAR.repeat(USER_UI.HIDDEN_LENGTH);
    }
    
    return username;
}

// 切换用户名显示状态
function toggleUsernameDisplay() {
    hideUsername = !hideUsername;
    
    // 保存设置到本地存储
    localStorage.setItem(USER_SYSTEM_CONFIG.USERNAME_DISPLAY_KEY, hideUsername.toString());
    
    // 更新头像图标状态
    updateUserIcon();
    
    // 更新用户名显示
    updateUserDisplay();
    
    // 显示提示消息
    const status = hideUsername ? '已隐藏' : '已显示';
    showTempMessage(`用户名${status}`, 'info');
}

// 更新用户头像图标状态
function updateUserIcon() {
    const userIcon = document.getElementById('userIcon');
    if (userIcon) {
        if (hideUsername) {
            userIcon.classList.add('hidden');
            userIcon.title = '显示用户名';
            userIcon.textContent = '🔒';
        } else {
            userIcon.classList.remove('hidden');
            userIcon.title = '隐藏用户名';
            userIcon.textContent = '👤';
        }
    }
}

// 初始化用户名显示设置
function initUsernameDisplay() {
    // 从本地存储加载用户名显示设置
    const savedSetting = localStorage.getItem(USER_SYSTEM_CONFIG.USERNAME_DISPLAY_KEY);
    if (savedSetting !== null) {
        hideUsername = savedSetting === 'true';
    }
    
    // 更新头像图标状态
    updateUserIcon();
}

// 初始化用户系统
function initUserSystem() {
    // 初始化用户名显示设置
    initUsernameDisplay();
    
    // 从本地存储加载用户数据
    const savedData = localStorage.getItem(USER_SYSTEM_CONFIG.STORAGE_KEY);
    if (savedData) {
        try {
            userSystem = JSON.parse(savedData);
        } catch (e) {
            console.error('用户数据解析失败:', e);
            userSystem = { users: {}, currentUser: null };
        }
    }
    
    // 检查是否有当前用户
    const savedCurrentUser = localStorage.getItem(USER_SYSTEM_CONFIG.CURRENT_USER_KEY);
    if (savedCurrentUser && userSystem.users[savedCurrentUser]) {
        // 验证当前用户是否仍在白名单中
        if (isUserAllowed(savedCurrentUser)) {
            currentUser = savedCurrentUser;
            userSystem.currentUser = savedCurrentUser;
            updateUserDisplay();
            hideLoginModal();
        } else {
            // 当前用户被移出白名单，清除登录状态
            localStorage.removeItem(USER_SYSTEM_CONFIG.CURRENT_USER_KEY);
            currentUser = null;
            userSystem.currentUser = null;
            showLoginModal();
            showTempMessage('您的访问权限已被更改，请重新登录', 'warning');
        }
    } else {
        showLoginModal();
    }
}

// 显示登录模态框
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
    
    // 显示最近使用的用户（只显示白名单中的用户）
    showRecentUsers();
    
    // 聚焦输入框
    setTimeout(() => {
        document.getElementById('usernameInput').focus();
    }, 100);
}

// 隐藏登录模态框
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'none';
}

// 显示最近使用的用户
function showRecentUsers() {
    const recentUsersList = document.getElementById('recentUsersList');
    if (!recentUsersList) return;
    
    const users = Object.values(userSystem.users);
    // 只显示在白名单中的用户
    const allowedUsers = users.filter(user => isUserAllowed(user.name));
    const recentUsers = allowedUsers
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
        .slice(0, USER_SYSTEM_CONFIG.MAX_RECENT_USERS);
    
    if (recentUsers.length === 0) {
        recentUsersList.innerHTML = '<p style="color: #999; font-size: 12px;">暂无最近用户</p>';
        return;
    }
    
    let html = '';
    recentUsers.forEach(user => {
        html += `
            <div class="user-item" onclick="selectRecentUser('${user.name}')">
                <div class="user-item-info">
                    <span class="user-item-name">${user.name}</span>
                    <span class="user-item-stats">使用${user.totalUsage}次</span>
                </div>
                <span class="user-item-action">点击登录</span>
            </div>
        `;
    });
    
    recentUsersList.innerHTML = html;
}

// 选择最近用户
function selectRecentUser(username) {
    document.getElementById('usernameInput').value = username;
    document.getElementById('usernameInput').focus();
}

// 用户登录
function login() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        showTempMessage('请输入用户名', 'warning');
        return;
    }
    
    // 检查用户是否在白名单中
    if (!isUserAllowed(username)) {
        showTempMessage(USER_ACCESS.UNAUTHORIZED_MESSAGE, 'warning');
        // 清空输入框并重新聚焦
        usernameInput.value = '';
        usernameInput.focus();
        return;
    }
    
    // 创建或更新用户信息
    if (!userSystem.users[username]) {
        userSystem.users[username] = {
            name: username,
            loginCount: 0,
            lastLogin: null,
            totalUsage: 0,
            todayUsage: 0,
            createDate: new Date().toISOString()
        };
    }
    
    // 更新登录信息
    const user = userSystem.users[username];
    user.loginCount++;
    user.lastLogin = new Date().toISOString();
    
    // 检查是否是新的一天，重置今日使用次数
    const today = new Date().toDateString();
    const lastLoginDate = new Date(user.lastLogin).toDateString();
    if (today !== lastLoginDate) {
        user.todayUsage = 0;
    }
    
    // 设置当前用户
    currentUser = username;
    userSystem.currentUser = username;
    
    // 保存到本地存储
    saveUserSystem();
    localStorage.setItem(USER_SYSTEM_CONFIG.CURRENT_USER_KEY, username);
    
    // 更新界面
    updateUserDisplay();
    hideLoginModal();
    
    // 显示欢迎消息
    showTempMessage(`欢迎回来，${username}！`, 'success');
    
    // 初始化使用次数
    initUsageCount();
}

// 用户退出
function logout() {
    if (confirm('确定要退出登录吗？')) {
        currentUser = null;
        userSystem.currentUser = null;
        localStorage.removeItem(USER_SYSTEM_CONFIG.CURRENT_USER_KEY);
        
        showLoginModal();
        showTempMessage('已安全退出', 'info');
    }
}

// 打开切换用户模态框
function openSwitchUserModal() {
    const modal = document.getElementById('switchUserModal');
    modal.style.display = 'block';
    
    // 显示用户列表（只显示白名单中的用户）
    showUsersList();
}

// 关闭切换用户模态框
function closeSwitchUserModal() {
    const modal = document.getElementById('switchUserModal');
    modal.style.display = 'none';
}

// 显示用户列表
function showUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const users = Object.values(userSystem.users);
    // 只显示在白名单中的用户
    const allowedUsers = users.filter(user => isUserAllowed(user.name));
    
    if (allowedUsers.length === 0) {
        usersList.innerHTML = '<p style="color: #999; text-align: center;">暂无授权用户</p>';
        return;
    }
    
    let html = '';
    allowedUsers.forEach(user => {
        const isCurrentUser = user.name === currentUser;
        html += `
            <div class="user-item" onclick="switchToUser('${user.name}')">
                <div class="user-item-info">
                    <span class="user-item-name">${user.name}</span>
                    <span class="user-item-stats">今日：${user.todayUsage}次 | 总计：${user.totalUsage}次</span>
                </div>
                <span class="user-item-action">${isCurrentUser ? '当前用户' : '切换'}</span>
            </div>
        `;
    });
    
    usersList.innerHTML = html;
}

// 切换到指定用户
function switchToUser(username) {
    if (username === currentUser) {
        closeSwitchUserModal();
        return;
    }
    
    // 检查目标用户是否在白名单中
    if (!isUserAllowed(username)) {
        showTempMessage(USER_ACCESS.UNAUTHORIZED_MESSAGE, 'warning');
        closeSwitchUserModal();
        return;
    }
    
    // 更新用户登录信息
    const user = userSystem.users[username];
    user.loginCount++;
    user.lastLogin = new Date().toISOString();
    
    // 检查是否是新的一天
    const today = new Date().toDateString();
    const lastLoginDate = new Date(user.lastLogin).toDateString();
    if (today !== lastLoginDate) {
        user.todayUsage = 0;
    }
    
    // 切换用户
    currentUser = username;
    userSystem.currentUser = username;
    
    // 保存数据
    saveUserSystem();
    localStorage.setItem(USER_SYSTEM_CONFIG.CURRENT_USER_KEY, username);
    
    // 更新界面
    updateUserDisplay();
    closeSwitchUserModal();
    
    // 显示消息
    showTempMessage(`已切换到用户：${username}`, 'success');
    
    // 重新初始化使用次数
    initUsageCount();
}

// 更新用户显示
function updateUserDisplay() {
    const user = currentUser && userSystem.users[currentUser] ? userSystem.users[currentUser] : null;
    const userNameElement = document.getElementById('currentUserName');
    const userStatsElement = document.getElementById('userStats');
    
    if (userNameElement) {
        userNameElement.textContent = user ? getDisplayUsername(user.name) : '加载中...';
    }
    
    if (userStatsElement && user) {
        userStatsElement.textContent = `今日：${user.todayUsage}次 | 总计：${user.totalUsage}次`;
    }
}

// 保存用户系统
function saveUserSystem() {
    localStorage.setItem(USER_SYSTEM_CONFIG.STORAGE_KEY, JSON.stringify(userSystem));
}

// 增加用户使用次数
function incrementUserUsage() {
    if (!currentUser || !userSystem.users[currentUser]) return;
    
    const user = userSystem.users[currentUser];
    user.totalUsage++;
    user.todayUsage++;
    
    saveUserSystem();
    updateUserDisplay();
}

// 初始化使用次数
function initUsageCount() {
    // 当前用户的使用次数
    if (currentUser && userSystem.users[currentUser]) {
        localUsageCount = userSystem.users[currentUser].totalUsage;
    } else {
        const savedLocal = localStorage.getItem('valveCheckLocalUsage');
        if (savedLocal) {
            localUsageCount = parseInt(savedLocal);
        }
    }
    
    // 从本地存储获取总次数缓存
    const savedTotal = localStorage.getItem('valveCheckTotalUsage');
    if (savedTotal) {
        totalUsageCount = parseInt(savedTotal);
        lastGitHubCount = totalUsageCount;
    }
    
    updateUsageDisplay();
    
    // 静默从 GitHub 获取最新次数（不阻塞页面加载）
    if (CONFIG.ENABLE_COUNTING === 1) {
        setTimeout(getGitHubUsageCount, 1000);
    }
}

// 更新显示
function updateUsageDisplay() {
    const localElement = document.getElementById('localCount');
    const totalElement = document.getElementById('totalCount');
    
    if (localElement) localElement.textContent = localUsageCount;
    if (totalElement) totalElement.textContent = totalUsageCount;
}

// 记录使用次数到 GitHub Issue
function recordToGitHub() {
    // 如果禁用计数，直接返回
    if (CONFIG.ENABLE_COUNTING !== 1) {
        return;
    }
    
    // 增加用户使用次数
    incrementUserUsage();
    
    // 先更新本地显示
    totalUsageCount++;
    localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
    updateUsageDisplay();
    
    // 然后异步更新 GitHub
    setTimeout(() => {
        fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`)
            .then(response => {
                if (!response.ok) throw new Error('GitHub API 请求失败');
                return response.json();
            })
            .then(issue => {
                const body = issue.body;
                const countMatch = body.match(/当前使用次数：(\d+)/);
                let currentCount = countMatch ? parseInt(countMatch[1]) : totalUsageCount;
                currentCount++;
                
                const newBody = body.replace(
                    /当前使用次数：\d+/,
                    `当前使用次数：${currentCount}`
                );
                
                const timestamp = new Date().toLocaleString('zh-CN');
                const updatedBody = newBody + `\n\n---\n✅ 使用记录：${timestamp}`;
                
                return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ body: updatedBody })
                });
            })
            .then(response => {
                if (!response.ok) throw new Error('更新 Issue 失败');
                return response.json();
            })
            .then(updatedIssue => {
                console.log('✅ 使用次数已记录到 GitHub');
                // 更新本地缓存为 GitHub 的实际值
                const countMatch = updatedIssue.body.match(/当前使用次数：(\d+)/);
                if (countMatch) {
                    const githubCount = parseInt(countMatch[1]);
                    totalUsageCount = Math.max(totalUsageCount, githubCount);
                    localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
                    updateUsageDisplay();
                }
            })
            .catch(error => {
                console.log('⚠️ GitHub 记录失败，使用本地计数');
                // 保持本地计数，下次成功时再同步
            });
    }, 500);
}

// 从 GitHub Issue 获取最新使用次数（增强版）
function getGitHubUsageCount() {
    const totalElement = document.getElementById('totalCount');
    if (totalElement) {
        totalElement.textContent = '获取中...';
    }
    
    fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`)
        .then(response => {
            if (!response.ok) throw new Error('GitHub API 请求失败');
            return response.json();
        })
        .then(issue => {
            const countMatch = issue.body.match(/当前使用次数：(\d+)/);
            if (countMatch) {
                const githubCount = parseInt(countMatch[1]);
                lastGitHubCount = githubCount;
                
                // 使用 GitHub 计数和本地计数中的较大值
                totalUsageCount = Math.max(totalUsageCount, githubCount);
                localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
                updateUsageDisplay();
                
                console.log('✅ 从 GitHub 获取最新次数:', githubCount);
                showTempMessage('数据已更新', 'success');
            }
        })
        .catch(error => {
            console.log('⚠️ 无法从 GitHub 获取最新次数，使用本地缓存');
            // 使用本地缓存值
            updateUsageDisplay();
            showTempMessage('使用本地缓存数据', 'warning');
        });
}

// 手动刷新总次数（增强版）
function refreshTotalCount() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.textContent;
    
    refreshBtn.textContent = '刷新中...';
    refreshBtn.disabled = true;
    
    if (CONFIG.ENABLE_COUNTING === 1) {
        getGitHubUsageCount();
    } else {
        showTempMessage('计数功能已禁用', 'warning');
    }
    
    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 2000);
}

// 显示临时消息 - 更紧凑的样式
function showTempMessage(message, type = 'success') {
    const existingMsg = document.getElementById('tempMessage');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const msgElement = document.createElement('div');
    msgElement.id = 'tempMessage';
    msgElement.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 6px 12px;
        border-radius: 3px;
        z-index: 1000;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
    `;
    msgElement.textContent = message;
    
    document.body.appendChild(msgElement);
    
    setTimeout(() => {
        msgElement.style.opacity = '0';
        msgElement.style.transform = 'translateX(-50%) translateY(-15px)';
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.remove();
            }
        }, 200);
    }, 2000);
}

// 查看 GitHub 统计
function viewGitHubStats() {
    window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`, '_blank');
}

// 重置个人计数
function resetMyCount() {
    if (confirm('确定要重置你的使用次数吗？总次数不会重置。')) {
        if (currentUser && userSystem.users[currentUser]) {
            userSystem.users[currentUser].totalUsage = 0;
            userSystem.users[currentUser].todayUsage = 0;
            saveUserSystem();
            updateUserDisplay();
        }
        
        localUsageCount = 0;
        localStorage.setItem('valveCheckLocalUsage', '0');
        updateUsageDisplay();
        showTempMessage('你的使用次数已重置为 0', 'success');
    }
}

// 初始化秘密按钮功能
function initSecretButton() {
    const secretBtn = document.getElementById('secretStatsBtn');
    if (secretBtn) {
        secretBtn.addEventListener('click', handleSecretClick);
    }
}

// 处理秘密按钮点击
function handleSecretClick() {
    secretClickCount++;
    
    // 清除之前的计时器
    if (secretClickTimer) {
        clearTimeout(secretClickTimer);
    }
    
    // 设置新的计时器（5秒内有效）
    secretClickTimer = setTimeout(() => {
        secretClickCount = 0;
        console.log('秘密点击计数已重置');
    }, 5000);
    
    // 显示点击反馈
    showSecretClickFeedback();
    
    // 检查是否达到20次
    if (secretClickCount >= 20) {
        // 达到20次，执行跳转
        secretClickCount = 0;
        if (secretClickTimer) {
            clearTimeout(secretClickTimer);
        }
        viewGitHubStats();
        showTempMessage('🎉 恭喜你发现了隐藏功能！', 'success');
    }
}

// 显示秘密点击反馈
function showSecretClickFeedback() {
    const secretBtn = document.getElementById('secretStatsBtn');
    if (secretBtn) {
        // 添加点击动画效果
        secretBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            secretBtn.style.transform = 'scale(1)';
        }, 150);
        
        // 在控制台显示点击次数（仅开发者可见）
        console.log(`秘密点击: ${secretClickCount}/20`);
        
        // 如果是第8次，给予提示
        if (secretClickCount === 8) {
            showTempMessage(`已点击 ${secretClickCount} 次，继续努力！`, 'info');
        }
    }
}

/**
 * 阀体产品检测函数
 * @param {string} partNumber 零件号
 * @param {string} customerName 客户名称
 * @param {string} productName 产品名称
 * @returns {string} 检测结果
 */
function 阀体产品检测(partNumber, customerName, productName) {
    // 检查客户名称和产品名称是否符合条件
    if (customerName !== "" || productName !== "阀体") {
        return "";
    }
    
    let hasLeadSeal = false;
    let hasNameplate = false;
    let seriesInfo = "";
    
    // --- 检查铅封孔 ---
    for (let i = 0; i < leadSealList.length; i++) {
        let key = leadSealList[i].toString();
        if (partNumber.toLowerCase().includes(key.toLowerCase())) {
            hasLeadSeal = true;
            break;
        }
    }
    // --- 检查铭牌孔并获取系列信息 ---
    for (let i = 0; i < nameplateData.length; i++) {
        for (let j = 1; j < nameplateData[i].length; j++) {
            let key = nameplateData[i][j].toString();
            if (partNumber.toLowerCase().includes(key.toLowerCase())) {
                hasNameplate = true;
                if (seriesInfo === "") {
                    seriesInfo = nameplateData[i][0];
                } else if (!seriesInfo.includes(nameplateData[i][0])) {
                    seriesInfo = seriesInfo + "/" + nameplateData[i][0];
                }
            }
        }
    }
    
    // --- 检查是否在两个列表中都不存在 ---
    if (!hasLeadSeal && !hasNameplate) {
        return "其他情况！请联系技术员确认。";
    }
    
    // --- 返回结果 ---
    let result = "";
    if (hasLeadSeal) {
        result = "需打铅封孔";
    } else {
        result = "不打铅封孔";
    }
    
    if (hasNameplate) {
        result = result + "、需打铭牌孔";
        if (seriesInfo !== "") result = result + "(" + seriesInfo + "系列)";
    } else {
        result = result + "、不打铭牌孔";
    }
    
    return result;
}

// 检测函数（添加配置检查）
function check() {
    // 检查用户是否已登录
    if (!currentUser) {
        showTempMessage('请先登录', 'warning');
        showLoginModal();
        return;
    }
    
    // 再次验证用户权限（双重检查）
    if (!isUserAllowed(currentUser)) {
        showTempMessage(USER_ACCESS.UNAUTHORIZED_MESSAGE, 'warning');
        logout();
        return;
    }
    
    const partNumber = document.getElementById('partNumber').value.trim();
    if (!partNumber) {
        document.getElementById('result').innerText = "请输入零件号";
        document.getElementById('result').className = "result";
        return;
    }
    
    // 检查是否启用检测功能
    if (CONFIG.ENABLE_DETECTION !== 1) {
        document.getElementById('result').innerText = "⚠️ 检测功能已禁用，请联系管理员。";
        document.getElementById('result').className = "result warning";
        return;
    }
    
    // 增加使用次数（如果启用计数）
    if (CONFIG.ENABLE_COUNTING === 1) {
        recordToGitHub();
    }
    
    const customerName = "";
    const productName = "阀体";
    const result = 阀体产品检测(partNumber, customerName, productName);
    document.getElementById('result').innerText = result;
    
    if (result === "其他情况！请联系技术员确认。") {
        document.getElementById('result').className = "result warning";
    } else {
        document.getElementById('result').className = "result";
    }
    
    // 调试信息
    if (CONFIG.ENABLE_DEBUG === 1) {
        console.log('检测配置状态：', {
            检测功能: CONFIG.ENABLE_DETECTION ? '启用' : '禁用',
            计数功能: CONFIG.ENABLE_COUNTING ? '启用' : '禁用',
            白名单功能: USER_ACCESS.ENABLE_WHITELIST ? '启用' : '禁用',
            当前用户: currentUser,
            用户授权: isUserAllowed(currentUser),
            用户名隐藏: hideUsername,
            零件号: partNumber,
            结果: result
        });
    }
}

// 重置函数
function reset() {
    document.getElementById('partNumber').value = '';
    document.getElementById('result').innerText = '';
    document.getElementById('result').className = "result";
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户系统
    initUserSystem();
    
    // 初始化使用次数
    initUsageCount();
    
    // 初始化秘密按钮功能
    initSecretButton();
    
    // 支持回车键登录
    document.getElementById('usernameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // 支持回车键检测
    document.getElementById('partNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            check();
        }
    });
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        const loginModal = document.getElementById('loginModal');
        const switchUserModal = document.getElementById('switchUserModal');
        
        if (event.target === loginModal) {
            // 登录模态框不允许点击外部关闭
            return;
        }
        
        if (event.target === switchUserModal) {
            closeSwitchUserModal();
        }
    }
    
    // 添加右键菜单重置使用次数（开发者功能）
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        resetMyCount();
    });
    
    // 显示系统状态
    const statusElement = document.getElementById('systemStatus');
    if (statusElement) {
        const modeText = {
            'production': '生产环境',
            'development': '开发环境',
            'test': '测试环境'
        };
        
        const detectionStatus = CONFIG.ENABLE_DETECTION ? '🟢' : '🔴';
        const countingStatus = CONFIG.ENABLE_COUNTING ? '🟢' : '🔴';
        const whitelistStatus = USER_ACCESS.ENABLE_WHITELIST ? '🟢' : '🔴';
        
        statusElement.innerHTML = `系统模式：${modeText[CONFIG.SYSTEM_MODE]} | 
                                  检测功能：${detectionStatus} | 
                                  计数功能：${countingStatus} | 
                                  白名单：${whitelistStatus}`;
    }
    
    // 在控制台显示当前配置（调试用）
    if (CONFIG.ENABLE_DEBUG === 1) {
        console.log('=== 系统配置 ===');
        console.log('系统模式:', CONFIG.SYSTEM_MODE);
        console.log('检测功能:', CONFIG.ENABLE_DETECTION ? '启用' : '禁用');
        console.log('计数功能:', CONFIG.ENABLE_COUNTING ? '启用' : '禁用');
        console.log('调试模式:', CONFIG.ENABLE_DEBUG ? '启用' : '禁用');
        console.log('白名单功能:', USER_ACCESS.ENABLE_WHITELIST ? '启用' : '禁用');
        console.log('允许用户:', USER_ACCESS.ALLOWED_USERS);
        console.log('用户名隐藏:', hideUsername);
        console.log('==================');
    }

    // 如果检测功能被禁用，在页面上显示提示
    if (CONFIG.ENABLE_DETECTION !== 1) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerText = "⚠️ 系统维护中，检测功能暂时不可用。";
        resultDiv.className = "result warning";
    }
});
