// GitHub Issues 计数配置
const GITHUB_OWNER = 'CodeCanvasZero';
const GITHUB_REPO = 'valve-check-tool';
const ISSUE_NUMBER = 1;

// 使用次数记录功能
let localUsageCount = 0;    // 当前用户的使用次数
let totalUsageCount = 0;    // 所有用户的总使用次数（本地缓存）
let lastGitHubCount = 0;    // 最后一次从GitHub获取的计数

// 秘密统计按钮功能
let secretClickCount = 0;
let secretClickTimer = null;

// 初始化使用次数
function initUsageCount() {
    // 当前用户的使用次数
    const savedLocal = localStorage.getItem('valveCheckLocalUsage');
    if (savedLocal) {
        localUsageCount = parseInt(savedLocal);
    }
    
    // 从本地存储获取总次数缓存
    const savedTotal = localStorage.getItem('valveCheckTotalUsage');
    if (savedTotal) {
        totalUsageCount = parseInt(savedTotal);
        lastGitHubCount = totalUsageCount;
    }
    
    updateUsageDisplay();
    
    // 静默从 GitHub 获取最新次数（不阻塞页面加载）
    setTimeout(getGitHubUsageCount, 1000);
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
                showTempMessage('统计数据已更新', 'success');
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
    
    getGitHubUsageCount();
    
    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 2000);
}

// 显示临时消息
function showTempMessage(message, type = 'success') {
    const existingMsg = document.getElementById('tempMessage');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const msgElement = document.createElement('div');
    msgElement.id = 'tempMessage';
    msgElement.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : '#ffc107'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;
    msgElement.textContent = message;
    
    document.body.appendChild(msgElement);
    
    setTimeout(() => {
        msgElement.style.opacity = '0';
        msgElement.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.remove();
            }
        }, 300);
    }, 3000);
}

// 查看 GitHub 统计
function viewGitHubStats() {
    window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`, '_blank');
}

// 增加使用次数
function incrementUsageCount() {
    localUsageCount++;
    localStorage.setItem('valveCheckLocalUsage', localUsageCount.toString());
    
    // 记录到 GitHub
    recordToGitHub();
    
    updateUsageDisplay();
}

// 重置个人计数
function resetMyCount() {
    if (confirm('确定要重置你的使用次数吗？总次数不会重置。')) {
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
    
    // 检查是否达到10次
    if (secretClickCount >= 10) {
        // 达到10次，执行跳转
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
        console.log(`秘密点击: ${secretClickCount}/10`);
        
        // 如果是第5次，给予提示
        if (secretClickCount === 5) {
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


// 检测函数
function check() {
    const partNumber = document.getElementById('partNumber').value.trim();
    if (!partNumber) {
        document.getElementById('result').innerText = "请输入零件号";
        document.getElementById('result').className = "result";
        return;
    }
    
    // 增加使用次数
    incrementUsageCount();
    
    const customerName = "";
    const productName = "阀体";
    const result = 阀体产品检测(partNumber, customerName, productName);
    document.getElementById('result').innerText = result;
    
    if (result === "其他情况！请联系技术员确认。") {
        document.getElementById('result').className = "result warning";
    } else {
        document.getElementById('result').className = "result";
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
    // 初始化使用次数
    initUsageCount();
    
    // 初始化秘密按钮功能
    initSecretButton();
    
    // 支持回车键检测
    document.getElementById('partNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            check();
        }
    });
    
    // 添加右键菜单重置使用次数（开发者功能）
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        resetMyCount();
    });
});