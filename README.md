# Mathdle — 수학 방정식 워들

Wordle에서 영감을 받은 수학 방정식 퍼즐 게임. 매일 새로운 수식을 6번의 시도 안에 맞혀보세요.

---

## 빠른 시작

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## 아키텍처 개요

```
math_wordle/
├── app/                     # Next.js App Router 페이지 및 API 라우트
│   ├── page.tsx             # 홈/랜딩 페이지
│   ├── play/                # 게임 플레이 페이지
│   ├── leaderboard/         # 리더보드 페이지
│   ├── share/[code]/        # 공유 결과 페이지
│   ├── admin/               # 관리자 페이지 (Admin Shell)
│   └── api/                 # API 라우트 (Route Handlers)
│       ├── puzzles/         # 퍼즐 조회 (today, [id], random)
│       ├── validate-guess/  # 서버 사이드 정답 검증
│       ├── results/         # 게임 결과 저장
│       ├── leaderboard/     # 리더보드 조회
│       ├── share/[code]/    # 공유 코드 조회
│       └── admin/           # 관리자 API (퍼즐 CRUD, AI 생성)
│
├── components/              # 재사용 가능한 UI 컴포넌트
│   ├── ui/                  # 공통 UI (AppHeader, EmptyState, LoadingState...)
│   ├── game/                # 게임 컴포넌트 (AttemptGrid, ScientificKeypad, TokenTile...)
│   ├── result/              # 결과 컴포넌트 (ResultModal, ShareCard)
│   ├── leaderboard/         # 리더보드 컴포넌트
│   └── admin/               # 관리자 컴포넌트
│
├── hooks/                   # React 커스텀 훅
│   ├── useGameSession.ts    # 핵심 게임 세션 상태 머신
│   ├── usePuzzleLoader.ts   # 퍼즐 데이터 로딩
│   ├── useShareResult.ts    # 공유 기능
│   ├── useLeaderboard.ts    # 리더보드 데이터
│   └── useLocalPersistence.ts # localStorage 영속성
│
├── lib/                     # 도메인 로직 및 유틸리티
│   ├── puzzles/
│   │   ├── mock-puzzles.ts      # 개발용 목 퍼즐 데이터
│   │   ├── puzzle-adapter.ts    # PuzzleTransport → PuzzleViewModel (핵심 확장 포인트)
│   │   └── puzzle-repository.ts # 데이터 접근 레이어 (mock/Supabase 교체 포인트)
│   ├── game/
│   │   ├── validator.ts         # 수식 검증 + Wordle 피드백 로직
│   │   └── share.ts             # 공유 텍스트/페이로드 생성
│   ├── leaderboard/
│   │   └── leaderboard-service.ts
│   ├── share/
│   │   └── share-store.ts
│   ├── supabase/
│   │   ├── client.ts            # 브라우저 클라이언트
│   │   └── server.ts            # 서버 클라이언트
│   └── utils/
│       ├── cn.ts                # Tailwind 클래스 머지
│       └── session.ts           # 익명 세션 관리
│
├── types/                   # TypeScript 타입 정의
│   ├── puzzle.ts            # PuzzleTransport / PuzzleViewModel
│   ├── game.ts              # 게임 상태 타입
│   ├── database.ts          # Supabase DB 행 타입
│   ├── leaderboard.ts
│   ├── share.ts
│   └── api.ts               # API 요청/응답 타입
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        └── 002_indexes.sql
```

---

## 왜 퍼즐 JSON 스키마가 추상화되어 있는가?

현재 앱은 퍼즐 `raw_payload`의 최종 JSON 스키마를 의도적으로 고정하지 않았습니다.

**이유:**
1. 토큰 기반 수식 표현 방식, 변수 지원 범위, 과학 수식 토큰 등이 설계 중
2. AI 생성 파이프라인(OpenAI)의 출력 포맷이 아직 확정되지 않음
3. DB의 `raw_payload JSONB`와 `PuzzleAdapter` 레이어 덕분에 스키마가 바뀌어도 UI 코드는 변경 없음

### 타입 레이어 구조

```
raw_payload (DB JSONB, 유연)
    ↓  adaptPuzzle() in lib/puzzles/puzzle-adapter.ts
PuzzleViewModel (stable UI contract)
    ↓
UI 컴포넌트 (PuzzleHeaderCard, AttemptGrid, ScientificKeypad...)
```

---

## 최종 퍼즐 엔진 연동 방법

### 1. `lib/puzzles/puzzle-adapter.ts` 수정

`adaptPuzzle()` 함수의 TODO 주석 위치에 실제 파싱 로직 구현:

```typescript
// TODO: Replace this cast once raw_payload schema is finalized
const payload = transport.raw_payload as YourFinalPuzzlePayload; // ← 여기만 교체
```

### 2. `lib/game/validator.ts` 수정

`PuzzleValidationContext` 인터페이스를 실제 검증기 인터페이스로 교체:

```typescript
// TODO: Replace with final puzzle engine's validation interface
export interface PuzzleValidationContext { ... }
```

### 3. `lib/puzzles/puzzle-repository.ts` 수정

각 함수의 TODO 주석 위치에 Supabase 쿼리 구현.

---

## Supabase 연동

### 1. 환경 변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일에 실제 값 입력
```

### 2. 마이그레이션 실행

```bash
# Supabase CLI
supabase db push

# 또는 대시보드 SQL Editor에서 직접 실행:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_indexes.sql
```

---

## OpenAI 퍼즐 생성 파이프라인 연동 포인트

`app/api/admin/generate-puzzle/route.ts`에 다음 단계 구현:

```typescript
// 1. 생성 프롬프트 구성
const prompt = buildGenerationPrompt(body);

// 2. OpenAI 호출
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" },
});

// 3. 결과 파싱 → lib/puzzles/puzzle-adapter.ts의 adaptPuzzle()로 검증
// 4. Supabase puzzle_generation_jobs 테이블에 저장
```

---

## 페이지 목록

| 경로 | 설명 |
|------|------|
| `/` | 홈/랜딩 |
| `/play` | 오늘의 퍼즐 (데일리) |
| `/leaderboard` | 리더보드 |
| `/share/[code]` | 공유 결과 |
| `/admin/puzzles` | 관리자: 퍼즐 목록 |
| `/admin/puzzles/new` | 관리자: 퍼즐 생성 |
| `/admin/generation-jobs` | 관리자: AI 생성 작업 이력 |

---

## 기술 스택

- **Next.js 14** App Router + TypeScript strict mode
- **Tailwind CSS** v3 (커스텀 게임 컬러 팔레트)
- **Supabase** PostgreSQL + RLS
- **mathjs** 수식 평가 엔진
- **lucide-react** 아이콘
- **framer-motion** 애니메이션 (설치됨)
