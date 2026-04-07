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

- **From**: Claude Code (Phoneme TTS 대규모 재생성 + QA)
- **When**: 2026-04-07 (KST)
- **Branch**: `master` (배포 브랜치)
- **최신 커밋**: `cdee8ff` (+ Round 3 진행 중)

### 이번 세션에서 완료한 것 (2026-04-07)

#### 1. Vercel 배포 설정 수정
- [x] `vercel.json` 추가 — `framework: null`, `outputDirectory: out` 설정
- [x] `phoneme-audit.html` 404 문제 해결 (Next.js 프레임워크 프리셋 → 순수 정적 서빙)
- 커밋: `bce22ed` → `ccb2afd`

#### 2. Phoneme TTS 대규모 재생성 (V3)
- [x] **NG 분석**: 수동 QA에서 192개 중 78개 NG 판정 (41%)
- [x] **재생성 스크립트 개발**: `scripts/regenerate-ng-phonemes.ts` + `scripts/ng-phoneme-data.ts`
  - Gemini 2.5 Flash TTS + Aoede 보이스 (미국 여성)
  - 파닉스 컨텍스트 프롬프트: IPA + 예시단어 + "이것은 단어가 아닌 음소 패턴" 명시
  - Flash TTS `systemInstruction` 미지원 발견 → user prompt에 합침
  - Kore 보이스 불안정 발견 → Aoede로 변경
- [x] **Round 1**: 74/78 생성 성공 (4개 일일 quota 소진)
- [x] **Round 1 수동 QA**: 57/74 OK, 17 NG
- [x] **Round 2**: 21개 재생성 (Round 1 NG 17 + 미생성 4)
- [x] **Round 2 수동 QA (Ver2)**: 171/192 OK (89%), 21 NG (11%)
- [x] **Round 3 진행 중**: 21개 개별 맞춤 프롬프트로 재생성 중
- 주요 커밋: `1469d35`, `027a097`, `e228803`, `6a99ad9`

#### 3. Whisper QA 파이프라인 개선
- [x] `audit-phoneme-whisper.ts`에 `--files=` 필터 옵션 추가
- [x] Groq Whisper 20 RPM 제한 대응 (4초 딜레이 + 429 자동 재시도)
- 커밋: `29005f9`

#### 4. Phoneme Audit 청취 페이지 업데이트
- [x] 재생성 파일 Whisper 결과 반영 (Round 1 + 2)
- [x] "🔄 재생성" 배지 + "재생성됨" 탭 필터 추가
- [x] 재생성 파일 수동 판정 자동 리셋 (음원 변경 시)
- [x] CSV 내보내기에 "재생성" 컬럼 추가
- 커밋: `8ff0521`, `7e574eb`, `cdee8ff`

#### 5. 문서화
- [x] `docs/tts-version-history.md` — TTS 전체 히스토리 (V1~V3, QA 파이프라인, API 제한, 학습사항)
- 커밋: `db185de`

### 이전 세션 반영 누락분 (2026-03-29 이후)

#### 2026-03-29 ~ 2026-04-06
- [x] `67da9d9` — Whisper 기반 phoneme audit 도구 + 청취 페이지 구축
- [x] `0980094` — 재사용 가능한 워크플로우 템플릿 추가 (GStack+Superpowers+GSD+핸드오프)
- [x] `dc743be` — 통합 워크플로우 규칙 CLAUDE.md에 추가

### 블로커 / 주의사항
- **Phoneme NG 21개 잔존** — Round 3 재생성 진행 중 (core_ih, core_ng, core_th 등 난이도 높은 음소)
- Supabase SQL (`docs/supabase/setup_v2_licensing.sql`) 아직 미실행
- 립싱크 영상 일부 단어만 존재
- `core_ih.bak.mp3` 백업 파일 + `phonemes_backup/` 디렉토리 남아있음 (최종 QA 후 정리)
- Gemini Flash TTS 무료 tier: 일일 100회, 분당 10회 제한

### 다음 에이전트의 할 일
1. `git pull` 실행
2. Round 3 재생성 결과 수동 QA → 여전히 NG이면 Round 4 또는 수동 녹음 검토
3. 최종 통과된 음원 커밋 + Vercel 배포 확인
4. Supabase SQL 실행 및 라이선스 시스템 실제 연동 테스트
5. 립싱크 영상 확장 방안 결정
6. 실기기 재테스트 (TTS 음질, Say & Check STT 동작)

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
| **Claude Code** | [작업 중] | Phoneme TTS V3 재생성 (Round 3, 21개 NG) | Gemini 일일 100회 제한 |
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
