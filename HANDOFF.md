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

- **From**: Claude Code (실기기 QA 피드백 기반 버그 수정)
- **When**: 2026-03-27 (KST)
- **Branch**: `master` (배포 브랜치)

### 이번 세션에서 완료한 것
- [x] **CC-1**: Listen 버튼 가시성 개선 — `bg-white/40` → `bg-indigo-600/70` + 테두리/그림자
- [x] **CC-2**: Say & Check 마이크 UX — Next 버튼 통과 시에만 표시 + 안내 문구 추가
- [x] **CC-3**: 마이크 0% 자동 통과 버그 수정 — STT 오류/미지원 시 `matched: false`로 변경
- [x] **CC-4**: Lesson Done 화면 한국어화 — "학습 완료!", "다시 배우기", "완료 확인 ✓", "정답"
- [x] **CC-5**: Word Family Builder 보너스 단어 버그 수정 — rime에 wordFamily("-at") 대신 실제 rime("at") 사용
- [x] **CC-6**: 모바일/태블릿 반응형 확인 — 코드 구조 정상 (max-w-md + grid-cols-2)
- [x] **TTS 문서**: `docs/TTS_ISSUES_FOR_ANTIGRAVITY.md` 작성 — phoneme/조합/단어 발음 이슈 정리

### 블로커 / 주의사항
- TTS 발음 이슈 (n, r, ed, m+an, m+ap, s+it, pan, fed 등) → Antigravity ElevenLabs 재생성 필요
- Supabase SQL (`docs/supabase/setup_v2_licensing.sql`) 아직 미실행
- 배포 후 실기기 재테스트 필요 (특히 CC-2, CC-3 마이크 관련)

### 다음 에이전트의 할 일
1. `git pull` 실행
2. Vercel 배포 확인 (phonics-app-one.vercel.app)
3. Antigravity: `docs/TTS_ISSUES_FOR_ANTIGRAVITY.md` 기반 TTS 오디오 재생성
4. 실기기 재테스트 (마이크 UX, Word Family Builder 보너스 단어)
5. 완료 시 이 파일 업데이트 후 커밋/푸시

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
| **Antigravity** | [작업 대기] | TTS 발음 재생성 (docs/TTS_ISSUES_FOR_ANTIGRAVITY.md) | — |
| **Claude Code** | [작업 완료] | 실기기 QA 버그 6건 수정 완료 | — |
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
