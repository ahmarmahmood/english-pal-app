import OpenAI from 'openai';
import { Exercise, ExerciseCategory, ExerciseListItem, Story, ChatMessage, Feedback, MessageRole } from '../types';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
console.log("API Key loaded:", apiKey ? "Yes (length: " + apiKey.length + ")" : "No");
if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY environment variable not set");
}

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
});



export const generateReadingStories = async (): Promise<Story[]> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an English teacher creating short stories for intermediate learners. Always respond with valid JSON containing an array of stories."
                },
                {
                    role: "user",
                    content: "Generate exactly 3 short stories for intermediate English learners. Each story should be 50-70 words. Return as JSON array with 'title' and 'content' fields."
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (content) {
            const parsed = JSON.parse(content);
            // Handle different possible response formats
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed.stories && Array.isArray(parsed.stories)) {
                return parsed.stories;
            } else if (parsed.data && Array.isArray(parsed.data)) {
                return parsed.data;
            }
            return parsed;
        }
        
        throw new Error("No content in response");
    } catch (error) {
        console.error("Error getting reading stories:", error);
        throw new Error("Failed to generate stories from AI.");
    }
};

export const translateUrduToEnglish = async (text: string): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `Translate the following sentence from Urdu to English: "${text}"`
                }
            ]
        });
        return response.choices[0].message.content || "";
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
        console.log(`Making API call for ${category} exercises...`);
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an English teacher creating exercises. Always respond with valid JSON containing an array of exercises."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        console.log("API response received:", response);
        const content = response.choices[0].message.content;
        console.log("Response content:", content);
        
        if (content) {
            const parsed = JSON.parse(content);
            console.log("Parsed response:", parsed);
            
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed.exercises && Array.isArray(parsed.exercises)) {
                return parsed.exercises;
            } else if (parsed.data && Array.isArray(parsed.data)) {
                return parsed.data;
            }
            return parsed;
        }
        
        throw new Error("No content in response");
    } catch (error) {
        console.error(`Error getting ${category} exercise list:`, error);
        console.error("Full error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Unknown'
        });
        throw new Error(`Failed to generate ${category} exercises from AI.`);
    }
};

export const getExerciseDetails = async (title: string, description: string, category: ExerciseCategory): Promise<Exercise> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `Flesh out this English learning exercise:
                    - Category: "${category}"
                    - Title: "${title}"
                    - Task: "${description}"
                    
                    Provide a detailed description of the task and a clear example for the user to follow. The category in your response must be exactly "${category}".`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (content) {
            const parsed = JSON.parse(content);
            return { ...parsed, category } as Exercise;
        }
        
        throw new Error("No content in response");
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

export const createChat = (exercise: Exercise) => {
    const messages: ChatMessage[] = [
        {
            id: "system",
            role: MessageRole.Assistant,
            text: getSystemInstruction(exercise)
        }
    ];

    return {
        messages,
        async sendMessage(text: string): Promise<string> {
            messages.push({
                id: Date.now().toString(),
                role: MessageRole.User,
                text
            });

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: getSystemInstruction(exercise)
                        },
                        ...messages.slice(1).map(msg => ({
                            role: msg.role === MessageRole.User ? "user" as const : "assistant" as const,
                            content: msg.text
                        }))
                    ]
                });

                const assistantMessage = response.choices[0].message.content || "";
                messages.push({
                    id: Date.now().toString(),
                    role: MessageRole.Assistant,
                    text: assistantMessage
                });

                return assistantMessage;
            } catch (error) {
                console.error("Error sending message:", error);
                throw new Error("Failed to send message to AI.");
            }
        }
    };
};

export const getConversationFeedback = async (messages: ChatMessage[]): Promise<Feedback> => {
    const chatHistory = messages
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text}`)
        .join('\n');

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an English teacher evaluating a student's conversation. You must respond with valid JSON containing exactly these fields: score (number 0-100), grammar (string), vocabulary (string), fluency (string)."
                },
                {
                    role: "user",
                    content: `Analyze the following chat history and provide feedback. Return ONLY valid JSON with these exact fields:
                    {
                        "score": <number between 0-100>,
                        "grammar": "<brief feedback on grammar>",
                        "vocabulary": "<brief feedback on vocabulary>",
                        "fluency": "<brief feedback on fluency>"
                    }
                    
                    Chat History:
                    ${chatHistory}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (content) {
            try {
                const parsed = JSON.parse(content) as Feedback;
                // Validate that all required fields exist
                if (typeof parsed.score === 'number' && 
                    typeof parsed.grammar === 'string' && 
                    typeof parsed.vocabulary === 'string' && 
                    typeof parsed.fluency === 'string') {
                    return parsed;
                } else {
                    console.error("Invalid feedback structure:", parsed);
                    // Return fallback feedback
                    return {
                        score: 75,
                        grammar: "Good effort! Keep practicing your grammar.",
                        vocabulary: "Nice vocabulary usage! Continue expanding your word choices.",
                        fluency: "Good conversation flow! Keep practicing to improve fluency."
                    };
                }
            } catch (parseError) {
                console.error("Error parsing feedback JSON:", parseError);
                // Return fallback feedback
                return {
                    score: 75,
                    grammar: "Good effort! Keep practicing your grammar.",
                    vocabulary: "Nice vocabulary usage! Continue expanding your word choices.",
                    fluency: "Good conversation flow! Keep practicing to improve fluency."
                };
            }
        }
        
        throw new Error("No content in response");
    } catch (error) {
        console.error("Error getting conversation feedback:", error);
        // Return fallback feedback instead of throwing
        return {
            score: 75,
            grammar: "Good effort! Keep practicing your grammar.",
            vocabulary: "Nice vocabulary usage! Continue expanding your word choices.",
            fluency: "Good conversation flow! Keep practicing to improve fluency."
        };
    }
};