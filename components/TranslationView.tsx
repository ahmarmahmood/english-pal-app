
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
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-2xl font-bold text-dark-text mb-1 text-center">Urdu to English</h2>
            <p className="text-center text-gray-500 mb-6">Tap the mic and speak in Urdu. I'll translate it to English for you.</p>

            <Card className="w-full max-w-md space-y-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-500 mb-2">Urdu (Spoken)</h3>
                    <p className="min-h-[50px] p-2 bg-gray-100 rounded-md text-dark-text text-lg">{urduText || "..."}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-500 mb-2">English (Translation)</h3>
                    <div className="min-h-[50px] p-2 bg-gray-100 rounded-md text-dark-text text-lg flex justify-between items-center">
                       {isLoading ? <Loader text="" /> : <span>{englishText || "..."}</span>}
                       {englishText && !isLoading && (
                           <button onClick={() => speak(englishText)} className="p-2 text-primary hover:text-primary-hover">
                               <Volume2 size={22} />
                           </button>
                       )}
                    </div>
                </div>
            </Card>

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            
            <div className="mt-8 text-center">
                <button
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full text-white flex items-center justify-center mx-auto shadow-lg transform transition-all duration-200 ease-in-out ${
                        isListening ? 'bg-red-500 animate-pulse' : 'bg-primary hover:bg-primary-hover'
                    }`}
                >
                    <Mic size={40} />
                </button>
                <p className="mt-4 text-gray-500">{isListening ? 'Listening...' : 'Tap to speak'}</p>
            </div>
        </div>
    );
};

export default TranslationView;
