# 재사용 가능한 워크플로우 템플릿

> 새 프로젝트에 GStack + Superpowers + GSD + 핸드오프 프로토콜을 적용할 때
> 아래 2개 파일을 복사하여 프로젝트 루트에 배치하세요.

---

## 파일 1: CLAUDE.md 맨 밑에 추가할 내용

```markdown
## 하이브리드 협업 규칙 (Hybrid Collaboration Rules)

> **HANDOFF.md가 유일한 상태 소스(Single Source of Truth)입니다.**

### 13. 작업 시작 프로토콜 (Session Start)
- **필수**: `git pull` 실행하여 최신 상태 동기화
- HANDOFF.md의 "최근 핸드오프" 섹션을 읽고 현재 상태 파악
- "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 중]으로 변경

### 14. 작업 완료 프로토콜 (Session End)
모든 작업 완료 시 아래를 **반드시** 순서대로 실행:
1. **빌드 검증**: `npm run build` 실행 → 로그를 `docs/build-logs/YYYY-MM-DD.txt`에 저장
2. **HANDOFF.md 업데이트**:
   - "최근 핸드오프" 섹션에 완료한 작업/블로커/다음 할 일 기재
   - "누가 뭘 하고 있나"에서 내 상태를 [작업 완료]로 변경
3. **커밋 & 푸시**: `git add . && git commit -m "feat/fix/chore: 설명" && git push`
4. **완료 메시지**: "✅ 작업 완료 및 GitHub에 Push 되었습니다. HANDOFF.md를 확인하세요."

### 15. CLAUDE_PROMPT 작성 규칙 (Antigravity용)
- `docs/CLAUDE_PROMPT_TEMPLATE.md` 템플릿을 따를 것
- **성공 기준 필수 포함**: 빌드 통과 + 기능별 확인 항목
- 작업 요청 시 HANDOFF.md "누가 뭘 하고 있나"에서 Claude Code → [작업 대기: PROMPT명]

### 16. 빌드 로그 규칙
- 매 세션 종료 시 `npm run build` 결과를 `docs/build-logs/YYYY-MM-DD.txt`에 저장
- 빌드 실패 시 HANDOFF.md에 블로커로 기록하고 커밋

## 통합 워크플로우 규칙 (GStack + Superpowers + GSD)

설치된 프레임워크: GStack(기획·QA·보안·배포), GSD(스코핑·실행), Superpowers(품질)

### 사용자 의도 판별 → 자동 워크플로우 선택

사용자가 한국어 또는 영어로 자연어 요청을 하면, 아래 규칙으로 의도를 판별하여 적절한 워크플로우를 자동 실행한다.

아이디어 단계 ("어떻게 하면 좋을까", "아이디어", "고민", "브레인스토밍"):
1. 브레인스토밍 → Superpowers brainstorm
2. YC 스타일 검증 → /gstack-office-hours
3. 전략 평가 → /gstack-plan-ceo-review

새 프로젝트 시작 ("새 앱", "새 프로젝트", "처음부터"):
1. 전체 스코핑 → /gsd:new-project
2. 디테일 확정 → /gsd:discuss-phase
3. 아키텍처 확정 → /gstack-plan-eng-review
4. 이후 "기능 추가" 워크플로우로 이어서 진행

기능 추가/개선 ("만들어줘", "추가해줘", "개선해줘", "구현해줘"):
1. 기획 검증 → /gstack-plan-ceo-review
2. 모호한 부분 확정 → /gsd:discuss-phase
3. 실행 계획 → /gsd:plan-phase
4. 자동 구현 → /gsd:execute-phase
5. 시각적 QA → /gstack-qa (랩탑에서만, VM에서는 건너뜀)
6. 보안 점검 → /gstack-cso
7. 배포 → /gstack-ship (사용자 승인 후에만)

간단한 수정/버그 ("버그", "안 돼", "오류", "수정해줘", "바꿔줘"):
→ /gsd:quick --discuss 로 바로 처리 후 /gstack-qa로 확인

코드 리뷰 ("리뷰해줘", "코드 봐줘", "품질 확인"):
→ /gstack-review

보안 점검 ("보안", "취약점", "해킹"):
→ /gstack-cso

기존 코드 파악 ("코드 분석", "구조 파악", "현재 상태"):
→ /gsd:map-codebase

배포 ("배포", "릴리스", "출시"):
→ /gstack-ship

### Superpowers TDD 적용 기준
- 프로토타입/MVP 단계: TDD 끄기 (빠른 결과 확인 우선)
- 금융 앱/BaaS 시뮬레이터: TDD 반드시 켜기 (계산 정확성이 생명)
- 사용자가 "꼼꼼하게", "정확하게", "테스트 포함" 요청 시: TDD 켜기
- 사용자가 "빨리", "프로토", "일단 돌아가게" 요청 시: TDD 끄기
- 판단이 애매하면 사용자에게 "TDD 적용할까요?" 물어본다

### 공통 규칙
- 한국어 입력이 기본이다. 모든 응답과 보고를 한국어로 한다
- QA(5단계)와 보안(6단계)은 기능 추가 시 절대 건너뛰지 않는다
- 각 단계 전환 시 사용자에게 "N단계 완료, 다음은 OO입니다" 형태로 보고한다
- 사용자가 "그냥 빨리 해줘"라고 해도 보안 점검은 생략하지 않는다
- 작업 완료 시 HANDOFF.md를 업데이트하고 git commit & push 한다 (기존 핸드오프 프로토콜 Rule #13~16 준수)
```

---

## 파일 2: HANDOFF.md (프로젝트 루트에 생성)

```markdown
# 작업 인수인계 (Cross-Environment Handoff)

> **⚠️ 모든 에이전트 필독 — 이 파일이 유일한 상태 소스(SSOT)입니다.**
>
> **작업 시작 전**: `git pull` → 이 파일 읽기 → "누가 뭘 하고 있나" 테이블에서 내 상태 [작업 중]으로 변경
> **작업 종료 시**: `npm run build` → 로그 저장(`docs/build-logs/`) → 이 파일 업데이트 → `git push`
>
> 📋 **상세 프로토콜**: CLAUDE.md의 "하이브리드 협업 규칙" 섹션 (Rule #13~16) 참조

---

## 최근 핸드오프 (Latest Handoff)

- **From**: (에이전트 이름)
- **When**: YYYY-MM-DD
- **Branch**: `main`
- **최신 커밋**: (커밋 해시)

### 이번 세션에서 완료한 것
- [ ] (완료 작업 기록)

### 블로커 / 주의사항
- (있으면 기록)

### 다음 에이전트의 할 일
1. `git pull` 실행
2. (다음 할 일 기록)
3. 완료 시 이 파일 업데이트 후 커밋/푸시

---

## 프로젝트 현재 상태

(프로젝트별 모듈/기능 상태 테이블을 여기에 작성)

---

## 누가 뭘 하고 있나 (Who is doing what)

| 에이전트 | 상태 | 현재 작업 | 블로커 |
|----------|------|----------|--------|
| **Antigravity** | [대기] | — | — |
| **Claude Code** | [대기] | — | — |
| **Claude Web** | [대기] | — | — |

---

## 필수 환경변수

```
(프로젝트별 환경변수 기록)
```

---

## 배포 규칙 (Branch & Deployment Policy)

### 배포 구조
- **배포 브랜치**: `main` → 자동 배포
- **작업 브랜치**: `claude/*` — 개발 및 실험용

### 필수 합의 사항
1. **머지 전 반드시 사용자에게 확인**: 작업 브랜치를 main에 머지하기 전에 반드시 사용자와 합의할 것
2. **배포 영향 고지**: main에 푸시하면 자동 배포되므로, 푸시 전에 "이 푸시는 프로덕션에 배포됩니다"라고 명시할 것
3. **브랜치 상태 기록**: 핸드오프 시 현재 작업 브랜치와 main의 커밋 차이를 명시할 것

### 절대 금지
- 사용자 확인 없이 main에 머지/푸시하지 말 것
- 배포 브랜치(main)를 force push하지 말 것
- 작업 브랜치에서만 작업하고 main 머지를 잊은 채 핸드오프하지 말 것

---

## 핸드오프 체크리스트 (매 세션 종료 시)

- [ ] `npm run build` 성공 확인 (로그: docs/build-logs/YYYY-MM-DD.txt)
- [ ] 이 파일의 "최근 핸드오프" 섹션 업데이트
- [ ] "누가 뭘 하고 있나" 테이블에서 내 상태를 [작업 완료]로 변경
- [ ] **배포 확인**: main과 작업 브랜치의 커밋 차이 확인 → 머지 필요 시 사용자에게 알릴 것
- [ ] `git add . && git commit && git push`
- [ ] 다음 작업 시작 시: `git pull` 실행
```

---

## 적용 순서

1. 프로젝트를 `git clone`으로 가져온다
2. 위 **HANDOFF.md**를 프로젝트 루트에 생성한다
3. **CLAUDE.md**가 없으면 생성하고, 있으면 맨 밑에 "파일 1" 내용을 추가한다
4. `docs/build-logs/` 디렉토리를 생성한다: `mkdir -p docs/build-logs`
5. GStack, GSD, Superpowers는 `~/.claude/`에 글로벌 설치되어 있으므로 프로젝트별 설치 불필요
6. `git add . && git commit -m "docs: 워크플로우 및 핸드오프 프로토콜 설정" && git push`
