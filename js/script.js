// GitHub Issues 计数配置
// ⚠️ 重要：请根据你的实际情况修改下面的配置
const GITHUB_OWNER = 'CodeCanvasZero';    // 你的 GitHub 用户名
const GITHUB_REPO = 'valve-check-tool';   // 你的仓库名
const ISSUE_NUMBER = 1;                   // 统计 Issue 的编号

// 使用次数记录功能
let localUsageCount = 0;    // 当前用户的使用次数
let totalUsageCount = 0;    // 所有用户的总使用次数

// 初始化使用次数
function initUsageCount() {
    // 当前用户的使用次数
    const savedLocal = localStorage.getItem('valveCheckLocalUsage');
    if (savedLocal) {
        localUsageCount = parseInt(savedLocal);
    }
    
    // 总使用次数（从本地存储作为缓存）
    const savedTotal = localStorage.getItem('valveCheckTotalUsage');
    if (savedTotal) {
        totalUsageCount = parseInt(savedTotal);
    }
    
    updateUsageDisplay();
    
    // 页面加载时从 GitHub 获取最新总次数
    getGitHubUsageCount();
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
    // 使用 setTimeout 避免阻塞用户操作
    setTimeout(() => {
        fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('GitHub API 请求失败');
                }
                return response.json();
            })
            .then(issue => {
                const body = issue.body;
                // 从内容中提取当前计数
                const countMatch = body.match(/当前使用次数：(\d+)/);
                let currentCount = countMatch ? parseInt(countMatch[1]) : 0;
                currentCount++;
                
                // 更新 Issue 内容
                const newBody = body.replace(
                    /当前使用次数：\d+/,
                    `当前使用次数：${currentCount}`
                );
                
                // 添加使用记录
                const timestamp = new Date().toLocaleString('zh-CN');
                const updatedBody = newBody + `\n\n---\n✅ 使用记录：${timestamp}`;
                
                // 更新 Issue
                return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        body: updatedBody
                    })
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('更新 Issue 失败');
                }
                return response.json();
            })
            .then(updatedIssue => {
                console.log('✅ 使用次数已记录到 GitHub');
                // 更新页面显示
                const countMatch = updatedIssue.body.match(/当前使用次数：(\d+)/);
                if (countMatch) {
                    totalUsageCount = parseInt(countMatch[1]);
                    localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
                    updateUsageDisplay();
                }
            })
            .catch(error => {
                console.log('⚠️ GitHub 记录失败，使用本地计数:', error.message);
                // 失败时使用本地计数
                totalUsageCount++;
                localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
                updateUsageDisplay();
            });
    }, 100);
}

// 从 GitHub Issue 获取最新使用次数
function getGitHubUsageCount() {
    const totalElement = document.getElementById('totalCount');
    if (totalElement) {
        totalElement.textContent = '获取中...';
    }
    
    fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('GitHub API 请求失败');
            }
            return response.json();
        })
        .then(issue => {
            const countMatch = issue.body.match(/当前使用次数：(\d+)/);
            if (countMatch) {
                totalUsageCount = parseInt(countMatch[1]);
                localStorage.setItem('valveCheckTotalUsage', totalUsageCount.toString());
                updateUsageDisplay();
            }
        })
        .catch(error => {
            console.log('无法从 GitHub 获取最新次数:', error.message);
            if (totalElement) {
                totalElement.textContent = '获取失败';
            }
        });
}

// 手动刷新总次数
function refreshTotalCount() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.textContent = '刷新中...';
        refreshBtn.disabled = true;
    }
    
    getGitHubUsageCount();
    
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 刷新总次数';
            refreshBtn.disabled = false;
        }
    }, 2000);
}

// 查看 GitHub 统计
function viewGitHubStats() {
    window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ISSUE_NUMBER}`, '_blank');
}

// 增加使用次数
function incrementUsageCount() {
    localUsageCount++;
    localStorage.setItem('valveCheckLocalUsage', localUsageCount.toString());
    
    // 记录到 GitHub Issue
    recordToGitHub();
    
    updateUsageDisplay();
}

// 重置个人计数
function resetMyCount() {
    if (confirm('确定要重置你的使用次数吗？总次数不会重置。')) {
        localUsageCount = 0;
        localStorage.setItem('valveCheckLocalUsage', '0');
        updateUsageDisplay();
        alert('你的使用次数已重置为 0');
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
    initUsageCount();
    
    document.getElementById('partNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            check();
        }
    });
    
    // 右键点击可重置个人计数
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        resetMyCount();
    });
});