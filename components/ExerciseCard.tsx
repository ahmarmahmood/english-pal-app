import React from 'react';
import { Exercise, ExerciseCategory } from '../types';
import Card from './common/Card';
import { BrainCircuit, BookText, MessageSquare, X } from 'lucide-react';

interface ExerciseCardProps {
    exercise: Exercise;
    onDismiss?: () => void;
}

const categoryStyles: { [key in ExerciseCategory]: { icon: React.ElementType, color: string, borderColor: string } } = {
    [ExerciseCategory.Grammar]: { icon: BrainCircuit, color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' },
    [ExerciseCategory.Vocabulary]: { icon: BookText, color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' },
    [ExerciseCategory.Conversation]: { icon: MessageSquare, color: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-500' },
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onDismiss }) => {
    const styles = categoryStyles[exercise.category] || categoryStyles[ExerciseCategory.Conversation];
    const { icon: Icon, color, borderColor } = styles;

    return (
        <Card className={`mb-4 border-l-4 ${borderColor} relative animate-fade-in`}>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Dismiss exercise"
                >
                    <X size={20} />
                </button>
            )}

            <div className="flex items-center mb-3">
                <div className={`p-2 rounded-full ${color} mr-3`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${color}`}>
                        {exercise.category}
                    </span>
                    <h3 className="text-lg font-bold text-dark-text">{exercise.title}</h3>
                </div>
            </div>

            <div className="space-y-3 pl-1">
                <div>
                    <h4 className="font-semibold text-md text-dark-text">Task:</h4>
                    <p className="text-gray-600">{exercise.description}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-md text-dark-text">Example:</h4>
                    <p className="text-gray-600 italic">"{exercise.example}"</p>
                </div>
            </div>
        </Card>
    );
};

export default ExerciseCard;
