# 작업 인수인계 (Cross-Environment Handoff)

> **⚠️ 모든 에이전트 필독 — 이 파일이 유일한 상태 소스(SSOT)입니다.**
>
> **작업 시작 전**: `git pull` → 이 파일 읽기 → "누가 뭘 하고 있나" 테이블에서 내 상태 [작업 중]으로 변경
> **작업 종료 시**: `npm run build` → 로그 저장(`docs/build-logs/`) → 이 파일 업데이트 → `git push`
> **CLAUDE_PROMPT 생성 시**: `docs/CLAUDE_PROMPT_TEMPLATE.md` 템플릿 사용 (성공 기준 필수 포함)
>
> 📋 **상세 프로토콜**: CLAUDE.md의 "하이브리드 협업 규칙" 섹션 (Rule #13~16) 참조

---

## 최근 핸드오프 (Latest Handoff)

- **From**: Claude Code (gstack QA + 버그 수정)
- **When**: 2026-03-29 (KST)
- **Branch**: `master` (배포 브랜치)
- **최신 커밋**: `fec1618`

### 이번 세션에서 완료한 것 (Claude Code)
- [x] **QA-1**: gstack 브라우저 기반 전체 QA 수행 (건강 점수 78/100)
  - 홈, 온보딩, 유닛 선택, 레슨 Unit 01 (6개 스텝), 리뷰 페이지 테스트
  - TTS 품질 집중 점검: 335개 단어 100% MP3 커버리지 확인
  - 반응형 레이아웃 (모바일/태블릿/데스크탑) 검증
- [x] **QA-FIX-1**: `tan.mp3` 생성 — Word Family Builder -an 패밀리 보너스 단어 404 에러 수정
- [x] **QA-FIX-2**: `core_ih.mp3` 재생성 — 0.28초→1.11초 (다른 모음과 동일 수준으로 길이 조정)
- [x] **QA-FIX-3**: 태블릿 홈 레이아웃 수정 — `mt-auto` → `mt-8 md:mt-10` + `max-w-lg` 적용
- [x] **빌드 확인**: `npm run build` 성공

### 이번 세션에서 확인된 것 (문제 없음)
- 단어 이미지 533개 전부 정상 (QA 초기 오탐 → 로딩 지연이었음)
- TTS fallback (SpeechSynthesis) 정상 동작
- 오디오 캐싱 정상
- phoneme onset/rime 오디오 전부 정상 재생
- 콘솔 에러 없음 (tan.mp3 수정 후)

### 블로커 / 주의사항
- Supabase SQL (`docs/supabase/setup_v2_licensing.sql`) 아직 미실행
- 립싱크 영상 일부 단어만 존재 (별도 고민 예정)
- `core_ih.bak.mp3` 백업 파일 남아있음 (삭제 가능)

### 다음 에이전트의 할 일
1. `git pull` 실행
2. Vercel 배포 확인 (phonics-app-one.vercel.app)
3. 립싱크 영상 확장 방안 결정
4. Supabase SQL 실행 및 라이선스 시스템 실제 연동 테스트
5. 실기기 재테스트 (TTS 음질, Say & Check STT 동작)
6. 완료 시 이 파일 업데이트 후 커밋/푸시

---

## 프로젝트 현재 상태

### Stage 4: B2G 라이선스 시스템 ✅ 완료

| 모듈 | 상태 | 설명 |
|------|------|------|
| `/admin` | ✅ 구현 완료 | PIN 보호, 학교 등록, 라이선스 키 생성, 교사 관리 |
| `/teacher` | ✅ 구현 완료 | 라이선스 키 가입, 학급 코드 생성, 시트 관리/회수 |
| 앱 활성화 | ✅ 구현 완료 | 학급 코드 + 닉네임 입력, 기기 락, 오프라인 토큰 |
| Supabase DB | ✅ 스키마 완료 | RLS 정책 패치 적용, SQL 미실행 |
| 학생 가이드 PDF | ✅ 생성 완료 | docs/student-guide/Phonics300_학생용_가이드.pdf |
| 교사 가이드 PDF | ✅ 생성 완료 | docs/teacher-guide/Phonics300_교사용_가이드.pdf (13p, 관리자 제외) |

### 커리큘럼: 37개 유닛

| 레벨 | 유닛 | 주제 |
|------|------|------|
| CoreA (1~12) | 1~5 짧은 모음, 7~11 긴 모음/Magic e, 6,12 복습 |
| CoreB (13~24) | 13~17 자음 조합, 19~23 고급 패턴, 18,24 복습 |
| L3 (25~30) | 자음군 (l-blends, r-blends, s-blends, digraphs) |
| L4 (31~37) | 모음팀/이중모음 (ea/ee, oa/ow, ai/ay, diphthongs, r-controlled, oo) |

---

## 누가 뭘 하고 있나 (Who is doing what)

| 에이전트 | 상태 | 현재 작업 | 블로커 |
|----------|------|----------|--------|
| **Antigravity** | [대기] | — | — |
| **Claude Code** | [작업 완료] | gstack QA + TTS/레이아웃 수정 3건 | — |
| **Claude Web** | [대기] | — | — |

---

## 필수 환경변수 (Production)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_PIN=1234 (기본값, 프로덕션에서 반드시 변경)
```

---

## 배포 규칙 (Branch & Deployment Policy)

> **⚠️ 이 규칙은 2026-03-26에 사용자와 합의하여 수립되었습니다.**

### 배포 구조
- **배포 브랜치**: `master` → Vercel 자동 배포 (`phonics-app-one.vercel.app`)
- **작업 브랜치**: `claude/*` — 개발 및 실험용

### 필수 합의 사항
1. **머지 전 반드시 사용자에게 확인**: 작업 브랜치를 master에 머지하기 전에 반드시 사용자와 합의할 것
2. **배포 영향 고지**: master에 푸시하면 Vercel이 자동 배포되므로, 푸시 전에 "이 푸시는 프로덕션에 배포됩니다"라고 명시할 것
3. **브랜치 상태 기록**: 핸드오프 시 현재 작업 브랜치와 master의 커밋 차이를 명시할 것
4. **새 브랜치 생성 시 고지**: 새 브랜치를 만들 때 그 목적과 master와의 관계를 사용자에게 설명할 것

### 절대 금지
- 사용자 확인 없이 master에 머지/푸시하지 말 것
- 배포 브랜치(master)를 force push하지 말 것
- 작업 브랜치에서만 작업하고 master 머지를 잊은 채 핸드오프하지 말 것

---

## 핸드오프 체크리스트 (매 세션 종료 시)

- [ ] `npm run build` 성공 확인 (로그: docs/build-logs/YYYY-MM-DD.txt)
- [ ] 이 파일의 "최근 핸드오프" 섹션 업데이트
- [ ] "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 완료]로 변경
- [ ] **배포 확인**: master와 작업 브랜치의 커밋 차이 확인 → 머지 필요 시 사용자에게 알릴 것
- [ ] `git add . && git commit && git push`
- [ ] 다음 작업 시작 시: `git pull` 실행

---

## Antigravity 전용 리마인더

> **Antigravity가 Claude Code에 작업을 요청할 때 (CLAUDE_PROMPT 생성 시):**
> 1. `docs/CLAUDE_PROMPT_TEMPLATE.md` 기반으로 작성할 것
> 2. **성공 기준** 섹션을 반드시 포함 (빌드 통과 + 기능 확인 항목)
> 3. 이 파일의 "누가 뭘 하고 있나"에서 Claude Code → `[작업 대기: PROMPT명]`으로 변경
> 4. `git push`로 Claude Code가 받을 수 있게 할 것
>
> **Antigravity 세션 종료 시:**
> 1. `npm run build` 실행 → `docs/build-logs/YYYY-MM-DD.txt` 저장
> 2. 이 파일의 "최근 핸드오프" 섹션 업데이트 (완료/블로커/다음 할 일)
> 3. `git add . && git commit && git push`
