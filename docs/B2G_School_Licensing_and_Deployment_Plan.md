# 🏫 Phonics 300: B2G 학교 단위 라이선스 및 배포 가이드라인 (Stage 4)

본 문서는 학교 현장(B2G/B2B) 도입을 위한 라이선스 관리 체계, 학생 기기 보안(Device Lock), 그리고 학습자 진급/졸업에 따른 **'시트(Seat) 재사용'** 메커니즘을 포함한 최종 배포 실행 계획을 정의합니다.

---

## 📅 1. 라이선스 수명 주기 (3개년 유효)

### 1.1 유효 기간 정책
*   **기간**: 각 학교 라이선스는 생성일로부터 **36개월(3년)** 동안 유효합니다.
*   **만료 처리**: 유효기간 만료 시 교사용 대시보드와 학생 학습 데이터 동기화 기능이 정지되며, 연장(Renewal) 절차가 필요합니다.
*   **로직**: Supabase `licenses` 테이블의 `expires_at` 필드가 현재 날짜와 비교되어 접근 권한을 제어합니다.

---

## 🔒 2. 학생 기기 락 (Device Lock) & 보안

### 2.1 기기 고유 식별 (Pinning)
*   **UUID 연동**: 학생이 처음 `class_code`로 등록할 때, 해당 기기의 고유 ID(`device_id`)를 서버에 영구 기록합니다.
*   **중복 접속 차단**: 동일한 학생 계정으로 다른 기기에서 로그인을 시도할 경우 자동으로 차단되어 1인 1기기 원칙을 준수합니다.
*   **데이터 보호**: 분실이나 기기 교체 시에는 교사가 대시보드에서 '기기 초기화(Device Unlink)'를 수행해야 새로운 기기 등록이 가능합니다.

---

## ♻️ 3. 라이선스 시트 회수 및 재사용 (Seat Recycling)

### 3.1 유동적 시트 관리 구조
학교는 고정된 인원(예: 100명분)의 라이선스를 구매하며, 이 인원수는 **'동시 활성 학생 수'**를 의미합니다.

*   **시트 점유 (Active)**: 학생이 등록되면 `student_profiles`의 `is_active`가 `true`가 되며 라이선스 수량이 차감됩니다.
*   **시트 회수 (Release)**: 학생이 졸업하거나 학년이 올라가 더 이상 앱을 사용하지 않게 되면, 교사가 대시보드에서 해당 학생을 **'비활성(Deactivate)'** 처리합니다.
*   **시트 재사용 (Reactivation)**: 비활성 처리 즉시 라이선스 여유분이 생기며, 새로운 신입생이나 다른 학생이 그 코드를 활용하여 등록할 수 있습니다.
*   **데이터 보존**: 비활성된 학생의 과거 학습 로그(`lesson_logs`)는 DB에 보존되어 통계용으로 활용 가능하며, 필요 시 다시 활성화할 수 있습니다.

---

## 🛠️ 4. 시스템 아키텍처 (SQL Schema)

### 4.1 핵심 테이블 설계 방향
1.  **`licenses`**: `id`, `school_name`, `license_key`, `max_seats`, `used_seats`, `expires_at`, `created_at`
2.  **`teacher_profiles`**: `id`, `license_id`, `email`, `display_name`, `class_code`
3.  **`student_profiles`**: `id`, `class_code`, `device_id`, `nickname`, `is_active` (T/F), `last_active`

---

## 🚀 5. 하이브리드 작업 로드맵 (Execution Plan)

### Phase 1: 인프라 및 보안 구축 (Antigravity 위주)
*   **[DB]**: 3년 유효기간과 시트 카운팅이 포함된 Supabase SQL 스키마 및 RLS(보안 정책) 작성.
*   **[API]**: `joinClassWithCode` 함수를 수정하여 수량 초과 시 가입 차단 로직 구현.

### Phase 2: 대시보드 및 시트 관리 (Claude Code 위주)
*   **[Dash]**: 교사용 대시보드에 현재 라이선스 잔여 인원(Used/Total) 표시 위젯 추가.
*   **[Logic]**: 학생 목록에서 '학급 제외/시트 회수' 버튼 구현 및 DB 연동 테스트.

### Phase 3: 최종 빌드 및 검수 (Hybrid)
*   **[Android]**: 안드로이드 빌드용 `npx cap sync` 및 APK 무결성 검사.
*   **[Manual]**: 실제 기기 2대에서 '기기 락' 작동 여부 교차 검증.

---

## 📌 다음 단계 (Immediate Actions)

1.  **계획 확정**: 위 시트 재사용 및 3년 유효기간 로직이 사용자님의 비즈니스 모델과 일치하는지 최종 확인 부탁드립니다.
2.  **DB 스키마 생성**: 승인 시 즉시 **`docs/supabase/setup_v2_licensing.sql`** 파일을 작성하여 제공하겠습니다.
