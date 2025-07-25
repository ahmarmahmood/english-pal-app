import React from 'react';
import { ExerciseCategory, ExerciseListItem } from '../types';
import Card from './common/Card';
import { ArrowLeft, BrainCircuit, BookText, MessageSquare } from 'lucide-react';

interface ExerciseListViewProps {
    category: ExerciseCategory;
    exercises: ExerciseListItem[];
    onSelectExercise: (exercise: ExerciseListItem) => void;
    onBack: () => void;
}

const categoryInfo = {
    [ExerciseCategory.Grammar]: { icon: BrainCircuit, color: 'text-blue-500' },
    [ExerciseCategory.Vocabulary]: { icon: BookText, color: 'text-green-500' },
    [ExerciseCategory.Conversation]: { icon: MessageSquare, color: 'text-purple-500' },
};


const ExerciseListView: React.FC<ExerciseListViewProps> = ({ category, exercises, onSelectExercise, onBack }) => {
    const { icon: Icon, color } = categoryInfo[category];
    const headerText = category === ExerciseCategory.Conversation ? 'Conversation Topics' : `${category} Exercises`;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="p-2 mr-2 text-gray-600 hover:text-dark-text">
                    <ArrowLeft size={24} />
                </button>
                <Icon className={`w-8 h-8 ${color}`} />
                <h2 className="text-2xl font-bold text-dark-text ml-2">{headerText}</h2>
            </div>
            <p className="text-center text-gray-500 mb-6">Select one to start your session.</p>
            
            <div className="space-y-3">
                {exercises.map((exercise, index) => (
                    <Card key={index} className="hover:shadow-lg hover:border-primary border-transparent border-2 transition-all duration-300 cursor-pointer">
                        <button onClick={() => onSelectExercise(exercise)} className="w-full text-left">
                            <h3 className="font-bold text-md text-dark-text">{exercise.title}</h3>
                            <p className="text-gray-600 text-sm">{exercise.description}</p>
                        </button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ExerciseListView;
