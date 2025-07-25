
import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Volume2, AlertCircle } from 'lucide-react';
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
    const [permissionDenied, setPermissionDenied] = useState(false);

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

    const toggleListening = async () => {
        if (!recognition) return;
        
        if (isListening) {
            recognition.stop();
        } else {
            setUrduText('');
            setEnglishText('');
            setError(null);
            setPermissionDenied(false);
            
            try {
                // Request microphone permission first
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
                
                // If permission granted, start recognition
                recognition.start();
            } catch (permissionError) {
                setPermissionDenied(true);
                setError('Microphone access denied. Please allow microphone access in your browser settings.');
                return;
            }
        }
        setIsListening(!isListening);
    };
    
    useEffect(() => {
        if (!SpeechRecognition) {
            setError("Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.");
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
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setPermissionDenied(true);
                setError('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
            } else if (event.error === 'no-speech') {
                setError('No speech detected. Please try speaking again.');
            } else if (event.error === 'network') {
                setError('Network error. Please check your internet connection.');
            } else {
                setError(`Speech recognition error: ${event.error}. Please try again.`);
            }
            setIsListening(false);
        };

        setRecognition(rec);

        return () => {
            rec.stop();
        };
    }, [handleTranslate]);

    const getPermissionInstructions = () => {
        if (navigator.userAgent.includes('Chrome')) {
            return 'Click the microphone icon in the address bar and select "Allow"';
        } else if (navigator.userAgent.includes('Safari')) {
            return 'Go to Safari > Preferences > Websites > Microphone and allow access';
        } else if (navigator.userAgent.includes('Firefox')) {
            return 'Click the microphone icon in the address bar and select "Allow"';
        }
        return 'Check your browser settings and allow microphone access';
    };

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

            {error && (
                <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '0.5rem',
                    maxWidth: '28rem',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={20} color="#ef4444" />
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>Error</span>
                    </div>
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>
                    {permissionDenied && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            <strong>How to fix:</strong> {getPermissionInstructions()}
                        </div>
                    )}
                </div>
            )}
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={toggleListening}
                    disabled={permissionDenied}
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
                        cursor: permissionDenied ? 'not-allowed' : 'pointer',
                        backgroundColor: permissionDenied ? '#9ca3af' : (isListening ? '#ef4444' : '#4f46e5'),
                        transition: 'all 0.2s ease-in-out',
                        opacity: permissionDenied ? 0.6 : 1
                    }}
                >
                    <Mic size={40} />
                </button>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>
                    {permissionDenied ? 'Microphone access needed' : (isListening ? 'Listening...' : 'Tap to speak')}
                </p>
            </div>
        </div>
    );
};

export default TranslationView;
