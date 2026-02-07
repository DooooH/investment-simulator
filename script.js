/**
 * 투자 시뮬레이터 - 복리 수익 계산기
 * 인플레이션을 고려한 장기 투자 수익 시뮬레이션
 */

// DOM 요소 참조
const elements = {
    initialAmount: document.getElementById('initialAmount'),
    monthlyContribution: document.getElementById('monthlyContribution'),
    contributionGrowth: document.getElementById('contributionGrowth'),
    annualReturn: document.getElementById('annualReturn'),
    inflationRate: document.getElementById('inflationRate'),
    investmentPeriod: document.getElementById('investmentPeriod'),
    calculateBtn: document.getElementById('calculateBtn'),
    finalNominal: document.getElementById('finalNominal'),
    finalReal: document.getElementById('finalReal'),
    totalInvested: document.getElementById('totalInvested'),
    totalReturn: document.getElementById('totalReturn'),
    tableBody: document.getElementById('tableBody'),
    initialAmountFormatted: document.getElementById('initialAmountFormatted'),
    monthlyContributionFormatted: document.getElementById('monthlyContributionFormatted')
};

// 차트 인스턴스
let growthChart = null;

/**
 * 숫자를 한국 원화 형식으로 포맷
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * 숫자를 간략한 형식으로 포맷 (억, 만 단위)
 */
function formatShortCurrency(amount) {
    if (amount >= 100000000) {
        const billions = Math.floor(amount / 100000000);
        const millions = Math.floor((amount % 100000000) / 10000);
        if (millions > 0) {
            return `${billions}억 ${millions.toLocaleString()}만원`;
        }
        return `${billions}억원`;
    } else if (amount >= 10000) {
        return `${Math.floor(amount / 10000).toLocaleString()}만원`;
    }
    return `${amount.toLocaleString()}원`;
}

/**
 * 퍼센트 포맷
 */
function formatPercent(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * 입력값 유효성 검사 및 가져오기
 */
function getInputValues() {
    return {
        initialAmount: parseFloat(elements.initialAmount.value) || 0,
        monthlyContribution: parseFloat(elements.monthlyContribution.value) || 0,
        contributionGrowth: parseFloat(elements.contributionGrowth.value) || 0,
        annualReturn: parseFloat(elements.annualReturn.value) || 0,
        inflationRate: parseFloat(elements.inflationRate.value) || 0,
        investmentPeriod: parseInt(elements.investmentPeriod.value) || 1
    };
}

/**
 * 투자 시뮬레이션 계산
 */
function calculateInvestment(params) {
    const {
        initialAmount,
        monthlyContribution,
        contributionGrowth,
        annualReturn,
        inflationRate,
        investmentPeriod
    } = params;

    const monthlyReturnRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
    const yearlyData = [];
    
    let balance = initialAmount;
    let totalInvested = initialAmount;
    let currentMonthlyContribution = monthlyContribution;

    // 0년차 (시작점) 데이터
    yearlyData.push({
        year: 0,
        monthlyContribution: currentMonthlyContribution,
        yearlyContribution: 0,
        totalInvested: initialAmount,
        nominalBalance: initialAmount,
        realBalance: initialAmount,
        returnRate: 0
    });

    // 각 연도별 계산
    for (let year = 1; year <= investmentPeriod; year++) {
        let yearlyContribution = 0;

        // 월별 복리 계산
        for (let month = 1; month <= 12; month++) {
            // 월 수익 적용
            balance = balance * (1 + monthlyReturnRate);
            // 월 적립금 추가
            balance += currentMonthlyContribution;
            yearlyContribution += currentMonthlyContribution;
            totalInvested += currentMonthlyContribution;
        }

        // 실질 가치 계산 (인플레이션 반영)
        const inflationFactor = Math.pow(1 + inflationRate / 100, year);
        const realBalance = balance / inflationFactor;

        // 수익률 계산
        const returnRate = ((balance - totalInvested) / totalInvested) * 100;

        yearlyData.push({
            year,
            monthlyContribution: currentMonthlyContribution,
            yearlyContribution,
            totalInvested,
            nominalBalance: balance,
            realBalance,
            returnRate
        });

        // 다음 해 월 투자금 증가 적용
        currentMonthlyContribution = currentMonthlyContribution * (1 + contributionGrowth / 100);
    }

    return yearlyData;
}

/**
 * 차트 생성 또는 업데이트
 */
function updateChart(data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    const labels = data.map(d => `${d.year}년`);
    const nominalData = data.map(d => d.nominalBalance);
    const realData = data.map(d => d.realBalance);
    const investedData = data.map(d => d.totalInvested);

    const chartData = {
        labels,
        datasets: [
            {
                label: '명목 자산',
                data: nominalData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: '실질 자산',
                data: realData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: '누적 원금',
                data: investedData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(22, 33, 62, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#a0a0b0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${formatShortCurrency(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#6a6a7a'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#6a6a7a',
                    callback: function(value) {
                        if (value >= 100000000) {
                            return (value / 100000000).toFixed(1) + '억';
                        } else if (value >= 10000) {
                            return (value / 10000).toFixed(0) + '만';
                        }
                        return value;
                    }
                }
            }
        }
    };

    if (growthChart) {
        growthChart.data = chartData;
        growthChart.options = options;
        growthChart.update();
    } else {
        growthChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options
        });
    }
}

/**
 * 테이블 업데이트
 */
function updateTable(data) {
    // 0년차 제외하고 표시
    const tableData = data.slice(1);
    
    elements.tableBody.innerHTML = tableData.map(d => `
        <tr>
            <td>${d.year}년차</td>
            <td>${formatShortCurrency(d.monthlyContribution)}</td>
            <td>${formatShortCurrency(d.yearlyContribution)}</td>
            <td>${formatShortCurrency(d.totalInvested)}</td>
            <td style="color: #10b981;">${formatShortCurrency(d.nominalBalance)}</td>
            <td style="color: #f59e0b;">${formatShortCurrency(d.realBalance)}</td>
            <td style="color: ${d.returnRate >= 0 ? '#ec4899' : '#ef4444'};">
                ${formatPercent(d.returnRate)}
            </td>
        </tr>
    `).join('');
}

/**
 * 결과 요약 카드 업데이트
 */
function updateSummaryCards(data) {
    const finalData = data[data.length - 1];
    
    elements.finalNominal.textContent = formatShortCurrency(finalData.nominalBalance);
    elements.finalReal.textContent = formatShortCurrency(finalData.realBalance);
    elements.totalInvested.textContent = formatShortCurrency(finalData.totalInvested);
    elements.totalReturn.textContent = formatPercent(finalData.returnRate);
}

/**
 * 포맷된 값 실시간 업데이트
 */
function updateFormattedValues() {
    const initial = parseFloat(elements.initialAmount.value) || 0;
    const monthly = parseFloat(elements.monthlyContribution.value) || 0;
    
    elements.initialAmountFormatted.textContent = formatShortCurrency(initial);
    elements.monthlyContributionFormatted.textContent = formatShortCurrency(monthly);
}

/**
 * 계산 실행
 */
function runCalculation() {
    const params = getInputValues();
    const data = calculateInvestment(params);
    
    updateSummaryCards(data);
    updateChart(data);
    updateTable(data);
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 계산 버튼 클릭
    elements.calculateBtn.addEventListener('click', runCalculation);

    // 금액 입력 필드 실시간 포맷 업데이트
    elements.initialAmount.addEventListener('input', updateFormattedValues);
    elements.monthlyContribution.addEventListener('input', updateFormattedValues);

    // Enter 키로 계산
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runCalculation();
            }
        });
    });
}

/**
 * 초기화
 */
function init() {
    setupEventListeners();
    updateFormattedValues();
    runCalculation();
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', init);
