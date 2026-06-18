export declare class CreateQuizDto {
    title: string;
    description?: string;
    instructions?: string;
    startDate: string;
    endDate: string;
    durationInMinutes: number;
    totalMarks: number;
    isPublished?: boolean;
}
