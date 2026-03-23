# CLAUDE_PROMPT 템플릿

> Antigravity에서 Claude Code에 작업을 요청할 때 이 템플릿을 사용하세요.
> 파일명: `CLAUDE_PROMPT_{작업명}.md`

---

## 작업 개요
- **작업명**: (예: V2-12_새기능)
- **요청자**: (Antigravity / Claude Web)
- **우선순위**: (긴급 / 보통 / 낮음)
- **예상 소요**: (예: 30분)

## 상세 요구사항
1. (구체적 작업 내용 1)
2. (구체적 작업 내용 2)
3. ...

## 관련 파일
- `src/...` — 수정 대상
- `docs/...` — 참고 문서

## 성공 기준 (필수)
- [ ] TypeScript 에러 없음: `npx tsc --noEmit` 통과
- [ ] 빌드 성공: `npm run build` 통과 (로그 → `docs/build-logs/YYYY-MM-DD.txt`)
- [ ] (기능별 확인 항목 추가)

## 완료 후 필수 행동
1. `npm run build` 실행 → 로그 저장
2. HANDOFF.md "최근 핸드오프" 섹션 업데이트
3. "누가 뭘 하고 있나"에서 Claude Code → [작업 완료]
4. `git add . && git commit -m "feat/fix/chore: 설명" && git push`
