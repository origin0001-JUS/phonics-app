# QA 라운드 5 계획서: Decodable Story 리뉴얼

> **기능명**: qa-round5
> **유형**: UI 리뉴얼 + 데이터 통합
> **우선순위**: 높음
> **날짜**: 2026-03-16
> **지시서**: [ROUND5_CLAUDE_PROMPT.md](../../ROUND5_CLAUDE_PROMPT.md)

---

## 1. 개요

베타 피드백 기반으로 Decodable Story(StoryTime) 기능을 전면 리뉴얼합니다.
기존 문제: 각 문장이 서로 연결되지 않고, 캐릭터가 일관적이지 않으며, 초보 학습자를 위한 번역 기능이 없음.

## 2. 요구사항

### 2.1 목표 1: 스토리 데이터 통합
**문제**: 스토리 데이터가 `extendedStories.ts`와 `StoryReaderStep.tsx` 내부 폴백 로직으로 분산됨.
**수정**:
- `src/data/decodableStories.ts` 신규 생성 — 통합 데이터 구조
- `DecodableStoryPage` 인터페이스: `text`(영어) + `translation`(한국어)
- Unit 1~5, 7에 대해 일관된 주인공과 연결된 스토리라인 제공
- `StoryReaderStep.tsx`에서 `EXTENDED_STORIES` 및 `DECODABLE_STORIES_FALLBACK` 제거
- 새 `DECODABLE_STORIES` 객체를 `unitId` 기준으로 import하여 사용

### 2.2 목표 2: 해석 도우미 툴팁 UI
**문제**: 영어 초보 학습자를 위한 번역 기능이 없음.
**수정**:
- "해석" 토글 버튼 추가 (Lightbulb 아이콘 + "해석" 텍스트)
- 클릭 시 현재 패널 문장의 한국어 번역을 말풍선 형태로 표시
- 패널 변경 시 자동으로 번역 숨김
- Framer Motion 애니메이션 (spring, 스케일+슬라이드)
- 앱의 아동 친화적 UI에 맞는 디자인 (amber 테마, 라운드 코너)

## 3. 구현 요약

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `src/data/decodableStories.ts` | 신규 생성 — 6개 유닛 통합 스토리 데이터 |
| `src/app/lesson/[unitId]/StoryReaderStep.tsx` | 전면 리뉴얼 — 새 데이터 연동 + 해석 도우미 UI |

### 주요 변경 사항
1. **DecodableStoryPage 인터페이스**: `{ text: string; translation: string }` 구조
2. **DECODABLE_STORIES 상수**: 6개 유닛 × 6문장 = 36개 스토리 페이지
3. **import 정리**: `extendedStories`, `decodableReaders` import 제거
4. **DECODABLE_STORIES_FALLBACK 제거**: StoryReaderStep 내부 폴백 데이터 삭제
5. **template 매핑 로직 제거**: `L?_U?` 형식 변환 불필요 (직접 unitId 키 사용)
6. **showTranslation 상태**: 패널별 번역 토글
7. **해석 버튼**: Lightbulb 아이콘, amber 활성 테마
8. **말풍선 UI**: 꼬리 달린 말풍선, spring 애니메이션

## 4. 테스트 체크리스트

- [ ] unit_01~05, unit_07에서 스토리 데이터가 올바르게 로드됨
- [ ] 카라오케 하이라이트가 정상 작동
- [ ] 해석 버튼 클릭 시 한국어 번역 말풍선 표시
- [ ] 패널 변경 시 번역 자동 숨김
- [ ] 자동 재생 모드 정상 작동
- [ ] 스토리 없는 유닛에서 폴백 UI 표시
- [ ] 빌드 에러 0
