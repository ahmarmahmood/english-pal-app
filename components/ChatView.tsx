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
        <div className="fade-in">
             <h2 className="section-title">Chat Practice</h2>
             <p className="section-subtitle">Choose a topic to start a conversation with your AI tutor.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card className="card">
                    <button 
                        onClick={() => handleSelectCategory(ExerciseCategory.Grammar)} 
                        style={{ 
                            width: '100%', 
                            textAlign: 'left', 
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                         <div className="card-content">
                            <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.75rem', borderRadius: '50%' }}>
                                <BrainCircuit size={30} />
                            </div>
                            <div className="card-text">
                                <h3 className="card-title">Grammar</h3>
                                <p className="card-description">Practice sentence structure, tenses, and more.</p>
                            </div>
                         </div>
                    </button>
                </Card>
                 <Card className="card">
                    <button 
                        onClick={() => handleSelectCategory(ExerciseCategory.Vocabulary)} 
                        style={{ 
                            width: '100%', 
                            textAlign: 'left', 
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                         <div className="card-content">
                            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '50%' }}>
                                <BookText size={30} />
                            </div>
                            <div className="card-text">
                                <h3 className="card-title">Vocabulary</h3>
                                <p className="card-description">Learn new words and how to use them in context.</p>
                            </div>
                         </div>
                    </button>
                </Card>
                 <Card className="card">
                    <button 
                        onClick={() => handleSelectCategory(ExerciseCategory.Conversation)} 
                        style={{ 
                            width: '100%', 
                            textAlign: 'left', 
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                         <div className="card-content">
                            <div style={{ backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '0.75rem', borderRadius: '50%' }}>
                                <MessageSquare size={30} />
                            </div>
                            <div className="card-text">
                                <h3 className="card-title">Conversation</h3>
                                <p className="card-description">Practice speaking on various topics and get feedback.</p>
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
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: '#ef4444' }}>{error}</p>
                <button 
                    onClick={handleGoBack} 
                    className="btn"
                    style={{ marginTop: '1rem' }}
                >
                    Try Again
                </button>
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
