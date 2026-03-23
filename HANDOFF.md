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

- **From**: Claude Code (워크플로우 개선 + 학생 가이드 PDF 생성)
- **When**: 2026-03-24 09:00 (KST)
- **Branch**: `claude/multi-environment-setup-Nlrfn`

### 이번 세션에서 완료한 것
- [x] 학생용 이용 가이드 PDF 생성 (docs/student-guide/)
- [x] Playwright로 앱 스크린샷 18장 자동 캡처
- [x] 하이브리드 워크플로우 검토 및 개선안 수립
- [x] 빌드 로그 체계 구축 (docs/build-logs/)
- [x] HANDOFF.md 구조 개선 (명확한 핸드오프 포맷)
- [x] CLAUDE_PROMPT 템플릿 생성 (docs/CLAUDE_PROMPT_TEMPLATE.md)
- [x] 협업 룰 강화 (CLAUDE.md 업데이트)

### 블로커 / 주의사항
- Supabase SQL (`docs/supabase/setup_v2_licensing.sql`) 아직 미실행 — 대시보드에서 수동 실행 필요
- 안드로이드 APK 빌드 미완료 — `npx cap sync` → Android Studio 필요

### 다음 에이전트의 할 일
1. `git pull` 실행
2. 빌드 확인: `npm run build` (로그: `docs/build-logs/` 확인)
3. Supabase SQL 실행 및 실제 교사 가입/학생 기기 락 테스트
4. 안드로이드 APK 빌드 (`npx cap sync`)
5. 완료 시 이 파일의 "최근 핸드오프" 섹션 업데이트 후 커밋/푸시

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
| **Claude Code** | [작업 완료] | 워크플로우 개선 + 가이드 생성 완료 | — |
| **Claude Web** | [대기] | — | — |

---

## 필수 환경변수 (Production)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_PIN=1234 (기본값, 프로덕션에서 반드시 변경)
```

---

## 핸드오프 체크리스트 (매 세션 종료 시)

- [ ] `npm run build` 성공 확인 (로그: docs/build-logs/YYYY-MM-DD.txt)
- [ ] 이 파일의 "최근 핸드오프" 섹션 업데이트
- [ ] "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 완료]로 변경
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
