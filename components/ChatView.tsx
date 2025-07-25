import React, { useState, useCallback } from 'react';
import { BrainCircuit, BookText, MessageSquare } from 'lucide-react';
import { ExerciseCategory, ExerciseListItem, Exercise } from '../types';
import { generateExerciseList, getExerciseDetails } from '../services/openaiService';
import ConversationPractice from './ConversationPractice';
import ExerciseListView from './ExerciseListView';
import Loader from './common/Loader';
import Card from './common/Card';

interface ChatViewProps {
    isTtsEnabled: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ isTtsEnabled }) => {
    const [currentView, setCurrentView] = useState<'category' | 'list' | 'chat'>('category');
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
    const [exerciseList, setExerciseList] = useState<ExerciseListItem[]>([]);
    const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectCategory = useCallback(async (category: ExerciseCategory) => {
        setSelectedCategory(category);
        setIsLoading(true);
        setError(null);
        setExerciseList([]);
        try {
            const exercises = await generateExerciseList(category);
            setExerciseList(exercises);
            setCurrentView('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not fetch exercises.');
            setCurrentView('category'); // Go back to category selection on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSelectExercise = async (item: ExerciseListItem) => {
        if (!selectedCategory) return;
        setIsLoading(true);
        setError(null);
        try {
            let details: Exercise;
            if (selectedCategory === ExerciseCategory.Conversation) {
                details = {
                    category: ExerciseCategory.Conversation,
                    title: item.title,
                    description: "Freely discuss this topic. When you're done, say 'I'm done' to get feedback.",
                    example: "You can start by sharing your first thoughts on the topic."
                };
            } else {
                details = await getExerciseDetails(item.title, item.description, selectedCategory);
            }
            setCurrentExercise(details);
            setCurrentView('chat');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the exercise.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        setCurrentView('category');
        setCurrentExercise(null);
        setSelectedCategory(null);
        setExerciseList([]);
    };

    const renderCategorySelection = () => (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-dark-text mb-1 text-center">Chat Practice</h2>
             <p className="text-center text-gray-500 mb-6">Choose a topic to start a conversation with your AI tutor.</p>
            <div className="space-y-4">
                <Card className="hover:shadow-lg hover:border-primary border-transparent border-2 transition-all duration-300">
                    <button onClick={() => handleSelectCategory(ExerciseCategory.Grammar)} className="w-full text-left p-4">
                         <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-800 p-3 rounded-full"><BrainCircuit size={30} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-dark-text">Grammar</h3>
                                <p className="text-gray-600">Practice sentence structure, tenses, and more.</p>
                            </div>
                         </div>
                    </button>
                </Card>
                 <Card className="hover:shadow-lg hover:border-green-500 border-transparent border-2 transition-all duration-300">
                    <button onClick={() => handleSelectCategory(ExerciseCategory.Vocabulary)} className="w-full text-left p-4">
                         <div className="flex items-center gap-4">
                            <div className="bg-green-100 text-green-800 p-3 rounded-full"><BookText size={30} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-dark-text">Vocabulary</h3>
                                <p className="text-gray-600">Learn new words and how to use them in context.</p>
                            </div>
                         </div>
                    </button>
                </Card>
                 <Card className="hover:shadow-lg hover:border-purple-500 border-transparent border-2 transition-all duration-300">
                    <button onClick={() => handleSelectCategory(ExerciseCategory.Conversation)} className="w-full text-left p-4">
                         <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-800 p-3 rounded-full"><MessageSquare size={30} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-dark-text">Conversation</h3>
                                <p className="text-gray-600">Practice speaking on various topics and get feedback.</p>
                            </div>
                         </div>
                    </button>
                </Card>
            </div>
        </div>
    );

    if (isLoading) {
        return <Loader text={ currentView === 'list' ? `Finding ${selectedCategory} topics...` : 'Loading...' }/>
    }

    if (error) {
        return (
            <div className="text-center p-4">
                <p className="text-red-500">{error}</p>
                <button onClick={handleGoBack} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Try Again</button>
            </div>
        );
    }
    
    switch (currentView) {
        case 'chat':
            return currentExercise ? <ConversationPractice exercise={currentExercise} onGoBack={handleGoBack} isTtsEnabled={isTtsEnabled} /> : null;
        case 'list':
            return selectedCategory ? (
                <ExerciseListView
                    category={selectedCategory}
                    exercises={exerciseList}
                    onSelectExercise={handleSelectExercise}
                    onBack={() => setCurrentView('category')}
                />
            ) : null;
        case 'category':
        default:
            return renderCategorySelection();
    }
};

export default ChatView;
