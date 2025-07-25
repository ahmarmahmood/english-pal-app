import React from 'react';
import { Exercise, ExerciseCategory } from '../types';
import Card from './common/Card';
import { BrainCircuit, BookText, MessageSquare, X } from 'lucide-react';

interface ExerciseCardProps {
    exercise: Exercise;
    onDismiss?: () => void;
}

const categoryStyles: { [key in ExerciseCategory]: { icon: React.ElementType, bgColor: string, textColor: string, borderColor: string } } = {
    [ExerciseCategory.Grammar]: { icon: BrainCircuit, bgColor: '#dbeafe', textColor: '#1e40af', borderColor: '#3b82f6' },
    [ExerciseCategory.Vocabulary]: { icon: BookText, bgColor: '#dcfce7', textColor: '#166534', borderColor: '#22c55e' },
    [ExerciseCategory.Conversation]: { icon: MessageSquare, bgColor: '#f3e8ff', textColor: '#7c3aed', borderColor: '#a855f7' },
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onDismiss }) => {
    const styles = categoryStyles[exercise.category] || categoryStyles[ExerciseCategory.Conversation];
    const { icon: Icon, bgColor, textColor, borderColor } = styles;

    return (
        <Card style={{ 
            marginBottom: '1rem', 
            borderLeft: `4px solid ${borderColor}`, 
            position: 'relative' 
        }} className="fade-in">
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.25rem',
                        color: '#9ca3af',
                        background: 'none',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    aria-label="Dismiss exercise"
                >
                    <X size={20} />
                </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: bgColor, 
                    color: textColor, 
                    marginRight: '0.75rem' 
                }}>
                    <Icon style={{ height: '1.5rem', width: '1.5rem' }} />
                </div>
                <div>
                    <span style={{ 
                        padding: '0.25rem 0.625rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        borderRadius: '9999px', 
                        backgroundColor: bgColor, 
                        color: textColor 
                    }}>
                        {exercise.category}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginTop: '0.25rem' }}>{exercise.title}</h3>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.25rem' }}>
                <div>
                    <h4 style={{ fontWeight: '600', fontSize: '1rem', color: '#1f2937', marginBottom: '0.25rem' }}>Task:</h4>
                    <p style={{ color: '#6b7280' }}>{exercise.description}</p>
                </div>
                <div>
                    <h4 style={{ fontWeight: '600', fontSize: '1rem', color: '#1f2937', marginBottom: '0.25rem' }}>Example:</h4>
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>"{exercise.example}"</p>
                </div>
            </div>
        </Card>
    );
};

export default ExerciseCard;
