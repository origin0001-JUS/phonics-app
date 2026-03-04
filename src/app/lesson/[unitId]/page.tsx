import { curriculum } from "@/data/curriculum";
import LessonPage from "./LessonClient";

export function generateStaticParams() {
    return curriculum.map((unit) => ({ unitId: unit.id }));
}

export default function LessonPageWrapper() {
    return <LessonPage />;
}
