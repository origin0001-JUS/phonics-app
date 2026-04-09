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

- **From**: Claude Code (Phoneme TTS 전체 완료)
- **When**: 2026-04-09 (KST)
- **Branch**: `master` (배포 브랜치)
- **최신 커밋**: (이번 커밋)

### 이번 세션에서 완료한 것 (2026-04-09)

#### Round 5: 단순 단어/음절 전략 (7개)
- [x] 완전히 다른 프롬프트 전략: "it", "bluh", "fruh" 등 단순 단어/음절
- [x] 3개 해결 (core_ih, onset_bl, onset_fr), 4개 잔존

#### 최종 4개: AI Studio 수동 생성
- [x] 사용자가 Google AI Studio에서 직접 생성한 4개 음원 (core_ih, core_th_v, onset_f, onset_l)
- [x] ffmpeg로 개별 음절 분리 + MP3 변환
- [x] Audit 페이지 업데이트 + 배포
- **192개 phoneme 음원 100% 완성**

### 이전 세션 (2026-04-08)

#### HANDOFF 동기화
- [x] `git pull` — 랩탑에서 작업한 Round 3~4 커밋 반영 확인
- [x] 빌드 검증 통과 (`npx next build` — 50 pages 정상 생성)
- [x] HANDOFF.md를 Round 4 결과까지 업데이트

### 이전 세션: 랩탑 Antigravity (2026-04-07)

#### Round 3: 21개 맞춤 프롬프트 재생성
- [x] 21개 NG 음소 개별 맞춤 프롬프트로 재생성
- [x] Audit 페이지에 🔥 R3 탭 필터 추가
- 커밋: `c1c11d7`, `6d54f60`, `164ca30`

#### Round 4: 11개 ultra-detailed 발음 프롬프트
- [x] Round 3에서도 NG인 11개에 대해 초정밀 조음 프롬프트로 재생성
- [x] Audit 페이지에 🔥 R4 탭 추가
- **Whisper audit 결과**: 11개 중 9 NG / 1 WARN / 1 EMPTY — 사실상 Whisper로는 단독 음소 판별 한계
- 커밋: `2ddd801`, `8ab9e45`

#### 이전 세션: Claude Code (2026-04-07)
- [x] Vercel 배포 설정 수정 (`vercel.json`, phoneme-audit.html 404 해결)
- [x] Phoneme TTS V3 재생성 Round 1~2 (192개 중 171 OK, 89%)
- [x] Whisper QA 파이프라인 개선 (파일 필터, rate limit 대응)
- [x] Audit 청취 페이지 업데이트 (재생성 배지, 탭 필터, CSV 내보내기)
- [x] `docs/tts-version-history.md` 작성
- 상세 내역: 커밋 `bce22ed` ~ `cdee8ff`

### 블로커 / 주의사항
- **Phoneme TTS 192개 100% 완성** — Round 1~5 + AI Studio 수동생성으로 전체 완료
- `phonemes_backup/` 디렉토리 정리 가능 (원본 백업)
- Supabase SQL (`docs/supabase/setup_v2_licensing.sql`) 아직 미실행
- 립싱크 영상 일부 단어만 존재

### 다음 할 일
1. 백업 파일 정리 (`phonemes_backup/`, `core_ih.bak.mp3`)
2. Supabase SQL 실행 및 라이선스 시스템 실제 연동 테스트
3. 립싱크 영상 확장 방안 결정
4. 실기기 재테스트 (TTS 음질, Say & Check STT 동작)

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
| **Claude Code** | [작업 완료] | Phoneme TTS 192개 100% 완성 | — |
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
