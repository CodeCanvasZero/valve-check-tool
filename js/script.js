// 使用次数记录功能
let usageCount = 0;

// 初始化使用次数
function initUsageCount() {
    const savedCount = localStorage.getItem('valveCheckUsageCount');
    if (savedCount) {
        usageCount = parseInt(savedCount);
    }
    updateUsageDisplay();
}

// 更新使用次数显示
function updateUsageDisplay() {
    const usageElement = document.getElementById('usageCount');
    if (usageElement) {
        usageElement.textContent = usageCount;
    }
}

// 增加使用次数
function incrementUsageCount() {
    usageCount++;
    localStorage.setItem('valveCheckUsageCount', usageCount.toString());
    updateUsageDisplay();
}

// 重置使用次数（可选功能）
function resetUsageCount() {
    if (confirm('确定要重置使用次数吗？')) {
        usageCount = 0;
        localStorage.setItem('valveCheckUsageCount', '0');
        updateUsageDisplay();
        alert('使用次数已重置为0');
    }
}

// 记录全局使用次数
function recordGlobalUsage() {
    // 使用免费的计数API
    fetch('https://api.countapi.xyz/hit/valve-check-tool/usage')
        .then(response => response.json())
        .then(data => {
            console.log('总使用次数:', data.value);
        })
        .catch(err => {
            console.log('计数服务暂时不可用');
        });
}

// 获取总使用次数（用于显示）
function getGlobalUsage() {
    fetch('https://api.countapi.xyz/get/valve-check-tool/usage')
        .then(response => response.json())
        .then(data => {
            console.log('当前总使用次数:', data.value);
            // 可以在这里更新页面显示
        })
        .catch(err => {
            console.log('无法获取总使用次数');
        });
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
    
    // 增加本地使用次数
    incrementUsageCount();
    
    // 记录到全局计数器
    recordGlobalUsage();
    
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
    
    // 支持回车键检测
    document.getElementById('partNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            check();
        }
    });
    
    // 添加右键菜单重置使用次数（开发者功能）
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        resetUsageCount();
    });
});