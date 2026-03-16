// 통합 Decodable Story 데이터 (Round 5 리뉴얼)
// 각 유닛별 일관된 주인공과 연결된 스토리라인 + 한국어 번역

export interface DecodableStoryPage {
  text: string;
  translation: string;
}

export const DECODABLE_STORIES: Record<string, DecodableStoryPage[]> = {
  unit_01: [
    { text: "A fat cat sat on a mat.", translation: "뚱뚱한 고양이가 매트 위에 앉았어요." },
    { text: "The cat had a nap.", translation: "고양이가 낮잠을 잤어요." },
    { text: "A rat ran to the mat.", translation: "쥐 한 마리가 매트로 달려왔어요." },
    { text: "The cat and the rat sat.", translation: "고양이와 쥐가 함께 앉았어요." },
    { text: "The cat has a cap and a bag.", translation: "고양이는 모자와 가방이 있어요." },
    { text: "The fat cat ran to Dad!", translation: "뚱뚱한 고양이가 아빠에게 달려갔어요!" },
  ],
  unit_02: [
    { text: "A red hen is in a pen.", translation: "빨간 암탉이 우리 안에 있어요." },
    { text: "The hen sees a red bed.", translation: "암탉이 빨간 침대를 보았어요." },
    { text: "A net is on the bed.", translation: "그물이 침대 위에 있어요." },
    { text: "The hen got completely wet.", translation: "암탉이 흠뻑 젖었어요." },
    { text: "Ten men met the hen.", translation: "열 명의 남자들이 암탉을 만났어요." },
    { text: "The red hen is in bed.", translation: "빨간 암탉이 침대에 누워있어요." },
  ],
  unit_03: [
    { text: "A huge pig is very big.", translation: "거대한 돼지는 정말 커요." },
    { text: "The pig did a funny jig.", translation: "돼지가 우스꽝스러운 춤을 췄어요." },
    { text: "It hid in a deep pit.", translation: "돼지가 깊은 구덩이에 숨었어요." },
    { text: "A kid bit a sweet fig.", translation: "아이가 달콤한 무화과를 베어 물었어요." },
    { text: "The pig and the kid sit.", translation: "돼지와 아이가 나란히 앉아있어요." },
    { text: "It is a fast big pig!", translation: "정말 빠르고 큰 돼지네요!" },
  ],
  unit_04: [
    { text: "A dog got a hot dog.", translation: "개가 핫도그를 얻었어요." },
    { text: "A fox hid in a box.", translation: "여우가 상자 안에 숨었어요." },
    { text: "The dog ran to the top.", translation: "개가 꼭대기로 달려갔어요." },
    { text: "Mom has a cooking pot.", translation: "엄마에게 요리 냄비가 있어요." },
    { text: "The dog and fox hop and hop.", translation: "개와 여우가 깡충깡충 뛰어요." },
    { text: "The dog is sleeping well.", translation: "개가 아주 잘 자고 있어요." },
  ],
  unit_05: [
    { text: "A red hen is in a pen.", translation: "빨간 닭이 우리 안에 있어요." },
    { text: "The hen is very silly.", translation: "그 닭은 아주 장난꾸러기예요." },
    { text: "A fishing net is on the bed.", translation: "물고기 그물이 침대 위에 있어요." },
    { text: "The hen got very wet.", translation: "닭이 아주 많이 젖었어요." },
    { text: "Ten men met the wet hen.", translation: "열 명의 사람들이 젖은 닭을 만났어요." },
    { text: "The red hen is in bed.", translation: "빨간 닭은 침대에 있어요." },
  ],
  unit_07: [
    { text: "Kate can bake a cake.", translation: "케이트는 케이크를 구울 수 있어요." },
    { text: "She will take it to the lake.", translation: "그녀는 그것을 호수로 가져갈 거예요." },
    { text: "It is late at the gate.", translation: "문 앞은 늦은 시간이에요." },
    { text: "Dave gave Kate a red cape.", translation: "데이브가 케이트에게 빨간 망토를 주었어요." },
    { text: "Kate and Dave had a race!", translation: "케이트와 데이브가 달리기 경주를 했어요!" },
    { text: "What a great game together!", translation: "정말 멋진 게임이었어요!" },
  ],
};
