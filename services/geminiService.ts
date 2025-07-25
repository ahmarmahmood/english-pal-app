import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Exercise, ExerciseCategory, ExerciseListItem, Story, ChatMessage, Feedback } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const exerciseListSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'A short, engaging title for the exercise (e.g., "Past Tense Practice").',
            },
            description: {
                type: Type.STRING,
                description: 'A one-sentence description of the exercise task.',
            },
        },
        required: ["title", "description"],
    },
};

const exerciseDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        category: {
            type: Type.STRING,
            description: `The category of the exercise.`,
            enum: [ExerciseCategory.Grammar, ExerciseCategory.Vocabulary],
        },
        title: {
            type: Type.STRING,
            description: 'The exact title of the exercise.',
        },
        description: {
            type: Type.STRING,
            description: 'A clear, concise description of what the user should do.',
        },
        example: {
            type: Type.STRING,
            description: 'A simple example demonstrating the exercise. For grammar, an example of the pattern. For vocabulary, using a word in a sentence.',
        },
    },
    required: ['category', 'title', 'description', 'example'],
};

const readingStoriesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'An engaging title for the story.'
            },
            content: {
                type: Type.STRING,
                description: 'The full text of the story, around 50-70 words long.'
            }
        },
        required: ["title", "content"]
    }
};

const feedbackSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: 'A score from 0 to 100 representing the user\'s overall English performance in the conversation.'
        },
        grammar: {
            type: Type.STRING,
            description: 'Concise, constructive feedback on the user\'s grammar. Point out one or two key areas for improvement.'
        },
        vocabulary: {
            type: Type.STRING,
            description: 'Concise, constructive feedback on the user\'s vocabulary usage. Suggest alternative words or mention good usage.'
        },
        fluency: {
            type: Type.STRING,
            description: 'Concise, constructive feedback on the user\'s conversational fluency and coherence.'
        },
    },
    required: ["score", "grammar", "vocabulary", "fluency"],
};


export const generateReadingStories = async (): Promise<Story[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a list of 3 new and unique short stories for an intermediate English learner. Each story should be simple, engaging, and between 50 and 70 words long.",
            config: {
                responseMimeType: "application/json",
                responseSchema: readingStoriesSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Story[];
    } catch (error) {
        console.error("Error getting reading stories:", error);
        throw new Error("Failed to generate stories from AI.");
    }
};

export const translateUrduToEnglish = async (text: string): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following sentence from Urdu to English: "${text}"`,
        });
        return response.text;
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error("Failed to translate text.");
    }
};


export const generateExerciseList = async (category: ExerciseCategory): Promise<ExerciseListItem[]> => {
    const prompt = category === ExerciseCategory.Conversation
        ? `Generate a list of 4 engaging and open-ended conversation topics for an intermediate English learner. Ensure the topics are varied and different from what you might have provided before. For each, provide a title and a one-sentence description.`
        : `Generate a list of 4 simple English learning exercise ideas for an intermediate learner in the "${category}" category. Ensure the exercises are varied and different from what you might have provided before. For each, provide a title and a one-sentence description.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: exerciseListSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as ExerciseListItem[];
    } catch (error) {
        console.error(`Error getting ${category} exercise list:`, error);
        throw new Error(`Failed to generate ${category} exercises from AI.`);
    }
};

export const getExerciseDetails = async (title: string, description: string, category: ExerciseCategory): Promise<Exercise> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Flesh out this English learning exercise:
            - Category: "${category}"
            - Title: "${title}"
            - Task: "${description}"
            
            Provide a detailed description of the task and a clear example for the user to follow. The category in your response must be exactly "${category}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: exerciseDetailsSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);
        // Ensure category from prompt is respected, as model can sometimes hallucinate a different one
        return { ...parsedJson, category } as Exercise;

    } catch (error) {
        console.error("Error getting exercise details:", error);
        throw new Error("Failed to generate exercise details from AI.");
    }
};

const getSystemInstruction = (exercise: Exercise): string => {
    if (exercise.category === ExerciseCategory.Conversation) {
        return `You are a friendly and engaging conversational partner. The user wants to practice speaking about: "${exercise.title}". Your goal is to have a natural, flowing conversation. Ask questions, share your own 'thoughts' (as an AI), and encourage the user to elaborate. Do NOT correct their grammar or vocabulary during the conversation. Just be a good chat buddy. Keep your responses friendly and concise.`;
    }
    return `You are a friendly and patient English tutor. The user has selected the following exercise:
        - Category: ${exercise.category}
        - Title: "${exercise.title}"
        - Task: "${exercise.description}"
        
        Your role is to guide the user through this exercise. Start the conversation by introducing the exercise. Have a natural conversation related to the exercise. Keep your responses concise and encouraging. If the user makes a mistake relevant to the exercise, gently correct them by modeling the correct form in your response. When you feel the exercise is complete, you can say something like "Great job! Feel free to go back and try another exercise."`;
};


export const createChat = (exercise: Exercise): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: getSystemInstruction(exercise),
        },
    });
};

export const getConversationFeedback = async (messages: ChatMessage[]): Promise<Feedback> => {
    const chatHistory = messages
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text}`)
        .join('\n');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an English teacher evaluating a student's conversation. Analyze the following chat history. Provide a score out of 100 and brief, constructive feedback on their grammar, vocabulary, and fluency. The student's messages are the ones to be evaluated.
            
            Chat History:
            ${chatHistory}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: feedbackSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Feedback;
    } catch (error) {
        console.error("Error getting conversation feedback:", error);
        throw new Error("Failed to generate feedback from AI.");
    }
};