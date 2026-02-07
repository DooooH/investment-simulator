# 투자 시뮬레이터 개발 기록
> 마지막 업데이트: 2026-02-07

## 프로젝트 개요
Webull 스타일의 투자 시뮬레이터 웹 애플리케이션 개발

## 구현 완료 기능
- 초기 투자금 / 월 추가 투자금 입력
- 월 투자금 연간 증가율 설정
- 연 수익률 / 인플레이션율 설정
- 투자 기간 슬라이더 (1~50년)
- 명목 자산 vs 실질 자산 비교 그래프 (Chart.js)
- 연도별 상세 내역 테이블
- Webull 스타일 다크 테마 UI (Stitch MCP 활용)

## 기술 스택
- HTML / CSS (TailwindCSS)
- JavaScript (바닐라)
- Chart.js (그래프)
- Material Symbols (아이콘)

## 다음 단계 (계획됨)
**부동산 vs 주식 비교 기능** 추가 예정:
- 주택 담보 대출 시뮬레이션 (원리금 균등 상환)
- 주택 가격 상승률 반영
- 순자산(Net Worth) 기준 비교 그래프

## 파일 구조
```
investment-simulator/
├── index.html   # 메인 HTML (스타일 포함)
├── script.js    # 계산 로직
├── styles.css   # 추가 스타일
└── DEVLOG.md    # 이 파일
```
