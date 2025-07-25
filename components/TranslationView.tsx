
import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { translateUrduToEnglish } from '../services/openaiService';
import Card from './common/Card';
import Loader from './common/Loader';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface TranslationViewProps {
    isTtsEnabled: boolean;
}

const TranslationView: React.FC<TranslationViewProps> = ({ isTtsEnabled }) => {
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [urduText, setUrduText] = useState('');
    const [englishText, setEnglishText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    const speak = useCallback((text: string) => {
        if (!text || !isTtsEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }, [isTtsEnabled]);

    const handleTranslate = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);
        setEnglishText('');
        try {
            const translation = await translateUrduToEnglish(text);
            setEnglishText(translation);
            speak(translation);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed.');
        } finally {
            setIsLoading(false);
        }
    }, [speak]);

    const toggleListening = () => {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            setUrduText('');
            setEnglishText('');
            setError(null);
            recognition.start();
        }
        setIsListening(!isListening);
    };
    
    useEffect(() => {
        if (!SpeechRecognition) {
            setError("Speech Recognition API is not supported in this browser.");
            return;
        }
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'ur-PK';

        rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUrduText(transcript);
            handleTranslate(transcript);
        };

        rec.onend = () => {
            setIsListening(false);
        };
        
        rec.onerror = (event: any) => {
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };

        setRecognition(rec);

        return () => {
            rec.stop();
        };
    }, [handleTranslate]);

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <h2 className="section-title">Urdu to English</h2>
            <p className="section-subtitle">Tap the mic and speak in Urdu. I'll translate it to English for you.</p>

            <Card style={{ width: '100%', maxWidth: '28rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>Urdu (Spoken)</h3>
                        <p style={{ minHeight: '50px', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', color: '#1f2937', fontSize: '1.125rem' }}>{urduText || "..."}</p>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>English (Translation)</h3>
                        <div style={{ minHeight: '50px', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', color: '#1f2937', fontSize: '1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           {isLoading ? <Loader text="" /> : <span>{englishText || "..."}</span>}
                           {englishText && !isLoading && (
                               <button 
                                   onClick={() => speak(englishText)} 
                                   style={{ 
                                       padding: '0.5rem', 
                                       color: '#4f46e5', 
                                       background: 'none', 
                                       border: 'none', 
                                       cursor: 'pointer' 
                                   }}
                               >
                                   <Volume2 size={22} />
                               </button>
                           )}
                        </div>
                    </div>
                </div>
            </Card>

            {error && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={toggleListening}
                    style={{
                        width: '5rem',
                        height: '5rem',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isListening ? '#ef4444' : '#4f46e5',
                        transition: 'all 0.2s ease-in-out'
                    }}
                >
                    <Mic size={40} />
                </button>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>{isListening ? 'Listening...' : 'Tap to speak'}</p>
            </div>
        </div>
    );
};

export default TranslationView;
