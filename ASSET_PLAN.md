# Mathdle — 에셋 기획서

## 색상 팔레트 (로고 기준)

| 상태 | 색상 | 용도 |
|------|------|------|
| Active / Current | `#eab308` 노랑 | 현재 스텝 노드, 강조 요소 |
| Cleared | `#22c55e` 초록 | 클리어된 스텝 노드 |
| Locked | `#0f1729` 어두운 | 잠긴 스텝 노드 |
| BG | `#080e1c` | 전체 배경 |
| Surface | `#131f35` | 카드/패널 배경 |

---

## 스크린별 에셋 목록

### 1. 공통 (전체 화면)

| 에셋 | 현재 구현 | 교체 파일 경로 | 비고 |
|------|-----------|---------------|------|
| 로고 | 텍스트 `Math**dle**` | `public/assets/logo.png` | 픽셀아트 로고 |
| 앱 아이콘 | - | `public/favicon.ico`, `public/icon.png` | PWA 아이콘 |
| 배경 그라디언트 | CSS gradient | `public/assets/bg-texture.png` | 맵 배경 타일 |

---

### 2. 홈 — 스테이지 맵 (`/`)

#### 맵 노드 (현재: SVG `<rect>`)

| 에셋 | 상태 | 교체 위치 | 크기 |
|------|------|-----------|------|
| `node-normal-locked.png` | 잠김 | `page.tsx` `<rect>` → `<image>` | 48×48px |
| `node-normal-active.png` | 현재 (노랑) | 동일 | 48×48px |
| `node-normal-cleared.png` | 클리어 (초록) | 동일 | 48×48px |
| `node-boss-locked.png` | 보스 잠김 | 동일 | 60×60px |
| `node-boss-active.png` | 보스 현재 (노랑 별) | 동일 | 60×60px |
| `node-boss-cleared.png` | 보스 클리어 (초록 체크) | 동일 | 60×60px |

```tsx
// 교체 예시 (page.tsx의 <rect> 부분)
// Before:
<rect x={x-half} y={y-half} width={half*2} height={half*2} fill={col.fill} />

// After:
<image href={`/assets/nodes/${assetName}.png`} x={x-half} y={y-half} width={half*2} height={half*2} />
```

#### 경로 (현재: SVG 점선)

| 에셋 | 교체 위치 | 비고 |
|------|-----------|------|
| `path-tile.png` | `page.tsx` `<path strokeDasharray>` | 8×8px 반복 타일. `stroke`를 `patternFill`로 교체 |

#### 플레이어 마커 (현재: 픽셀 삼각형 화살표)

| 에셋 | 교체 위치 | 비고 |
|------|-----------|------|
| `player-idle.png` | `page.tsx` `<polygon>` + `<rect>` | 32×48px, 애니메이션 시트 고려 |
| `player-idle.gif` or CSS sprite | 동일 | 도트 캐릭터 bounce 애니메이션 |

#### 배경

| 에셋 | 교체 위치 | 비고 |
|------|-----------|------|
| `map-bg.png` | `page.tsx` `backgroundImage: linear-gradient(...)` | 256×256px 타일링 텍스처 |

---

### 3. 게임 플레이 — 타일 (`/step/[code]/play`)

| 에셋 | 현재 구현 | 교체 위치 | 크기 |
|------|-----------|-----------|------|
| `tile-empty.png` | CSS `.token-tile-empty` | `components/game/TokenTile.tsx` | 48×48px |
| `tile-active.png` | CSS `.token-tile-active` | 동일 | 48×48px |
| `tile-correct.png` | CSS `.token-tile-correct` (초록) | 동일 | 48×48px |
| `tile-present.png` | CSS `.token-tile-present` (노랑) | 동일 | 48×48px |
| `tile-absent.png` | CSS `.token-tile-absent` (회색) | 동일 | 48×48px |

---

### 4. 키패드 (`ScientificKeypad`)

| 에셋 | 현재 구현 | 교체 위치 | 비고 |
|------|-----------|-----------|------|
| `key-default.png` | CSS `bg-key-default` | `components/game/KeypadButton.tsx` | 픽셀 버튼 스프라이트 |
| `key-pressed.png` | CSS `:active scale(0.93)` | 동일 | pressed state |
| `key-correct.png` | CSS `bg-key-correct` | 동일 | 초록 |
| `key-present.png` | CSS `bg-key-present` | 동일 | 노랑 |
| `key-absent.png` | CSS `bg-key-absent` | 동일 | 회색 |

---

### 5. 결과 모달 (`StepResultModal`)

| 에셋 | 교체 위치 | 비고 |
|------|-----------|------|
| `result-win-bg.png` | 모달 배경 | 파티클/폭죽 픽셀 이펙트 |
| `result-lose-bg.png` | 모달 배경 | |
| `icon-crown.png` | 보스 클리어 이모지 `👑` 교체 | 32×32px 픽셀 왕관 |
| `icon-star.png` | 클리어 이모지 `🎉` 교체 | 32×32px |

---

### 6. 하단 네비게이션 (`BottomNav`)

| 에셋 | 교체 위치 | 비고 |
|------|-----------|------|
| `icon-map-inactive.png` | Map 탭 아이콘 | 16×16px 픽셀 |
| `icon-map-active.png` | Map 탭 활성 | 16×16px 노랑 |
| `icon-ranking-inactive.png` | Ranking 탭 아이콘 | 16×16px |
| `icon-ranking-active.png` | Ranking 탭 활성 | 16×16px 노랑 |

---

## 에셋 우선순위

| 순위 | 에셋 | 이유 |
|------|------|------|
| 1 | 로고 (`logo.png`) | 브랜딩 핵심 |
| 2 | 맵 노드 6종 | 홈 화면 주인공 |
| 3 | 플레이어 마커 | 현재 위치 표현 |
| 4 | 타일 5종 | 게임 핵심 UI |
| 5 | 키패드 버튼 | 게임 핵심 UI |
| 6 | 경로 타일 | 맵 분위기 |
| 7 | 결과 모달 배경 | 연출 강화 |

---

## 권장 에셋 사이즈 기준

- 기본 픽셀 1칸 = **4px** (화면 기준) → 도트 12×12 → 실제 48×48px
- 모든 에셋은 **2배 해상도(@2x)** 제작 후 CSS `image-rendering: pixelated` 적용
- 그림자: 코드 단 `feDropShadow dx=3 dy=3 stdDeviation=0` 유지 (에셋에 그림자 미포함)

```css
/* globals.css에 추가 예정 */
.pixel-art {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

---

## 애니메이션 계획

| 요소 | 방법 | 시점 |
|------|------|------|
| 플레이어 마커 bounce | CSS `@keyframes` or sprite sheet | 에셋 추가 시 |
| 노드 클리어 이펙트 | `framer-motion` scale+opacity | 게임 완료 후 |
| 경로 점선 draw-on | SVG `stroke-dashoffset` 애니메이션 | 맵 진입 시 |
| 타일 flip | 기존 `tileReveal` 유지 | 이미 구현됨 |
| 결과 confetti | `canvas-confetti` 또는 CSS particle | 클리어 시 |
