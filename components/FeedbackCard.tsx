import React from 'react';
import { Feedback } from '../types';
import Card from './common/Card';
import { CheckCircle, BookOpen, BrainCircuit } from 'lucide-react';

interface FeedbackCardProps {
    feedback: Feedback;
    onGoBack: () => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, onGoBack }) => {
    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-500';
        if (score >= 70) return 'text-blue-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="flex flex-col h-full p-4 bg-gray-50 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-dark-text mb-4">Your Report Card</h2>
            
            <div className="flex justify-center items-center mb-6">
                <div className={`relative w-32 h-32 rounded-full flex items-center justify-center bg-gray-100 shadow-inner`}>
                    <span className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
                        {feedback.score}
                    </span>
                    <span className="absolute top-1/2 right-1/2 translate-x-[40px] -translate-y-[28px] text-lg font-semibold text-gray-500">/100</span>
                </div>
            </div>

            <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                <Card className="border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-full mt-1">
                             <BrainCircuit size={20} />
                        </div>
                        <div>
                             <h3 className="text-lg font-semibold text-dark-text">Grammar</h3>
                             <p className="text-gray-600">{feedback.grammar}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-l-4 border-green-500">
                     <div className="flex items-start gap-3">
                        <div className="bg-green-100 text-green-800 p-2 rounded-full mt-1">
                             <BookOpen size={20} />
                        </div>
                        <div>
                             <h3 className="text-lg font-semibold text-dark-text">Vocabulary</h3>
                             <p className="text-gray-600">{feedback.vocabulary}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-l-4 border-purple-500">
                     <div className="flex items-start gap-3">
                        <div className="bg-purple-100 text-purple-800 p-2 rounded-full mt-1">
                             <CheckCircle size={20} />
                        </div>
                        <div>
                             <h3 className="text-lg font-semibold text-dark-text">Fluency</h3>
                             <p className="text-gray-600">{feedback.fluency}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <button
                onClick={onGoBack}
                className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-full hover:bg-primary-hover transition-colors shadow-lg"
            >
                Done
            </button>
        </div>
    );
};

export default FeedbackCard;
