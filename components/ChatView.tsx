import React, { useState, useCallback } from 'react';
import { BrainCircuit, BookText, MessageSquare } from 'lucide-react';
import { ExerciseCategory, ExerciseListItem, Exercise } from '../types';
import { generateExerciseList, getExerciseDetails } from '../services/openaiService';
import ConversationPractice from './ConversationPractice';
import ExerciseListView from './ExerciseListView';
import Loader from './common/Loader';
import Card from './common/Card';

// Prefetched grammar topics with detailed exercise information
const PREFETCHED_GRAMMAR_TOPICS: ExerciseListItem[] = [
  { title: 'Present Simple Tense', description: 'Learn how to use the present simple tense in English.' },
  { title: 'Past Simple Tense', description: 'Understand the rules for the past simple tense.' },
  { title: 'Future Tense', description: 'Explore how to talk about the future in English.' },
  { title: 'Countable and Uncountable Nouns', description: 'Distinguish between countable and uncountable nouns.' },
  { title: 'Articles (a, an, the)', description: 'Master the use of articles in English.' },
  { title: 'Prepositions of Time', description: 'Learn how to use in, on, at, and other time prepositions.' },
  { title: 'Comparatives and Superlatives', description: 'Form and use comparatives and superlatives.' },
  { title: 'Modal Verbs', description: 'Understand can, could, must, should, and more.' },
  { title: 'Subject-Verb Agreement', description: 'Ensure verbs agree with their subjects.' },
  { title: 'Question Formation', description: 'How to form questions in English.' }
];

// Detailed exercise objects for grammar topics
const PREFETCHED_GRAMMAR_EXERCISES: Exercise[] = [
  {
    category: ExerciseCategory.Grammar,
    title: 'Present Simple Tense',
    description: 'Practice using the present simple tense to talk about habits, routines, and general truths. We\'ll work on forming sentences correctly and understanding when to use this tense.',
    example: 'I usually wake up at 7 AM. She works in a hospital. The sun rises in the east.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Past Simple Tense',
    description: 'Learn to talk about completed actions in the past. We\'ll practice regular and irregular verbs, and understand when to use the past simple tense.',
    example: 'I visited Paris last summer. She studied English for three years. They played football yesterday.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Future Tense',
    description: 'Explore different ways to talk about the future in English. We\'ll practice using will, going to, and present continuous for future plans.',
    example: 'I will help you tomorrow. She is going to visit her grandmother. We are meeting at 3 PM.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Countable and Uncountable Nouns',
    description: 'Learn the difference between countable and uncountable nouns, and how to use them with appropriate determiners and quantifiers.',
    example: 'I have three books (countable). I need some water (uncountable). There are many people here.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Articles (a, an, the)',
    description: 'Master the use of definite and indefinite articles. Learn when to use a, an, the, or no article at all.',
    example: 'I saw a cat in the garden. An apple a day keeps the doctor away. The sun is bright today.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Prepositions of Time',
    description: 'Practice using prepositions like in, on, at, during, and for to talk about time correctly.',
    example: 'I have a meeting at 2 PM. She was born in 1990. We go skiing in winter.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Comparatives and Superlatives',
    description: 'Learn to compare things using comparative and superlative forms of adjectives and adverbs.',
    example: 'This book is more interesting than that one. She is the tallest person in the class. This is the best movie I\'ve ever seen.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Modal Verbs',
    description: 'Understand how to use modal verbs like can, could, must, should, may, and might to express ability, possibility, obligation, and advice.',
    example: 'I can speak French. You should study harder. She must finish her homework.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Subject-Verb Agreement',
    description: 'Practice ensuring that verbs agree with their subjects in number and person. Learn the rules for singular and plural subjects.',
    example: 'He plays football. They play football. The book is on the table. The books are on the table.'
  },
  {
    category: ExerciseCategory.Grammar,
    title: 'Question Formation',
    description: 'Learn to form different types of questions in English: yes/no questions, wh-questions, and tag questions.',
    example: 'Do you like coffee? Where do you live? You speak English, don\'t you?'
  }
];

// Prefetched vocabulary topics with detailed exercise information
const PREFETCHED_VOCABULARY_TOPICS: ExerciseListItem[] = [
  { title: 'Daily Activities', description: 'Learn vocabulary for common daily activities and routines.' },
  { title: 'Food and Cooking', description: 'Expand your vocabulary related to food, cooking, and dining.' },
  { title: 'Travel and Transportation', description: 'Master vocabulary for traveling and different modes of transport.' },
  { title: 'Work and Careers', description: 'Learn professional vocabulary and workplace terminology.' },
  { title: 'Health and Wellness', description: 'Build vocabulary for health, fitness, and medical topics.' },
  { title: 'Technology and Internet', description: 'Understand modern technology and internet-related terms.' },
  { title: 'Weather and Seasons', description: 'Learn to describe weather conditions and seasonal changes.' },
  { title: 'Family and Relationships', description: 'Master vocabulary for family members and relationships.' },
  { title: 'Hobbies and Entertainment', description: 'Expand your vocabulary for leisure activities and entertainment.' },
  { title: 'Shopping and Money', description: 'Learn vocabulary for shopping, banking, and financial matters.' }
];

// Detailed exercise objects for vocabulary topics
const PREFETCHED_VOCABULARY_EXERCISES: Exercise[] = [
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Daily Activities',
    description: 'Practice using vocabulary related to everyday activities and routines. We\'ll learn words for morning routines, work activities, and evening habits.',
    example: 'I wake up at 7 AM, brush my teeth, and have breakfast. Then I commute to work and start my daily tasks.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Food and Cooking',
    description: 'Expand your vocabulary for different types of food, cooking methods, and dining experiences. Learn to describe flavors, ingredients, and cooking processes.',
    example: 'I love cooking pasta dishes. I usually sauté vegetables, boil the pasta, and then combine them with a delicious sauce.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Travel and Transportation',
    description: 'Learn vocabulary for different modes of transportation, travel planning, and describing journeys. Practice talking about destinations and travel experiences.',
    example: 'I prefer taking the train for long journeys because it\'s more comfortable than flying. I enjoy watching the scenery pass by.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Work and Careers',
    description: 'Master professional vocabulary for different jobs, workplace activities, and career development. Learn to discuss work responsibilities and career goals.',
    example: 'I work as a software developer. My daily tasks include coding, attending meetings, and collaborating with team members on projects.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Health and Wellness',
    description: 'Build vocabulary for health, fitness, and medical topics. Learn to describe symptoms, discuss healthy habits, and talk about medical appointments.',
    example: 'I try to maintain a healthy lifestyle by exercising regularly, eating nutritious food, and getting enough sleep each night.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Technology and Internet',
    description: 'Understand modern technology terms and internet-related vocabulary. Learn to discuss devices, apps, and digital experiences.',
    example: 'I use various apps on my smartphone for productivity, social media, and entertainment. I also enjoy learning new software programs.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Weather and Seasons',
    description: 'Learn to describe different weather conditions and seasonal changes. Practice talking about climate, temperature, and weather-related activities.',
    example: 'I love spring weather when it\'s warm but not too hot. I enjoy going for walks and seeing flowers bloom everywhere.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Family and Relationships',
    description: 'Master vocabulary for family members, relationships, and social connections. Learn to describe family dynamics and personal relationships.',
    example: 'I have a close relationship with my siblings. We often spend time together on weekends and support each other through difficult times.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Hobbies and Entertainment',
    description: 'Expand your vocabulary for leisure activities, hobbies, and entertainment. Learn to discuss interests, sports, and recreational activities.',
    example: 'My hobbies include reading novels, playing guitar, and hiking. I also enjoy watching movies and trying new restaurants.'
  },
  {
    category: ExerciseCategory.Vocabulary,
    title: 'Shopping and Money',
    description: 'Learn vocabulary for shopping, banking, and financial matters. Practice discussing purchases, budgeting, and financial planning.',
    example: 'I usually shop online for convenience, but I prefer buying clothes in stores so I can try them on. I try to budget my expenses carefully.'
  }
];

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
            if (category === ExerciseCategory.Grammar) {
                setExerciseList(PREFETCHED_GRAMMAR_TOPICS);
                setCurrentView('list');
            } else if (category === ExerciseCategory.Vocabulary) {
                setExerciseList(PREFETCHED_VOCABULARY_TOPICS);
                setCurrentView('list');
            } else {
                const exercises = await generateExerciseList(category);
                setExerciseList(exercises);
                setCurrentView('list');
            }
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
            } else if (selectedCategory === ExerciseCategory.Grammar) {
                // Use prefetched grammar exercise details
                const prefetchedExercise = PREFETCHED_GRAMMAR_EXERCISES.find(ex => ex.title === item.title);
                if (prefetchedExercise) {
                    details = prefetchedExercise;
                } else {
                    throw new Error('Exercise not found');
                }
            } else if (selectedCategory === ExerciseCategory.Vocabulary) {
                // Use prefetched vocabulary exercise details
                const prefetchedExercise = PREFETCHED_VOCABULARY_EXERCISES.find(ex => ex.title === item.title);
                if (prefetchedExercise) {
                    details = prefetchedExercise;
                } else {
                    throw new Error('Exercise not found');
                }
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
