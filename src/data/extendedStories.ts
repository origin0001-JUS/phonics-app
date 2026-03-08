// Extended decodable stories from phonics300_upgrade_data.json
// Source: extended_stories field (V2 upgrade data, 5-8 sentences per unit)
// These stories replace/extend the microReading content for units that have them.
// Units not listed here fall back to the hardcoded DECODABLE_STORIES in StoryReaderStep.

export const EXTENDED_STORIES: Record<string, string[]> = {
    unit_01: [
        "A cat sat on a mat.",
        "The cat had a nap.",
        "A rat ran to the mat.",
        "The cat and the rat sat.",
        "The cat has a cap and a bag.",
        "Dad has a map.",
        "The fat cat ran to Dad!",
    ],
    unit_04: [
        "A dog got a hot dog.",
        "The fox hid in a box.",
        "The dog ran to the top.",
        "Mom has a pot. It is hot!",
        "The dog and the fox hop and hop.",
    ],
    unit_07: [
        "Kate can bake a cake.",
        "She will take the cake to the lake.",
        "It is late. Kate came to the gate.",
        "Dave gave Kate a cape.",
        "Kate and Dave had a race!",
        "What a great game!",
    ],
    unit_08: [
        "Mike has a bike.",
        "He can ride and hike.",
        "He hid a kite by the pine.",
        "It is time to fly the kite!",
        "Five kites in a line.",
        "Mike had the time of his life!",
    ],
};
