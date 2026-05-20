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
    resetBtn: document.getElementById('resetBtn'),
    finalNominal: document.getElementById('finalNominal'),
    nominalGrowth: document.getElementById('nominalGrowth'),
    nominalBar: document.getElementById('nominalBar'),
    finalReal: document.getElementById('finalReal'),
    realGrowth: document.getElementById('realGrowth'),
    realBar: document.getElementById('realBar'),
    totalInvested: document.getElementById('totalInvested'),
    avgMonthly: document.getElementById('avgMonthly'),
    totalProfit: document.getElementById('totalProfit'),
    totalReturn: document.getElementById('totalReturn'),
    profitBar: document.getElementById('profitBar'),
    tableBody: document.getElementById('tableBody'),
    initialAmountFormatted: document.getElementById('initialAmountFormatted'),
    monthlyContributionFormatted: document.getElementById('monthlyContributionFormatted'),
    periodDisplay: document.getElementById('periodDisplay')
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
 * 월 상세 대출 상환금 계산 (원리금 균등 상환)
 */
function calculateMonthlyPayment(principal, annualRate, years) {
    if (annualRate === 0) return principal / (years * 12);

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
}

/**
 * 주택 가격 상승률 역산 (목표 가격 기반)
 */
function calculateAppreciationRate(initialPrice, targetPrice, years) {
    if (initialPrice <= 0 || targetPrice <= 0 || years <= 0) return 0;
    return (Math.pow(targetPrice / initialPrice, 1 / years) - 1) * 100;
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
                    label: function (context) {
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
                    callback: function (value) {
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
        <tr class="hover:bg-white/5 transition-colors">
            <td class="p-3 text-center text-gray-400">${d.year}년차</td>
            <td class="p-3 text-right text-gray-300">${formatShortCurrency(d.monthlyContribution)}</td>
            <td class="p-3 text-right text-gray-300">${formatShortCurrency(d.totalInvested)}</td>
            <td class="p-3 text-right font-medium" style="color: #10b981;">${formatShortCurrency(d.nominalBalance)}</td>
            <td class="p-3 text-right font-medium" style="color: #f59e0b;">${formatShortCurrency(d.realBalance)}</td>
            <td class="p-3 text-right font-medium" style="color: ${d.returnRate >= 0 ? '#ec4899' : '#ef4444'};">
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
    const initialParams = getInputValues();
    const periodYears = initialParams.investmentPeriod;

    // 1. 최종 명목 자산
    elements.finalNominal.textContent = formatShortCurrency(finalData.nominalBalance);
    // 2. 최종 실질 자산
    elements.finalReal.textContent = formatShortCurrency(finalData.realBalance);
    // 3. 총 투자 원금
    elements.totalInvested.textContent = formatShortCurrency(finalData.totalInvested);
    // 4. 총 수익률
    elements.totalReturn.textContent = formatPercent(finalData.returnRate);

    // 명목 자산 성장률 vs 원금
    const nominalGrowthRate = finalData.totalInvested > 0 ? ((finalData.nominalBalance - finalData.totalInvested) / finalData.totalInvested) * 100 : 0;
    elements.nominalGrowth.textContent = formatPercent(nominalGrowthRate);

    // 실질 자산 성장률 vs 원금
    const realGrowthRate = finalData.totalInvested > 0 ? ((finalData.realBalance - finalData.totalInvested) / finalData.totalInvested) * 100 : 0;
    elements.realGrowth.textContent = formatPercent(realGrowthRate);

    // 총 수익금
    const totalProfitVal = finalData.nominalBalance - finalData.totalInvested;
    elements.totalProfit.textContent = formatShortCurrency(totalProfitVal);

    // 월평균 투자금
    const totalMonths = periodYears * 12;
    const avgMonthlyVal = totalMonths > 0 ? finalData.totalInvested / totalMonths : 0;
    elements.avgMonthly.textContent = formatShortCurrency(avgMonthlyVal);

    // 프로그레스 바 width
    elements.nominalBar.style.width = '100%';
    
    const realRatio = finalData.nominalBalance > 0 ? (finalData.realBalance / finalData.nominalBalance) * 100 : 0;
    elements.realBar.style.width = `${Math.max(0, Math.min(100, realRatio))}%`;

    const profitRatio = finalData.nominalBalance > 0 ? ((finalData.nominalBalance - finalData.totalInvested) / finalData.nominalBalance) * 100 : 0;
    elements.profitBar.style.width = `${Math.max(0, Math.min(100, profitRatio))}%`;
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
 * 입력 폼 리셋
 */
function resetForm() {
    elements.initialAmount.value = 10000000;
    elements.monthlyContribution.value = 500000;
    elements.contributionGrowth.value = 3;
    elements.annualReturn.value = 7;
    elements.inflationRate.value = 3;
    elements.investmentPeriod.value = 20;

    elements.periodDisplay.innerHTML = `20<span class="text-sm font-normal text-gray-400 ml-1">년</span>`;
    updateFormattedValues();
    runCalculation();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 계산 버튼 클릭
    elements.calculateBtn.addEventListener('click', runCalculation);

    // 초기화 버튼 클릭
    elements.resetBtn.addEventListener('click', resetForm);

    // 금액 입력 필드 실시간 포맷 업데이트
    elements.initialAmount.addEventListener('input', updateFormattedValues);
    elements.monthlyContribution.addEventListener('input', updateFormattedValues);

    // 투자 기간 슬라이더 실시간 업데이트
    elements.investmentPeriod.addEventListener('input', () => {
        elements.periodDisplay.innerHTML = `${elements.investmentPeriod.value}<span class="text-sm font-normal text-gray-400 ml-1">년</span>`;
    });

    // Enter 키로 계산
    document.querySelectorAll('#stock-section input').forEach(input => {
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

// ==========================================
// 부동산 vs 주식 비교 로직 (Real Estate Logic)
// ==========================================

// 부동산 전용 요소 참조
const reElements = {
    // Navigation
    navStock: document.getElementById('nav-stock'),
    navRealEstate: document.getElementById('nav-real-estate'),
    stockSection: document.getElementById('stock-section'),
    realEstateSection: document.getElementById('real-estate-section'),

    // Inputs
    housePrice: document.getElementById('housePrice'),
    housePriceFormatted: document.getElementById('housePriceFormatted'),
    loanAmount: document.getElementById('loanAmount'),
    loanAmountFormatted: document.getElementById('loanAmountFormatted'),
    ltvDisplay: document.getElementById('ltvDisplay'),
    loanRate: document.getElementById('loanRate'),
    loanPeriod: document.getElementById('loanPeriod'),

    // Appreciation Rate Dual Input
    tabRate: document.getElementById('tab-rate'),
    tabTarget: document.getElementById('tab-target'),
    inputRateGroup: document.getElementById('input-rate-group'),
    inputTargetGroup: document.getElementById('input-target-group'),
    appreciationRate: document.getElementById('appreciationRate'),
    targetPrice: document.getElementById('targetPrice'),
    calculatedTargetPrice: document.getElementById('calculatedTargetPrice'),
    calculatedAnnualRate: document.getElementById('calculatedAnnualRate'),

    // Comparison Target Input
    compStockReturn: document.getElementById('compStockReturn'),

    // Auto-calculated Readonly
    requiredDownPayment: document.getElementById('requiredDownPayment'),
    monthlyMortgage: document.getElementById('monthlyMortgage'),

    // Action
    calcRealEstateBtn: document.getElementById('calcRealEstateBtn'),

    // Results
    reNetWorth: document.getElementById('reNetWorth'),
    compStockBalance: document.getElementById('compStockBalance'),
    wealthDiff: document.getElementById('wealthDiff'),
    winnerLabel: document.getElementById('winnerLabel'),
    finalHousePrice: document.getElementById('finalHousePrice'),
    finalLoan: document.getElementById('finalLoan'),
    houseBar: document.getElementById('houseBar'),

    // Charts & Tables
    compTableBody: document.getElementById('compTableBody')
};

// State
let currentMode = 'stock'; // 'stock' or 'real-estate'
let comparisonChart = null;

// ===== Real Estate Functions =====

/**
 * 부동산 입력값 포맷팅 및 자동 계산 (대출금, 초기자본)
 */
function updateFormattedREValues() {
    reElements.housePriceFormatted.textContent = formatShortCurrency(parseFloat(reElements.housePrice.value) || 0);

    // Inputs
    const housePrice = parseFloat(reElements.housePrice.value) || 0;
    const loanAmount = parseFloat(reElements.loanAmount.value) || 0;

    // Auto Calculation (LTV & Down Payment)
    let ltv = 0;
    if (housePrice > 0) ltv = (loanAmount / housePrice) * 100;

    reElements.ltvDisplay.textContent = `LTV: ${ltv.toFixed(1)}%`;
    reElements.loanAmountFormatted.textContent = formatShortCurrency(loanAmount);

    const downPayment = housePrice - loanAmount;

    // Mortgage Payment
    const rate = parseFloat(reElements.loanRate.value) || 0;
    const period = parseFloat(reElements.loanPeriod.value) || 0;

    const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, period);

    reElements.requiredDownPayment.textContent = formatShortCurrency(downPayment);
    reElements.monthlyMortgage.textContent = formatShortCurrency(monthlyPayment);

    // 듀얼 인풋 업데이트 동적 연동
    const isRateTab = !reElements.inputRateGroup.classList.contains('hidden');
    handleDualInput(isRateTab ? 'rate' : 'target');
}

/**
 * 상승률 <-> 목표가격 양방향 변환 핸들러
 */
function handleDualInput(type) {
    const housePrice = parseFloat(reElements.housePrice.value) || 0;
    const period = parseFloat(reElements.loanPeriod.value) || 0;

    if (type === 'rate') {
        // Rate -> Target Price
        const rate = parseFloat(reElements.appreciationRate.value) || 0;
        const target = housePrice * Math.pow(1 + rate / 100, period);
        reElements.calculatedTargetPrice.innerHTML = `${period}년 후 예상: <span class="text-white font-mono">${formatShortCurrency(target)}</span>`;
    } else {
        // Target Price -> Rate
        const target = parseFloat(reElements.targetPrice.value) || 0;
        if (housePrice > 0 && period > 0) {
            let rate = (Math.pow(target / housePrice, 1 / period) - 1) * 100;
            if (!isFinite(rate)) rate = 0;
            const rateSpan = reElements.calculatedAnnualRate.querySelector('span');
            if (rateSpan) rateSpan.textContent = `${rate.toFixed(2)}%`;
            // Update hidden rate input for calculation
            reElements.appreciationRate.value = rate.toFixed(2);
        }
    }
}

/**
 * 상승률 입력 탭 전환
 */
function switchAppreciationTab(mode) {
    if (mode === 'rate') {
        reElements.tabRate.classList.add('text-primary', 'border-b-2', 'border-primary');
        reElements.tabRate.classList.remove('text-gray-500');
        reElements.tabTarget.classList.remove('text-primary', 'border-b-2', 'border-primary');
        reElements.tabTarget.classList.add('text-gray-500');

        reElements.inputRateGroup.classList.remove('hidden');
        reElements.inputTargetGroup.classList.add('hidden');
        handleDualInput('rate');
    } else {
        reElements.tabTarget.classList.add('text-primary', 'border-b-2', 'border-primary');
        reElements.tabTarget.classList.remove('text-gray-500');
        reElements.tabRate.classList.remove('text-primary', 'border-b-2', 'border-primary');
        reElements.tabRate.classList.add('text-gray-500');

        reElements.inputTargetGroup.classList.remove('hidden');
        reElements.inputRateGroup.classList.add('hidden');

        // Initialize target price based on current rate if needed
        const housePrice = parseFloat(reElements.housePrice.value) || 0;
        const rate = parseFloat(reElements.appreciationRate.value) || 0;
        const period = parseFloat(reElements.loanPeriod.value) || 0;
        const target = housePrice * Math.pow(1 + rate / 100, period);
        reElements.targetPrice.value = Math.round(target);
        handleDualInput('target');
    }
}

/**
 * 부동산 vs 주식 시나리오 계산
 */
function calculateRealEstateScenario() {
    // Inputs
    const housePrice = parseFloat(reElements.housePrice.value) || 0;
    const loanAmount = parseFloat(reElements.loanAmount.value) || 0;
    const loanRate = parseFloat(reElements.loanRate.value) || 0;
    const loanPeriod = parseFloat(reElements.loanPeriod.value) || 0;
    const appreciationRate = parseFloat(reElements.appreciationRate.value) || 0;

    // Derived Values
    const loanPrincipal = loanAmount;
    const downPayment = housePrice - loanPrincipal;
    const monthlyRate = loanRate / 100 / 12;
    const months = loanPeriod * 12;
    const monthlyPayment = calculateMonthlyPayment(loanPrincipal, loanRate, loanPeriod);

    // Simulation Data
    const yearlyData = [];
    let currentLoanBalance = loanPrincipal;
    let currentHouseValue = housePrice;

    // Stock Comparison (Fair Comparison: Same Cash Flow)
    // Initial Capital = Down Payment
    // Monthly Contribution = Monthly Mortgage Payment
    const stockReturn = parseFloat(reElements.compStockReturn.value) || 7;
    const stockMonthlyRate = Math.pow(1 + stockReturn / 100, 1 / 12) - 1;

    let stockBalance = downPayment;
    let totalInvested = downPayment;

    yearlyData.push({
        year: 0,
        houseValue: housePrice,
        loanBalance: loanPrincipal,
        reNetWorth: downPayment,
        stockBalance: downPayment,
        invested: downPayment
    });

    for (let year = 1; year <= loanPeriod; year++) {
        // 1. Real Estate Update
        // Appreciation
        currentHouseValue = currentHouseValue * (1 + appreciationRate / 100);

        // Loan Amortization (12 months)
        for (let m = 0; m < 12; m++) {
            if (currentLoanBalance > 0) {
                const interest = currentLoanBalance * monthlyRate;
                const principal = monthlyPayment - interest;
                currentLoanBalance -= principal;
                if (currentLoanBalance < 0) currentLoanBalance = 0;
            }
        }

        // 2. Stock Update (Compounding + Monthly Contribution)
        for (let m = 0; m < 12; m++) {
            stockBalance = stockBalance * (1 + stockMonthlyRate);
            stockBalance += monthlyPayment;
            totalInvested += monthlyPayment;
        }

        yearlyData.push({
            year: year,
            houseValue: currentHouseValue,
            loanBalance: currentLoanBalance,
            reNetWorth: currentHouseValue - currentLoanBalance,
            stockBalance: stockBalance,
            invested: totalInvested
        });
    }

    return yearlyData;
}

/**
 * 비교 차트 업데이트
 */
function updateComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const labels = data.map(d => `${d.year}년`);

    const reNetWorthData = data.map(d => d.reNetWorth);
    const stockBalanceData = data.map(d => d.stockBalance);
    const houseValueData = data.map(d => d.houseValue);

    const chartData = {
        labels,
        datasets: [
            {
                label: '부동산 순자산',
                data: reNetWorthData,
                borderColor: '#00c753',
                backgroundColor: 'rgba(0, 199, 83, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: '주식 자산',
                data: stockBalanceData,
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: '주택 가치',
                data: houseValueData,
                borderColor: '#ff9800',
                borderDash: [5, 5],
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                hidden: true
            }
        ]
    };

    const options = {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(21, 26, 30, 0.95)', titleColor: '#fff', bodyColor: '#a0a0a0',
                borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12,
                callbacks: { label: ctx => `${ctx.dataset.label}: ${formatShortCurrency(ctx.raw)}` }
            }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6a6a7a' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6a6a7a', callback: v => v >= 1e8 ? (v / 1e8).toFixed(1) + '억' : v >= 1e4 ? (v / 1e4).toFixed(0) + '만' : v } }
        }
    };

    if (comparisonChart) {
        comparisonChart.data = chartData;
        comparisonChart.options = options;
        comparisonChart.update();
    } else {
        comparisonChart = new Chart(ctx, { type: 'line', data: chartData, options });
    }
}

/**
 * 비교 결과(카드, 테이블) 업데이트
 */
function updateComparisonResults(data) {
    const final = data[data.length - 1];

    // Summary Cards
    reElements.reNetWorth.textContent = formatShortCurrency(final.reNetWorth);
    reElements.compStockBalance.textContent = formatShortCurrency(final.stockBalance);

    const diff = final.reNetWorth - final.stockBalance;
    const absDiff = Math.abs(diff);
    reElements.wealthDiff.textContent = (diff >= 0 ? '+ ' : '- ') + formatShortCurrency(absDiff);

    if (diff >= 0) {
        reElements.winnerLabel.textContent = "부동산 우세";
        reElements.winnerLabel.className = "text-xs font-medium text-accent-green";
        reElements.wealthDiff.classList.remove("text-accent-blue");
        reElements.wealthDiff.classList.add("text-accent-green");
    } else {
        reElements.winnerLabel.textContent = "주식 투자 우세";
        reElements.winnerLabel.className = "text-xs font-medium text-accent-blue";
        reElements.wealthDiff.classList.remove("text-accent-green");
        reElements.wealthDiff.classList.add("text-accent-blue");
    }

    reElements.finalHousePrice.textContent = formatShortCurrency(final.houseValue);
    reElements.finalLoan.textContent = formatShortCurrency(final.loanBalance);

    // House Bar
    const equityPercent = ((final.houseValue - final.loanBalance) / final.houseValue) * 100;
    reElements.houseBar.style.width = `${Math.max(0, equityPercent)}%`;

    // Table
    const lastYear = data[data.length - 1].year;
    const tableData = data.filter(d => d.year > 0 && (d.year % 5 === 0 || d.year === lastYear));

    reElements.compTableBody.innerHTML = tableData.map((d, i) => {
        const diffVal = d.reNetWorth - d.stockBalance;
        const diffClass = diffVal >= 0 ? 'text-accent-green' : 'text-accent-blue';
        const sign = diffVal >= 0 ? '+' : '-';
        return `
        <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
            <td class="p-3 text-center text-gray-400">${d.year}년</td>
            <td class="p-3 text-right font-medium text-accent-green">${formatShortCurrency(d.reNetWorth)}</td>
            <td class="p-3 text-right font-medium text-accent-blue">${formatShortCurrency(d.stockBalance)}</td>
            <td class="p-3 text-right ${diffClass}">${sign} ${formatShortCurrency(Math.abs(diffVal))}</td>
            <td class="p-3 text-right text-gray-500">${formatShortCurrency(d.houseValue)}</td>
        </tr>
        `;
    }).join('');
}

function runRealEstateCalculation() {
    const data = calculateRealEstateScenario();
    updateComparisonChart(data);
    updateComparisonResults(data);
}

/**
 * 모드 전환 처리
 */
function switchMode(mode) {
    currentMode = mode;
    if (mode === 'stock') {
        reElements.navStock.classList.add('active', 'text-white');
        reElements.navStock.classList.remove('text-gray-400');
        reElements.navRealEstate.classList.remove('active', 'text-white');
        reElements.navRealEstate.classList.add('text-gray-400');

        reElements.stockSection.classList.remove('hidden', 'opacity-0');
        reElements.realEstateSection.classList.add('hidden', 'opacity-0');

        // Resize stock chart to fit
        setTimeout(() => { if (growthChart) growthChart.resize(); }, 100);
    } else {
        reElements.navRealEstate.classList.add('active', 'text-white');
        reElements.navRealEstate.classList.remove('text-gray-400');
        reElements.navStock.classList.remove('active', 'text-white');
        reElements.navStock.classList.add('text-gray-400');

        reElements.realEstateSection.classList.remove('hidden', 'opacity-0');
        reElements.stockSection.classList.add('hidden', 'opacity-0');

        // Trigger calculation and chart resize
        updateFormattedREValues();
        runRealEstateCalculation();
        setTimeout(() => { if (comparisonChart) comparisonChart.resize(); }, 100);
    }
}

/**
 * 부동산 이벤트 리스너 설정
 */
function setupRealEstateEventListeners() {
    // Navigation
    reElements.navStock.addEventListener('click', () => switchMode('stock'));
    reElements.navRealEstate.addEventListener('click', () => switchMode('real-estate'));

    // Inputs
    ['housePrice', 'loanAmount', 'loanRate', 'loanPeriod', 'compStockReturn'].forEach(id => {
        const el = reElements[id];
        if (el) el.addEventListener('input', updateFormattedREValues);
    });

    // Appreciation Rate Dual Input
    reElements.appreciationRate.addEventListener('input', () => handleDualInput('rate'));
    reElements.targetPrice.addEventListener('input', () => handleDualInput('target'));

    reElements.tabRate.addEventListener('click', () => switchAppreciationTab('rate'));
    reElements.tabTarget.addEventListener('click', () => switchAppreciationTab('target'));

    // Action
    reElements.calcRealEstateBtn.addEventListener('click', runRealEstateCalculation);

    // Enter key (Delegation for new section)
    reElements.realEstateSection.addEventListener('keypress', (e) => {
        if (e.target.tagName === 'INPUT' && e.key === 'Enter') {
            runRealEstateCalculation();
        }
    });
}

// DOM 로드 완료 후 초기화 (통합)
document.addEventListener('DOMContentLoaded', () => {
    init(); // 기존 주식 초기화
    setupRealEstateEventListeners();
    updateFormattedREValues();
    handleDualInput('rate');
});
