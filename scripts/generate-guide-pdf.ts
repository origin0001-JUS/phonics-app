import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const GUIDE_DIR = path.resolve(__dirname, '../docs/student-guide');
const SCREENSHOT_DIR = path.join(GUIDE_DIR, 'screenshots');
const OUTPUT_PDF = path.join(GUIDE_DIR, 'Phonics300_학생용_가이드.pdf');
const OUTPUT_HTML = path.join(GUIDE_DIR, 'guide.html');

function imgToDataUri(filename: string): string {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  if (!fs.existsSync(filepath)) return '';
  const buf = fs.readFileSync(filepath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', sans-serif; color: #2d3748; font-size: 13px; line-height: 1.5; }

  .page {
    width: 210mm; height: 297mm;
    padding: 12mm 14mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    page-break-inside: avoid;
  }
  .page:last-child { page-break-after: auto; }

  .cover {
    width: 210mm; height: 297mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, #8fdfff 0%, #d8f4ff 60%, #a3da61 100%);
    text-align: center;
    page-break-after: always;
  }
  .cover h1 { font-size: 44px; font-weight: 900; color: #1a365d; margin-bottom: 6px; }
  .cover .subtitle { font-size: 22px; color: #2b6cb0; margin-bottom: 36px; }
  .cover .badge { background: #fcd34d; color: #744210; padding: 12px 32px; border-radius: 999px; font-size: 18px; font-weight: 700; border: 3px solid #d69e2e; }
  .cover .small { margin-top: 36px; color: #4a5568; font-size: 14px; }

  h2 { font-size: 20px; font-weight: 900; color: #2b6cb0; border-bottom: 3px solid #bee3f8; padding-bottom: 6px; margin-bottom: 10px; }
  h3 { font-size: 14px; font-weight: 700; color: #2c5282; margin: 6px 0 4px; }

  .step-header {
    background: linear-gradient(135deg, #ebf8ff, #e9d8fd);
    padding: 10px 16px; border-radius: 10px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 10px;
  }
  .step-num {
    background: #5a67d8; color: white; width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 16px; flex-shrink: 0;
  }
  .step-title { font-size: 18px; font-weight: 900; color: #2d3748; }
  .step-title-sub { font-size: 12px; color: #718096; font-weight: 400; }

  .two-col { display: flex; gap: 16px; align-items: flex-start; }
  .two-col .text { flex: 1; }
  .two-col .img { flex: 0 0 220px; text-align: center; }
  .two-col .img img { max-width: 220px; max-height: 280px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.12); border: 2px solid #e2e8f0; }

  .info-box {
    background: #f0fff4; border-left: 4px solid #38a169;
    padding: 6px 12px; border-radius: 0 8px 8px 0; margin: 6px 0; font-size: 12px;
  }
  .info-box.yellow { background: #fffff0; border-left-color: #d69e2e; }
  .info-box.blue { background: #ebf8ff; border-left-color: #3182ce; }
  .info-box strong { font-weight: 700; }

  ol, ul { padding-left: 20px; margin: 4px 0; }
  li { margin: 2px 0; font-size: 13px; }

  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 12px; }
  th { background: #ebf8ff; padding: 6px 10px; text-align: left; font-weight: 700; border: 1px solid #bee3f8; }
  td { padding: 6px 10px; border: 1px solid #e2e8f0; }

  .tip-box {
    background: linear-gradient(135deg, #fefcbf, #fef3c7);
    border: 2px solid #ecc94b; border-radius: 12px; padding: 12px 16px; margin: 10px 0;
  }
  .tip-box h3 { color: #975a16; margin-top: 0; font-size: 14px; }
  .tip-box li { color: #744210; font-size: 12px; }

  .footer { text-align: center; color: #a0aec0; font-size: 10px; position: absolute; bottom: 8mm; left: 0; right: 0; }

  /* Half-page section divider */
  .half { height: 131mm; overflow: hidden; }
  .divider { border-top: 2px dashed #e2e8f0; margin: 6px 0; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>Phonics 300</h1>
  <div class="subtitle">소리로 읽는 영어 300</div>
  <div class="badge">학생용 이용 가이드</div>
  <p class="small">초등학생을 위한 파닉스 학습 앱 사용법</p>
</div>

<!-- PAGE 1: 앱 시작 + 유닛 선택 -->
<div class="page">
  <div class="half">
    <h2>1. 앱 시작하기 (앱 활성화)</h2>
    <div class="two-col">
      <div class="text">
        <p>앱을 처음 열면 <strong>앱 활성화</strong> 화면이 나타납니다.</p>
        <h3>이렇게 해요:</h3>
        <ol>
          <li><strong>내 이름 (닉네임)</strong> 칸에 이름을 입력해요</li>
          <li><strong>선생님 연결코드</strong> 칸에 선생님이 알려준 코드를 입력해요</li>
          <li><strong>"시작하기!"</strong> 버튼을 눌러요</li>
        </ol>
        <div class="info-box yellow">
          <strong>중요!</strong> 연결코드는 선생님께서 알려주신 코드예요. 모르겠으면 선생님께 여쭤보세요!
        </div>
      </div>
      <div class="img"><img src="${imgToDataUri('01_onboarding_welcome.png')}" alt="앱 활성화"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <h2>2. 유닛 선택하기</h2>
    <div class="two-col">
      <div class="text">
        <p>활성화가 끝나면 <strong>유닛 선택</strong> 화면으로 이동합니다.</p>
        <ul>
          <li>색깔 카드를 눌러서 배울 유닛을 선택해요</li>
          <li>자물쇠가 있는 유닛은 아직 잠겨 있어요</li>
          <li>앞 유닛을 먼저 완료하면 열려요!</li>
        </ul>
        <table>
          <tr><th>유닛</th><th>주제</th><th>예시</th></tr>
          <tr><td>1~5</td><td>짧은 모음 (Short Vowels)</td><td>cat, bed, pig</td></tr>
          <tr><td>7~11</td><td>긴 모음 / Magic e</td><td>cake, bike</td></tr>
          <tr><td>13~17</td><td>자음 조합 (Blends)</td><td>ship, block</td></tr>
          <tr><td>19~23</td><td>고급 패턴</td><td>bird, cloud</td></tr>
          <tr><td>25~30</td><td>L3: 자음군/이중자음</td><td>blend, chunk</td></tr>
          <tr><td>31~37</td><td>L4: 모음팀/이중모음</td><td>train, moon</td></tr>
          <tr><td>6,12,18,24</td><td>복습 유닛</td><td>구간별 총정리</td></tr>
        </table>
      </div>
      <div class="img"><img src="${imgToDataUri('05_units.png')}" alt="유닛 선택"></div>
    </div>
  </div>
  <div class="footer">2</div>
</div>

<!-- PAGE 2: Steps 1-2 -->
<div class="page">
  <h2>3. 레슨 진행하기 (약 10분)</h2>
  <p style="margin-bottom:6px; font-size:12px; color:#4a5568;">유닛을 선택하면 레슨이 시작돼요. 화면 위의 진행 바와 숫자(예: 2/8)로 현재 위치를 확인할 수 있어요.</p>
  <div class="half">
    <div class="step-header">
      <div class="step-num">1</div>
      <div><span class="step-title">Sound Focus</span> <span class="step-title-sub">소리 집중</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>오늘 배울 소리를 듣고 <strong>입 모양</strong>을 관찰해요.</p>
        <ol>
          <li><strong>입 모양 사진</strong>을 보면서 소리가 어떻게 나는지 확인해요</li>
          <li><strong>/æ/</strong> 같은 발음 기호를 눌러서 소리를 들어요</li>
          <li>아래 단어 카드(예: cat)를 눌러서 단어 발음도 들어봐요</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> 입 모양을 잘 보고 따라해 보세요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_01_sound_focus.png')}" alt="Sound Focus"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="step-header">
      <div class="step-num">2</div>
      <div><span class="step-title">Blend & Tap</span> <span class="step-title-sub">소리 합치기</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>글자를 하나씩 탭하면서 소리를 합쳐 단어를 만들어요.</p>
        <ol>
          <li>그림을 보고 어떤 단어인지 생각해요</li>
          <li>왼쪽 글자(<strong>c</strong>)와 오른쪽 글자(<strong>at</strong>)를 각각 탭해요</li>
          <li>두 소리가 합쳐져서 <strong>"cat"</strong>이 돼요!</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> "Tap both parts!" 가 나오면 두 부분을 모두 눌러야 해요.</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_02_blend_tap.png')}" alt="Blend & Tap"></div>
    </div>
  </div>
  <div class="footer">3</div>
</div>

<!-- PAGE 3: Steps 3-4 -->
<div class="page">
  <div class="half">
    <div class="step-header">
      <div class="step-num">3</div>
      <div><span class="step-title">Decode Words</span> <span class="step-title-sub">단어 해독</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>소리를 듣고 올바른 <strong>한국어 뜻</strong>을 골라요.</p>
        <ol>
          <li><strong>"Listen to sound"</strong> 버튼을 눌러서 영어 단어를 들어요</li>
          <li>4개의 한국어 뜻 중에서 맞는 것을 골라요</li>
          <li>맞추면 다음 문제로 넘어가요!</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> 잘 모르겠으면 소리를 여러 번 다시 들어보세요. 틀려도 괜찮아요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_03_decode_words.png')}" alt="Decode Words"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="step-header">
      <div class="step-num">4</div>
      <div><span class="step-title">Word Family Builder</span> <span class="step-title-sub">단어 가족 만들기</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>같은 끝소리(-at, -an 등)를 가진 단어들을 만들어요.</p>
        <ol>
          <li>노란 박스의 끝소리(예: <strong>-at</strong>)를 확인해요</li>
          <li>아래 글자 버튼(h, n, s, r, b, c...)을 하나 골라요</li>
          <li>선택한 글자 + 끝소리 = 진짜 단어면 정답!</li>
          <li>예: <strong>c + -at = cat</strong> (정답!)</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> "Built: 0/6" 숫자가 올라가도록 모든 단어를 찾아보세요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_04_word_family.png')}" alt="Word Family Builder"></div>
    </div>
  </div>
  <div class="footer">4</div>
</div>

<!-- PAGE 4: Steps 5-6 -->
<div class="page">
  <div class="half">
    <div class="step-header">
      <div class="step-num">5</div>
      <div><span class="step-title">Say & Check</span> <span class="step-title-sub">말하고 확인하기</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>단어를 직접 소리 내어 말하고, 발음을 확인해요.</p>
        <ol>
          <li>그림과 단어를 보고 어떻게 읽는지 생각해요</li>
          <li><strong>스피커 버튼</strong>을 눌러서 정확한 발음을 들어요</li>
          <li><strong>마이크 버튼</strong>을 눌러서 직접 따라 말해봐요</li>
          <li>아래 <strong>입 모양 사진</strong>을 보면서 따라해요</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> 부끄러워하지 마세요! 큰 소리로 따라 말하면 발음이 빨리 좋아져요.</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_05_say_check.png')}" alt="Say & Check"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="step-header">
      <div class="step-num">6</div>
      <div><span class="step-title">Micro Reader</span> <span class="step-title-sub">짧은 글 읽기</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>배운 단어가 들어간 <strong>짧은 문장</strong>을 읽어요.</p>
        <ol>
          <li>화면의 문장을 읽어봐요 (예: "A cat.")</li>
          <li><strong>"Tap to hear"</strong>를 눌러서 문장 발음을 들어요</li>
          <li><strong>"Next Sentence"</strong>를 눌러 다음 문장으로!</li>
        </ol>
        <div class="info-box"><strong>팁!</strong> 혼자 읽어본 다음에 소리를 들어보세요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_06_micro_reader.png')}" alt="Micro Reader"></div>
    </div>
  </div>
  <div class="footer">5</div>
</div>

<!-- PAGE 5: Steps 7-8 -->
<div class="page">
  <div class="half">
    <div class="step-header">
      <div class="step-num">7</div>
      <div><span class="step-title">Story Time</span> <span class="step-title-sub">이야기 시간</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>배운 단어로 만든 재미있는 이야기를 <strong>만화처럼</strong> 읽어요.</p>
        <ol>
          <li>그림과 문장을 함께 읽어요</li>
          <li><strong>"Tap to listen"</strong>을 눌러서 발음을 들어요</li>
          <li><strong>"Auto"</strong>: 자동 재생 / <strong>"해석"</strong>: 한국어 뜻</li>
          <li><strong>"Next Page"</strong>를 눌러 다음 페이지로!</li>
        </ol>
        <div class="info-box blue"><strong>참고:</strong> 모든 유닛에 이야기가 있는 건 아니에요.</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_07_exit_ticket.png')}" alt="Story Time"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="step-header">
      <div class="step-num">8</div>
      <div><span class="step-title">Exit Ticket</span> <span class="step-title-sub">마무리 퀴즈</span></div>
    </div>
    <div class="two-col">
      <div class="text">
        <p>오늘 배운 내용을 확인하는 <strong>마지막 퀴즈</strong>예요.</p>
        <ol>
          <li>한국어 뜻을 보고 (예: "고양이") 맞는 영어 단어를 골라요</li>
          <li>3개의 보기 중에서 정답을 선택해요</li>
          <li>총 3문제를 풀어요 (1/3 → 2/3 → 3/3)</li>
        </ol>
        <div class="info-box yellow"><strong>중요!</strong> 이 퀴즈 결과가 학습 기록에 저장돼요. 집중해서 풀어보세요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('step_08_results.png')}" alt="Exit Ticket"></div>
    </div>
  </div>
  <div class="footer">6</div>
</div>

<!-- PAGE 6: 복습 + 트로피 + 리포트 + 꿀팁 -->
<div class="page">
  <div class="half">
    <h2>4. 복습하기 (Review)</h2>
    <div class="two-col">
      <div class="text">
        <p>홈 화면에서 <strong>"복습"</strong> 버튼을 누르면 복습 카드가 나와요.</p>
        <ul>
          <li>이전에 배운 단어들이 카드로 나타나요</li>
          <li>기억이 잘 나는 단어는 덜 나오고, 어려운 단어는 더 자주 나와요</li>
          <li><strong>"All caught up!"</strong>이면 오늘 복습 완료!</li>
        </ul>
        <div class="info-box"><strong>팁!</strong> 매일 조금씩 복습하면 단어를 오래 기억할 수 있어요!</div>
      </div>
      <div class="img"><img src="${imgToDataUri('15_review.png')}" alt="복습"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <h2>5. 나의 트로피 (Rewards)</h2>
    <div class="two-col">
      <div class="text">
        <p>열심히 학습하면 <strong>트로피</strong>를 모을 수 있어요!</p>
        <table>
          <tr><th>조건</th><th>트로피</th></tr>
          <tr><td>첫 번째 레슨 완료</td><td>???</td></tr>
          <tr><td>단어 10/50/100개 습득</td><td>???</td></tr>
          <tr><td>유닛 1/5개 완료</td><td>???</td></tr>
        </table>
        <p style="color: #718096; font-size: 11px;">트로피는 총 10개! 이름은 직접 획득해야 알 수 있어요.</p>
      </div>
      <div class="img"><img src="${imgToDataUri('16_rewards.png')}" alt="트로피"></div>
    </div>
  </div>
  <div class="footer">7</div>
</div>

<!-- PAGE 7: 리포트 + 설정 + 꿀팁 -->
<div class="page">
  <div class="half">
    <h2>6. 학습 리포트 & 설정</h2>
    <div class="two-col">
      <div class="text">
        <h3>학습 리포트 (Report)</h3>
        <ul>
          <li>완료한 유닛 수, 습득한 단어 수, 학습 시간 확인</li>
          <li>CSV/PDF로 내보내기 가능 (선생님께 보여드릴 때!)</li>
        </ul>
        <h3>설정 (Settings)</h3>
        <ul>
          <li><strong>학년 변경</strong>: 내 학년을 바꿀 수 있어요</li>
          <li><strong>데이터 초기화</strong>: 처음부터 다시 시작 (주의!)</li>
          <li><strong>버전 정보</strong>: 앱 버전 확인</li>
        </ul>
      </div>
      <div class="img"><img src="${imgToDataUri('17_report.png')}" alt="리포트"></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="half">
    <div class="tip-box">
      <h3 style="font-size:18px;">꿀팁 모음</h3>
      <ol style="font-size:14px;">
        <li><strong>매일 10분!</strong> 하루에 한 유닛씩, 매일 꾸준히 하는 게 가장 중요해요</li>
        <li><strong>소리를 크게!</strong> 듣기만 하지 말고, 큰 소리로 따라 읽어보세요</li>
        <li><strong>복습은 필수!</strong> 홈 화면의 복습 버튼을 매일 확인해요</li>
        <li><strong>틀려도 괜찮아요!</strong> 틀린 단어는 복습에 자동으로 추가돼요</li>
        <li><strong>트로피를 모아요!</strong> 10개 트로피를 모두 모으는 것을 목표로!</li>
      </ol>
    </div>
    <p style="text-align:center; color:#a0aec0; font-size:11px; margin-top:20px;">
      Phonics 300 - 소리로 읽는 영어 300 | 학생용 이용 가이드 v1.0
    </p>
  </div>
  <div class="footer">8</div>
</div>

</body>
</html>`;

async function main() {
  fs.writeFileSync(OUTPUT_HTML, html, 'utf-8');
  console.log('✅ HTML generated');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });

  console.log('✅ PDF generated: ' + OUTPUT_PDF);
  await browser.close();
}

main().catch(console.error);
