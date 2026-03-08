# 발음 시각화 이미지 생성 프롬프트 (전 15개 viseme 완전판)
# 나노바나나프로 / Midjourney / DALL-E 등에서 사용

---

## 체크리스트: 15개 Viseme 목록

생성 전 이 목록으로 빠진 것이 없는지 반드시 확인하세요.

| # | Viseme ID | 해당 음소 | 입모양 핵심 | 정면 | 단면 |
|---|-----------|----------|-----------|:---:|:---:|
| 0 | rest | (쉬는 상태) | 입 자연스럽게 다문 상태 | □ | □ |
| 1 | bilabial | p, b, m | 두 입술 꽉 닫힘 | □ | □ |
| 2 | labiodental | f, v | 윗니가 아랫입술에 닿음 | □ | □ |
| 3 | dental | th (θ, ð) | 혀끝이 윗니 사이로 나옴 | □ | □ |
| 4 | alveolar_stop | t, d, n, l | 혀끝이 윗잇몸에 닿음 | □ | □ |
| 5 | alveolar_fric | s, z | 이빨 살짝 보이고 좁은 틈 | □ | □ |
| 6 | postalveolar | sh, ch, j, zh | 입술을 앞으로 살짝 모음 | □ | □ |
| 7 | velar | k, g, ng | 입 벌리고 혀 뒤쪽 올림 | □ | □ |
| 8 | glottal | h | 입 벌리고 숨 내쉬기 | □ | □ |
| 9 | open_front | æ (cat의 a) | 입 크게 벌림, 혀 낮게 | □ | □ |
| 10 | mid_front | ɛ (bed의 e) | 입 중간 벌림 | □ | □ |
| 11 | close_front | iː, ɪ (bee, bit) | 입꼬리 옆으로, 좁게 | □ | □ |
| 12 | open_back | ɒ, ɑː (hot, car) | 입 크게+둥글게 | □ | □ |
| 13 | close_back | uː, ʊ (blue, book) | 입 동그랗게 오므림 | □ | □ |
| 14 | mid_central | ʌ, ə (cup, about) | 입 자연스럽게 살짝 벌림 | □ | □ |

**총 필요 이미지: 정면 15장 + 단면 15장 = 30장**

---

## Part A: 정면 뷰 (Front View) — 15장

### 공통 스타일 프롬프트 (모든 정면 이미지에 공통 적용)

```
A cute Korean elementary school girl (age 8-9) with short black hair 
and round cheeks. Close-up shot showing only from nose tip to chin. 
Soft warm studio lighting, clean white background. 
Realistic illustration style (not cartoon, not photorealistic — 
halfway between, like a high-quality educational textbook illustration).
Skin tone is warm and healthy. No makeup. Friendly and approachable look.
Focus on mouth, lips, teeth clearly visible.
High resolution, consistent art style across all images.
Square format 512x512px.
```

### 개별 프롬프트 (공통 스타일 뒤에 붙여서 사용)

**#0 rest (쉬는 상태)**
```
[공통 스타일] +
Mouth naturally closed, lips gently together, relaxed expression. 
Slight natural smile. Teeth not visible. 
This is the neutral/idle state.
Label: "rest"
```

**#1 bilabial (p, b, m)**
```
[공통 스타일] +
Both lips pressed firmly together, slightly puffed out. 
Lips are sealed shut with slight tension. Teeth not visible.
Like the moment just before saying "pa" or "ba" or humming "mmm".
Label: "bilabial p/b/m"
```

**#2 labiodental (f, v)**
```
[공통 스타일] +
Upper front teeth gently biting/touching the lower lip. 
Lower lip is pulled slightly inward under the upper teeth.
Mouth is slightly open on the sides. 
Like saying "fff" or "vvv".
Label: "labiodental f/v"
```

**#3 dental (th: θ, ð)**
```
[공통 스타일] +
Tongue tip clearly visible between upper and lower front teeth.
The tongue is sticking out slightly between the teeth.
Mouth is slightly open. Both upper and lower teeth visible.
This is the most distinctive mouth shape — the tongue MUST be visible 
poking out between the teeth.
Like saying "th" in "think" or "this".
Label: "dental th"
```

**#4 alveolar_stop (t, d, n, l)**
```
[공통 스타일] +
Mouth slightly open (about 1cm gap between teeth).
Tongue tip is raised and touching just behind the upper front teeth 
(the gum ridge), partially visible through the slightly open mouth.
Upper and lower teeth visible with small gap.
Like the moment of saying "t" or "d" or "n".
Label: "alveolar t/d/n/l"
```

**#5 alveolar_fric (s, z)**
```
[공통 스타일] +
Teeth are close together with a very narrow gap between upper and 
lower teeth (almost touching but not quite).
Lips are slightly pulled back showing the front teeth clearly.
A narrow slit between the teeth for air to pass through.
Like saying "sss" or "zzz" — a hissing position.
Label: "alveolar s/z"
```

**#6 postalveolar (sh, ch, j)**
```
[공통 스타일] +
Lips pushed forward and slightly rounded (like a soft kiss shape 
but with teeth slightly apart). Lips are protruding outward.
Small round opening between the lips.
Like saying "shh" or "ch" — lips puckered forward.
Label: "postalveolar sh/ch"
```

**#7 velar (k, g, ng)**
```
[공통 스타일] +
Mouth open moderately wide. Jaw dropped.
Tongue is pulled back (not visible at the front).
The back of the mouth/throat area is slightly visible.
Upper and lower teeth clearly visible with medium gap.
Like the moment of saying "k" or "g" with mouth open.
Label: "velar k/g/ng"
```

**#8 glottal (h)**
```
[공통 스타일] +
Mouth wide open in a relaxed way, like breathing out.
Jaw dropped naturally. Tongue flat and relaxed at bottom of mouth.
Wide opening showing teeth and some of the inside of the mouth.
Like saying "haaah" — exhaling with mouth open.
Label: "glottal h"
```

**#9 open_front (æ — cat, bat)**
```
[공통 스타일] +
Mouth VERY wide open. Jaw dropped as far as comfortable.
Tongue is low and flat, visible at the bottom of the mouth.
Lips are spread (not rounded). Very large opening.
This is the widest open mouth position of all vowels.
Like saying a very exaggerated "aaa" as in "cat".
Label: "open front /æ/"
```

**#10 mid_front (ɛ — bed, pet)**
```
[공통 스타일] +
Mouth open at a MEDIUM level — halfway between fully open and 
the smile position. Jaw moderately dropped.
Lips are slightly spread (not rounded).
Tongue is at mid-height in the mouth.
Like saying "eh" as in "bed" — not as wide as "cat" but wider than "bee".
Label: "mid front /ɛ/"
```

**#11 close_front (iː, ɪ — bee, bit)**
```
[공통 스타일] +
Lips pulled back into a WIDE SMILE shape. 
Mouth opening is narrow/small — teeth close together.
Corners of lips pulled to the sides (like smiling).
Upper and lower teeth visible but close together.
Like saying "eee" — a big smile shape.
Label: "close front /i/"
```

**#12 open_back (ɒ, ɑː — hot, car)**
```
[공통 스타일] +
Mouth wide open AND lips ROUNDED into an O shape.
Jaw dropped significantly. Lips form a large round circle.
Tongue is low and pulled back.
Like saying "oh" or "ah" with rounded lips — doctor says "say aaah".
Label: "open back /ɒ/"
```

**#13 close_back (uː, ʊ — blue, book)**
```
[공통 스타일] +
Lips pushed FORWARD and tightly ROUNDED into a small circle.
Very small round opening. Lips are protruding (duck lips shape).
This is the most rounded and forward lip position.
Like saying "ooo" — very tight round lips pushed out.
Label: "close back /u/"
```

**#14 mid_central (ʌ, ə — cup, about)**
```
[공통 스타일] +
Mouth naturally slightly open. Very relaxed, neutral position.
Lips are not spread and not rounded — just natural.
Small opening, jaw slightly dropped.
Like saying a lazy "uh" — the most relaxed vowel sound.
This looks similar to rest but with mouth slightly more open.
Label: "mid central /ʌ/"
```

---

## Part B: 단면 뷰 (Cross-Section / Sagittal View) — 15장

### 공통 스타일 프롬프트 (모든 단면 이미지에 공통 적용)

```
Educational medical illustration, sagittal cross-section view of 
a child's mouth and throat area (side view, cut in half).
Clean, simple, child-friendly illustration style.
Warm pastel colors on white background.
Clearly showing: upper palate (roof of mouth) in light pink, 
lower jaw in light beige, teeth in white, 
tongue highlighted in soft red/coral color, 
lips in natural pink, nasal cavity lightly outlined above.
Simple and not scary — designed for 8-year-old children.
Key areas labeled with clean sans-serif font.
Consistent style across all 15 images.
Square format 512x512px.
```

### 개별 프롬프트 (공통 스타일 뒤에 붙여서 사용)

**#0 rest (쉬는 상태)**
```
[공통 스타일] +
Cross-section showing relaxed mouth. Tongue lying flat and relaxed 
at the bottom of the mouth. Lips gently closed. 
Jaw in natural closed position. No airflow arrows.
Label: "rest — 편안한 상태"
```

**#1 bilabial (p, b, m)**
```
[공통 스타일] +
Cross-section showing both lips pressed firmly together (lips sealed).
Tongue is relaxed at bottom of mouth. 
Small blue arrow showing air pressure building behind closed lips.
Highlight: LIPS area glowing/emphasized.
Label: "bilabial — 입술을 꽉!"
```

**#2 labiodental (f, v)**
```
[공통 스타일] +
Cross-section showing upper front teeth touching the lower lip.
Lower lip is curled slightly inward under the upper teeth.
Tongue is relaxed. Small blue arrow showing air flowing out 
between teeth and lower lip.
Highlight: where upper teeth meet lower lip.
Label: "labiodental — 윗니+아랫입술"
```

**#3 dental (th: θ, ð)**
```
[공통 스타일] +
Cross-section showing tongue tip EXTENDING FORWARD between upper 
and lower front teeth. The tongue tip is sticking out past the teeth.
This is the most important detail — tongue must be clearly between 
the teeth. Small blue arrow showing air flowing over the tongue tip.
Highlight: tongue tip between teeth (bright red emphasis).
Label: "dental th — 혀가 이빨 사이로!"
```

**#4 alveolar_stop (t, d, n, l)**
```
[공통 스타일] +
Cross-section showing tongue tip pressed firmly against the 
alveolar ridge (the bumpy gum ridge just behind the upper front teeth).
A small dot or star marking the exact contact point on the ridge.
Mouth slightly open. Air is blocked by tongue touching ridge.
Highlight: tongue tip touching alveolar ridge.
Label: "alveolar — 혀끝이 잇몸에 톡!"
```

**#5 alveolar_fric (s, z)**
```
[공통 스타일] +
Cross-section showing tongue tip raised CLOSE TO (but not touching) 
the alveolar ridge, creating a narrow groove/channel.
Small blue arrows showing air streaming through the narrow gap 
between tongue tip and ridge, then out between nearly-closed teeth.
Teeth are very close together.
Highlight: narrow gap between tongue and ridge.
Label: "alveolar fricative — 바람이 쓰~"
```

**#6 postalveolar (sh, ch, j)**
```
[공통 스타일] +
Cross-section showing the front part of the tongue (blade, not tip) 
raised toward the area just behind the alveolar ridge (post-alveolar).
Tongue is broader and flatter than alveolar position.
Lips are pushed forward (visible in the cross-section as protruding).
Blue arrow showing air flowing over the raised tongue blade.
Highlight: tongue blade raised behind ridge + lips pushed forward.
Label: "postalveolar — 혀를 넓게 올리고 입술 모아!"
```

**#7 velar (k, g, ng)**
```
[공통 스타일] +
Cross-section showing the BACK of the tongue raised up to touch 
the soft palate (velum) — the soft area at the back of the roof 
of the mouth. Tongue tip is LOW and relaxed at front.
The back hump of the tongue is clearly touching the velum.
Mouth is moderately open.
Highlight: back of tongue touching soft palate.
Label: "velar — 혀 뒤쪽이 올라가요!"
```

**#8 glottal (h)**
```
[공통 스타일] +
Cross-section showing mouth wide open, tongue flat and relaxed.
The key feature: blue arrows showing air flowing freely from 
the throat/glottis area upward and out through the open mouth.
No obstruction anywhere in the mouth. Open airway.
Highlight: throat area with airflow arrows.
Label: "glottal h — 목에서 하~ 숨!"
```

**#9 open_front (æ — cat)**
```
[공통 스타일] +
Cross-section showing jaw dropped very low (wide open mouth).
Tongue is LOW and positioned toward the FRONT of the mouth.
Tongue is flat and spread. Large oral cavity space visible.
Lips are spread wide (not rounded).
Highlight: tongue low+front position, large open space.
Label: "open front /æ/ — 입 크게! 혀는 낮게 앞으로!"
```

**#10 mid_front (ɛ — bed)**
```
[공통 스타일] +
Cross-section showing jaw moderately open (medium opening).
Tongue is at MID HEIGHT and positioned toward the FRONT.
Tongue is higher than /æ/ but lower than /i/.
Medium oral cavity space.
Highlight: tongue at mid-height, front position.
Label: "mid front /ɛ/ — 입 반쯤, 혀는 중간 앞"
```

**#11 close_front (iː — bee)**
```
[공통 스타일] +
Cross-section showing jaw nearly closed (small opening).
Tongue is HIGH and positioned toward the FRONT of the mouth.
Tongue is arched up close to the hard palate (roof of mouth) 
but not touching. Very small space between tongue and palate.
Lips are spread (smile shape visible in cross-section).
Highlight: tongue high+front, close to palate.
Label: "close front /i/ — 혀를 높이! 앞으로!"
```

**#12 open_back (ɒ — hot)**
```
[공통 스타일] +
Cross-section showing jaw dropped low (wide open).
Tongue is LOW and positioned toward the BACK of the mouth.
Tongue is pulled back compared to /æ/.
Lips are rounded (visible as protruding slightly in cross-section).
Large oral cavity space.
Highlight: tongue low+back position, rounded lips.
Label: "open back /ɒ/ — 입 크게 동그랗게! 혀는 뒤로!"
```

**#13 close_back (uː — blue)**
```
[공통 스타일] +
Cross-section showing jaw nearly closed.
Tongue is HIGH and positioned toward the BACK of the mouth.
Back of tongue is arched up toward the soft palate.
Lips are tightly ROUNDED and pushed FORWARD 
(clearly protruding in the cross-section).
Very small oral cavity space.
Highlight: tongue high+back, lips rounded+forward.
Label: "close back /u/ — 혀를 높이 뒤로! 입술 쭈~욱!"
```

**#14 mid_central (ʌ — cup)**
```
[공통 스타일] +
Cross-section showing jaw slightly open (relaxed, neutral).
Tongue is at MID HEIGHT in the CENTER of the mouth.
Not particularly front or back — most neutral tongue position.
Lips are neutral (not spread, not rounded).
Moderate oral cavity space.
This is the most relaxed, natural vowel position.
Highlight: tongue in neutral center position.
Label: "mid central /ʌ/ — 편하게~ 혀는 가운데"
```

---

## Part C: 생성 팁

### 일관된 스타일을 유지하려면

1. **정면 뷰 15장을 먼저 한 번에 생성** — 첫 번째 좋은 결과물을 "참조 이미지"로 고정하고 나머지를 같은 스타일로
2. **단면 뷰 15장은 별도 세션에서** — 정면과 완전히 다른 스타일이므로 분리
3. **각 이미지를 개별 생성 후 수동 확인** — 혀 위치가 정확한지 체크리스트로 대조

### 생성 후 파일 이름 규칙

```
public/assets/mouth/
├── front/
│   ├── 00_rest.png
│   ├── 01_bilabial.png
│   ├── 02_labiodental.png
│   ├── 03_dental.png
│   ├── 04_alveolar_stop.png
│   ├── 05_alveolar_fric.png
│   ├── 06_postalveolar.png
│   ├── 07_velar.png
│   ├── 08_glottal.png
│   ├── 09_open_front.png
│   ├── 10_mid_front.png
│   ├── 11_close_front.png
│   ├── 12_open_back.png
│   ├── 13_close_back.png
│   └── 14_mid_central.png
└── cross/
    ├── 00_rest.png
    ├── 01_bilabial.png
    ├── 02_labiodental.png
    ├── 03_dental.png
    ├── 04_alveolar_stop.png
    ├── 05_alveolar_fric.png
    ├── 06_postalveolar.png
    ├── 07_velar.png
    ├── 08_glottal.png
    ├── 09_open_front.png
    ├── 10_mid_front.png
    ├── 11_close_front.png
    ├── 12_open_back.png
    ├── 13_close_back.png
    └── 14_mid_central.png
```

### 품질 체크리스트 (생성 후 확인)

정면 뷰:
- [ ] 15장 모두 같은 아이 얼굴인가?
- [ ] 피부톤, 조명, 화각이 일관되는가?
- [ ] 각 viseme의 입모양 차이가 명확히 구분되는가?
- [ ] #3 dental — 혀가 이빨 사이로 확실히 보이는가?
- [ ] #6 postalveolar — 입술이 앞으로 나온 게 보이는가?
- [ ] #11 close_front — 웃는 입 모양(입꼬리 옆으로)인가?
- [ ] #13 close_back — 입이 동그랗게 작게 오므려졌는가?
- [ ] #9 open_front vs #12 open_back — 둘 다 크게 벌렸지만 #12만 둥근 게 구분되는가?

단면 뷰:
- [ ] 15장 모두 같은 일러스트 스타일인가?
- [ ] 혀 위치가 각 viseme 설명과 정확히 일치하는가?
- [ ] #3 dental — 혀끝이 이빨 사이로 나와 있는가?
- [ ] #7 velar — 혀 뒷부분이 연구개에 닿아 있는가?
- [ ] #11 close_front vs #13 close_back — 혀가 앞 vs 뒤로 확실히 구분되는가?
- [ ] 공기 흐름 화살표가 적절히 표시되어 있는가?
- [ ] 아이가 봤을 때 무섭지 않은 톤인가?
