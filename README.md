# Mathdle — 수학 방정식 워들

Wordle에서 영감을 받은 수학 방정식 퍼즐 게임. 스테이지 → 스텝 → 퍼즐 구조로 진행하며, 매 스텝마다 5개의 퍼즐 풀 중 하나가 출제됩니다.

---

## 빠른 시작

```bash
npm install

# 웹
npm run dev:web       # http://localhost:3000

# 모바일 (Expo) — LAN 모드, 오프라인 버전 체크 스킵
cd apps/mobile && EXPO_OFFLINE=1 npx expo start --lan --clear
```

---

## 아키텍처 개요

npm workspaces 기반 monorepo입니다.

```
math_wordle/
├── apps/
│   ├── web/                          # Next.js 웹 앱 (@mathdle/web)
│   │   ├── app/
│   │   │   ├── page.tsx              # 홈 — 스테이지 맵
│   │   │   ├── stage/[stageId]/      # 스테이지 상세 (스텝 목록)
│   │   │   ├── step/[code]/          # 스텝 인트로
│   │   │   ├── step/[code]/play/     # 게임 플레이 ← 핵심 UI
│   │   │   ├── leaderboard/
│   │   │   ├── share/[code]/
│   │   │   ├── admin/
│   │   │   └── api/
│   │   │       ├── stages/           # 스테이지 조회
│   │   │       ├── steps/[code]/     # 스텝 인트로 + start-run
│   │   │       ├── runs/[runId]/     # submit-guess, finish
│   │   │       ├── puzzles/
│   │   │       ├── validate-guess/
│   │   │       ├── results/
│   │   │       ├── leaderboard/
│   │   │       ├── share/[code]/
│   │   │       └── admin/
│   │   ├── components/
│   │   │   ├── game/                 # AttemptGrid, ScientificKeypad, BlockCellTile, InputPreviewBar...
│   │   │   ├── result/
│   │   │   ├── leaderboard/
│   │   │   ├── admin/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── useGameSession.ts
│   │   │   ├── usePuzzleLoader.ts
│   │   │   ├── useLocalPersistence.ts
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── puzzles/              # puzzle-repository, puzzle-adapter, spec-validator, puzzle-normalizer
│   │   │   ├── game/                 # validator.ts, share.ts
│   │   │   ├── supabase/
│   │   │   └── utils/
│   │   ├── types/
│   │   ├── scripts/
│   │   └── supabase/migrations/
│   │
│   └── mobile/                       # Expo React Native 앱 (@mathdle/mobile)
│       ├── app/
│       │   ├── index.tsx             # 홈 — 스테이지 월드맵
│       │   ├── stage/[stageNum].tsx  # 스테이지 상세 (스텝 목록)
│       │   └── step/[code]/          # 스텝 인트로 + play
│       ├── components/game/
│       ├── hooks/
│       ├── utils/progress.ts         # AsyncStorage 기반 스텝 클리어 진행도
│       └── storage/
│
├── packages/
│   └── core/                         # 공유 비즈니스 로직 (@mathdle/core)
│       └── src/
│           ├── game/                 # validator, progression, share
│           ├── puzzles/              # problem-sets (PROBLEM_SETS + getProblemSetPuzzleById), puzzle-adapter
│           ├── config/               # stage-config (getStepByCode, selectPuzzleForStep)
│           ├── api/                  # client
│           ├── storage/
│           ├── types/                # puzzle, game, progression, spec, ...
│           └── utils/
│
└── supabase/migrations/              # DB 마이그레이션
```

---

## 게임 흐름

```
/                         홈 — 스테이지 맵
  └── /stage/[stageId]    스테이지 상세 — 스텝 목록 (잠금/클리어 상태 표시)
        └── /step/[code]  스텝 인트로 — 풀 설명, 내 기록
              └── /step/[code]/play   게임 플레이 (핵심 UI)
```

각 스텝은 5개의 퍼즐 풀을 가지며, 스텝 10번은 **보스 스텝**입니다. 보스를 클리어해야 다음 스테이지가 열립니다.

퍼즐 ID 규칙: `{stageNum}_{stepNum}_{poolIndex}` (예: `9_6_1`). 스텝 시작 시 `start-run`이 풀에서 랜덤 선택 후 `runId`를 반환합니다.

---

## 게임 플레이 UI (`/step/[code]/play`)

현재 개발의 핵심 집중 영역입니다.

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| `AttemptGrid` | `components/game/AttemptGrid.tsx` | 시도 기록 그리드 |
| `BlockCellTile` | `components/game/BlockCellTile.tsx` | 블록 타입 셀 렌더링 |
| `InputPreviewBar` | `components/game/InputPreviewBar.tsx` | 현재 입력 미리보기 |
| `ScientificKeypad` | `components/game/ScientificKeypad.tsx` | 수학 키패드 |
| `StepPlayPage` | `app/step/[code]/play/page.tsx` | 게임 상태 머신, API 연동 |

### 런(Run) 사이클

```
POST /api/steps/[code]/start-run   → runId + PuzzleViewModel
  ↓ 유저 입력
POST /api/runs/[runId]/submit-guess → feedback (correct/present/absent)
  ↓ 완료 시
POST /api/runs/[runId]/finish       → 결과 저장
```

---

## 패키지

| 패키지 | 설명 |
|--------|------|
| `@mathdle/core` | 게임 검증, 퍼즐 어댑터, 공유 타입 (플랫폼 무관) |
| `@mathdle/web` | Next.js 웹 앱 (Supabase 연동, 관리자 포함) |
| `@mathdle/mobile` | Expo React Native 앱 |

---

## Supabase 연동

```bash
cp .env.local.example apps/web/.env.local
# 실제 값 입력 후

supabase db push
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 웹 | Next.js 14, TypeScript, Tailwind CSS v3 |
| 모바일 | Expo (React Native), Expo Router |
| 공유 로직 | `@mathdle/core` (mathjs, vitest) |
| DB | Supabase PostgreSQL + RLS |
| 기타 | framer-motion, lucide-react |
