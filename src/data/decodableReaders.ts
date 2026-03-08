export interface DecodableReaderTemplate {
    unitId: string;
    readerLength: number;
    allowedPatterns: string[];
    sightWordsAllowed: string[];
    storyBeats: {
        setup: string;
        conflict: string;
        resolution: string;
    };
}

export const decodableReaderTemplates: DecodableReaderTemplate[] = [
    {
        unitId: 'L1_U1', readerLength: 7,
        allowedPatterns: ['-at', '-an', '-ap', '-am'],
        sightWordsAllowed: ['a', 'the', 'is', 'on', 'and', 'it'],
        storyBeats: { setup: '주인공(cat/man)이 어딘가에 있는 상황', conflict: '물건(hat/map)을 잃어버리거나 새 동물(rat)을 만남', resolution: '찾거나 친구가 됨' },
    },
    {
        unitId: 'L1_U2', readerLength: 6,
        allowedPatterns: ['-it', '-ig', '-in', '-ip'],
        sightWordsAllowed: ['a', 'the', 'is', 'and', 'it', 'in'],
        storyBeats: { setup: '주인공(pig/kid)이 무언가를 하고 있음', conflict: '구덩이에 빠지거나 큰 것 발견', resolution: '도움을 받거나 스스로 해결' },
    },
    {
        unitId: 'L1_U3', readerLength: 6,
        allowedPatterns: ['-ot', '-og', '-op', '-ox'],
        sightWordsAllowed: ['a', 'the', 'is', 'on', 'and', 'it', 'not'],
        storyBeats: { setup: '동물(dog/fox)이 밖에 나옴', conflict: '뜨거운(hot) 것을 발견하거나 높은(top) 곳에 올라감', resolution: '안전하게 돌아옴' },
    },
    {
        unitId: 'L1_U4', readerLength: 6,
        allowedPatterns: ['-ut', '-ug', '-un', '-ub'],
        sightWordsAllowed: ['a', 'the', 'is', 'in', 'and', 'it'],
        storyBeats: { setup: '벌레(bug)나 강아지(pup)가 놀고 있음', conflict: '해(sun) 아래서 뛰다가(run) 더위', resolution: '물을 마시거나 그늘에서 쉼' },
    },
    {
        unitId: 'L1_U5', readerLength: 6,
        allowedPatterns: ['-et', '-en', '-ed', '-eg'],
        sightWordsAllowed: ['a', 'the', 'is', 'in', 'and', 'it', 'on'],
        storyBeats: { setup: '닭(hen)이 빨간(red) 뭔가를 발견', conflict: '그물(net)에 걸리거나 비에 젖음(wet)', resolution: '친구들(men)이 도와줌' },
    },
    {
        unitId: 'L2_U1', readerLength: 7,
        allowedPatterns: ['-ake', '-ame', '-ate', '-ave', '-ape'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'she', 'he'],
        storyBeats: { setup: 'Kate가 케이크(cake)를 만들거나 호수(lake)에 감', conflict: '늦게(late) 도착하거나 동굴(cave) 발견', resolution: '경주(race)에서 이기거나 파티를 즐김' },
    },
    {
        unitId: 'L2_U2', readerLength: 7,
        allowedPatterns: ['-ike', '-ine', '-ite', '-ive', '-ide'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'in'],
        storyBeats: { setup: 'Mike가 자전거(bike)를 타거나 연(kite)을 날림', conflict: '길을 잃거나(hide) 시간 부족(time)', resolution: '멋진 경험(dive/ride)' },
    },
    {
        unitId: 'L2_U3', readerLength: 7,
        allowedPatterns: ['-one', '-ose', '-ole', '-ome', '-ope', '-ube', '-ute'],
        sightWordsAllowed: ['a', 'the', 'is', 'to', 'and', 'I', 'my', 'he', 'she'],
        storyBeats: { setup: '집(home)에서 뼈(bone) 발견 또는 장미(rose)를 봄', conflict: '구멍(hole)에 빠지거나 밧줄(rope) 필요', resolution: '전화(phone)로 도움 또는 귀여운(cute) 동물 만남' },
    },
];

export function generateStoryPrompt(template: DecodableReaderTemplate): string {
    return `
다음 규칙에 따라 ${template.readerLength}문장짜리 영어 스토리를 만들어줘:

허용 단어 패턴: ${template.allowedPatterns.join(', ')}
허용 Sight Words: ${template.sightWordsAllowed.join(', ')}
위 패턴과 sight words에 해당하는 단어만 사용해. 다른 단어는 절대 사용하지 마.

스토리 구조:
- 1막 (${template.storyBeats.setup}): 1~2문장
- 2막 (${template.storyBeats.conflict}): 2~3문장
- 3막 (${template.storyBeats.resolution}): 1~2문장

문장은 짧고 단순하게. 아이가 혼자 읽을 수 있는 수준으로.
    `.trim();
}
