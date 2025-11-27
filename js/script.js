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
        alert('总次数已刷新！');
    }, 1000);
}

// 秘密按钮功能
function initSecretButton() {
    let clickCount = 0;
    const secretBtn = document.getElementById('secretStatsBtn');
    
    if (secretBtn) {
        secretBtn.addEventListener('click', function() {
            clickCount++;
            
            if (clickCount >= 5) {
                clickCount = 0;
                alert('🎉 恭喜你发现了隐藏功能！\n总使用次数会自动保存，你可以随时查看。');
            } else {
                alert(`继续点击！还差 ${5 - clickCount} 次`);
            }
        });
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
});