export enum MessageRole {
    User = 'user',
    Model = 'model',
}

export interface ChatMessage {
    id: string;
    role: MessageRole;
    text: string;
}

export enum AppTab {
    Reading = 'Reading',
    Translate = 'Translate',
    Chat = 'Chat',
}

export enum ExerciseCategory {
    Grammar = 'Grammar',
    Vocabulary = 'Vocabulary',
    Conversation = 'Conversation',
}

export interface ExerciseListItem {
    title: string;
    description: string;
}

export interface Exercise {
    category: ExerciseCategory;
    title: string;
    description: string;
    example: string;
}

export interface Story {
    title: string;
    content: string;
}

export interface Feedback {
    score: number;
    grammar: string;
    vocabulary: string;
    fluency: string;
}
