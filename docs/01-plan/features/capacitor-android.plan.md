# Plan: capacitor-android

> CLAUDE_TASKS.md Round 4: Capacitor Android 패키징

## 1. 개요

Next.js 정적 빌드(output: 'export') + Capacitor를 통해 Android APK로 패키징할 수 있는 환경을 구성한다.

## 2. 작업 목록

### Step 1: next.config.ts에 `output: 'export'` 추가

- `next.config.ts`에 `output: 'export'` 설정
- 정적 빌드 시 빌드 결과물이 `out/` 디렉토리에 생성됨

### Step 2: 동적 라우트 대응 — `generateStaticParams` 추가

- `/lesson/[unitId]/page.tsx`는 동적 라우트
- `output: 'export'`는 모든 동적 라우트에 `generateStaticParams` 필요
- `curriculum` 데이터에서 24개 unit ID를 가져와 정적 생성
- **주의**: `generateStaticParams`는 서버 함수이므로 "use client" 위에 별도로 export 가능 (Next.js 16에서는 "use client" 파일에서도 서버 함수 export 가능하지만, 별도 분리가 깔끔할 수 있음)

```typescript
import { curriculum } from "@/data/curriculum";

export function generateStaticParams() {
    return curriculum.map((unit) => ({ unitId: unit.id }));
}
```

### Step 3: Capacitor 설치

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

### Step 4: Capacitor 초기화

```bash
npx cap init "Phonics 300" "com.phonics300.app" --web-dir out
```

- `capacitor.config.ts` 자동 생성
- `webDir: 'out'` 설정 확인

### Step 5: Android 플랫폼 추가

```bash
npm install @capacitor/android
npx cap add android
```

### Step 6: 빌드 + 동기화

```bash
npm run build
npx cap sync
```

### Step 7: 검증

- `android/` 디렉토리 생성 확인
- `capacitor.config.ts`에 `webDir: 'out'` 설정 확인
- 빌드 에러 0 확인

## 3. 주의사항

- `output: 'export'` 추가 시 API Routes, middleware 등 서버 기능 사용 불가 (현재 없으므로 OK)
- 모든 페이지가 "use client" → 정적 빌드 호환
- `next/image` 미사용 → `images: { unoptimized: true }` 불필요
- Service Worker 경로가 정적 빌드에서도 정상 동작하는지 확인 필요

## 4. 영향 범위

- **수정 파일**: `next.config.ts`, `lesson/[unitId]/page.tsx`
- **새 파일**: `capacitor.config.ts` (자동 생성)
- **새 디렉토리**: `android/` (자동 생성), `out/` (빌드 출력)
- **새 의존성**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`

## 5. 완료 기준

- [ ] `next.config.ts`에 `output: 'export'` 추가
- [ ] `generateStaticParams` 추가 (24개 unit)
- [ ] `npm run build` → `out/` 디렉토리에 정적 파일 생성
- [ ] `capacitor.config.ts` 생성 (webDir: 'out')
- [ ] `android/` 디렉토리 생성
- [ ] `npx cap sync` 정상 완료
