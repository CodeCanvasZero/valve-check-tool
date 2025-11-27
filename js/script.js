// 初始化使用次数
function initUsageCount() {
    // 从本地存储读取个人使用次数
    const savedLocal = localStorage.getItem('valveCheckLocalUsage') || '0';
    document.getElementById('localCount').textContent = savedLocal;
}

// 增加使用次数
function incrementUsageCount() {
    // 增加个人使用次数
    let localCount = parseInt(localStorage.getItem('valveCheckLocalUsage') || '0');
    localCount++;
    localStorage.setItem('valveCheckLocalUsage', localCount.toString());
    document.getElementById('localCount').textContent = localCount;
}

// 刷新总次数
function refreshTotalCount() {
    const btn = document.getElementById('refreshBtn');
    const originalText = btn.textContent;
    
    btn.textContent = '刷新中...';
    btn.disabled = true;
    
    // 强制刷新busuanzi统计
    if (typeof busuanzi !== 'undefined') {
        busuanzi.fetch();
    }
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        showTempMessage('总次数已刷新', 'warning'); // 改为warning，显示黄色
    }, 1000);
}

// 显示临时消息（恢复原来的黄色）
function showTempMessage(message, type = 'warning') {
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
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
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

// 查看 GitHub 统计（原来的功能）
function viewGitHubStats() {
    window.open(`https://github.com/CodeCanvasZero/valve-check-tool/issues/1`, '_blank');
}

// 秘密按钮点击计数（恢复原来的功能）
let secretClickCount = 0;
let secretClickTimer = null;

// 初始化秘密按钮功能
function initSecretButton() {
    const secretBtn = document.getElementById('secretStatsBtn');
    if (secretBtn) {
        secretBtn.addEventListener('click', handleSecretClick);
    }
}

// 处理秘密按钮点击（恢复原来的功能）
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
        showTempMessage('🎉 恭喜你发现了隐藏功能！', 'warning'); // 改为warning，显示黄色
    }
}

// 显示秘密点击反馈（恢复原来的功能）
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
            showTempMessage(`已点击 ${secretClickCount} 次，继续努力！`, 'warning'); // 改为warning，显示黄色
        }
    }
}

/**
 * 阀体产品检测函数（保持你原来的逻辑不变）
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
        if (confirm('确定要重置你的使用次数吗？总次数不会重置。')) {
            localStorage.setItem('valveCheckLocalUsage', '0');
            document.getElementById('localCount').textContent = '0';
            showTempMessage('你的使用次数已重置为 0', 'warning'); // 改为warning，显示黄色
        }
    });
});