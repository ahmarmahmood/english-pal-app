
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Mic, ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';
import { Story } from '../types';

interface ReadingStoryReaderProps {
  story: Story;
  onBack: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const getSpeakingLevel = (score: number | null): { level: string, color: string } | null => {
    if (score === null) return null;
    if (score >= 90) return { level: 'Excellent!', color: 'text-green-600' };
    if (score >= 75) return { level: 'Great!', color: 'text-blue-600' };
    if (score >= 60) return { level: 'Good', color: 'text-yellow-600' };
    return { level: 'Keep Practicing', color: 'text-red-500' };
};

const ReadingStoryReader: React.FC<ReadingStoryReaderProps> = ({ story, onBack }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Find and set a female voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'))) || 
                    voices.find(v => v.lang.startsWith('en'));
      setFemaleVoice(voice || null);
    };
    
    // Voices load asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        loadVoices();
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel(); // Stop any speech on unmount
    };
  }, []);

  const storyWords = useMemo(() => story.content.trim().split(/\s+/), [story.content]);

  // Pre-calculate word start boundaries for highlighting
  const wordBoundaries = useMemo(() => {
    let cumulativeLength = 0;
    return storyWords.map((word, index) => {
        const start = story.content.indexOf(word, cumulativeLength);
        cumulativeLength = start + word.length;
        return { start, index };
    });
  }, [story.content, storyWords]);

  const correctWords = useMemo(() => {
    const spokenWords = transcript.trim().toLowerCase().split(/\s+/).filter(w => w);
    const correct = new Set<number>();
    if (spokenWords.length === 0) return correct;

    let lastFoundIndex = -1;
    spokenWords.forEach(spokenWord => {
      const cleanSpokenWord = spokenWord.replace(/[.,!?]/g, '');
      const foundIndex = storyWords.findIndex((storyWord, index) => 
        index > lastFoundIndex && storyWord.toLowerCase().replace(/[.,!?]/g, '') === cleanSpokenWord
      );
      if (foundIndex !== -1) {
        correct.add(foundIndex);
        lastFoundIndex = foundIndex;
      }
    });
    return correct;
  }, [transcript, storyWords]);

  const speak = useCallback(() => {
    if (!story.content || !window.speechSynthesis || isSpeaking) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story.content);
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slower speed

    utterance.onstart = () => {
      setIsSpeaking(true);
      setHighlightedWordIndex(null);
    };

    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      let currentWordIndex = -1;
      // Find the word that corresponds to the current character index
      for (let i = wordBoundaries.length - 1; i >= 0; i--) {
        if (charIndex >= wordBoundaries[i].start) {
          currentWordIndex = wordBoundaries[i].index;
          break;
        }
      }
      setHighlightedWordIndex(currentWordIndex);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [story.content, femaleVoice, isSpeaking, wordBoundaries]);

  const calculateFinalScore = useCallback(() => {
    const finalCorrectCount = correctWords.size;
    const finalScore = (finalCorrectCount / storyWords.length) * 100;
    setScore(Math.round(finalScore));
  }, [correctWords.size, storyWords.length]);
  
  const startListening = useCallback(() => {
    if (!recognition || isListening || isSpeaking) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setHighlightedWordIndex(null);
    setTranscript('');
    setScore(null);
    setIsListening(true);
    recognition.start();
  }, [recognition, isListening, isSpeaking]);

  const stopListening = useCallback(() => {
    if (!recognition || !isListening) return;
    setIsListening(false);
    recognition.stop();
  }, [recognition, isListening]);

  // Calculate score when listening stops
  useEffect(() => {
    if (!isListening && transcript.length > 0) {
        calculateFinalScore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const reset = () => {
    if (isListening) {
      recognition.stop();
    }
    window.speechSynthesis.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setScore(null);
    setHighlightedWordIndex(null);
  };
  
  const handleBack = () => {
      reset();
      onBack();
  };
  
  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };

    rec.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(rec);

    return () => {
        rec.stop();
    };
  }, []);

  const speakingLevelInfo = getSpeakingLevel(score);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="p-2 text-gray-600 hover:text-dark-text" aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-center text-dark-text truncate px-2">{story.title}</h2>
        <div className="flex items-center">
          <button onClick={speak} disabled={isSpeaking || isListening} className="p-2 text-gray-600 hover:text-dark-text disabled:text-gray-300" aria-label="Listen to story">
            <Volume2 size={22} />
          </button>
          <button onClick={reset} className="p-2 text-gray-600 hover:text-dark-text" aria-label="Reset practice">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-inner flex-grow overflow-y-auto">
        <p className="text-xl leading-relaxed text-dark-text">
          {storyWords.map((word, index) => (
            <span key={index} className={`transition-colors duration-150 rounded px-0.5
              ${correctWords.has(index) ? 'bg-green-100 text-green-700' : ''} 
              ${isSpeaking && highlightedWordIndex === index ? 'bg-yellow-200' : ''}`}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>
      
      <div className="mt-4 text-center min-h-[120px] flex flex-col justify-center items-center">
         {score !== null && !isListening && speakingLevelInfo && (
            <div className="mb-4 animate-fade-in">
                <p className={`text-2xl font-bold ${speakingLevelInfo.color}`}>{speakingLevelInfo.level}</p>
                <p className="text-xl font-bold">Your Score: <span className="text-primary">{score}%</span></p>
                <p className="text-sm text-gray-500">{correctWords.size} / {storyWords.length} words correct</p>
            </div>
        )}

        {(score === null || isListening) && (
            <>
                <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking}
                className={`w-16 h-16 rounded-full text-white flex items-center justify-center mx-auto shadow-lg transform transition-all duration-200 ease-in-out mb-2 ${
                    isListening ? 'bg-red-500 animate-pulse' : 'bg-primary hover:bg-primary-hover'
                } disabled:bg-gray-400`}
                >
                <Mic size={32} />
                </button>
                <p className="text-sm text-gray-500">
                    {isSpeaking ? 'The app is reading...' : (isListening ? 'Listening...' : 'Tap to start reading')}
                </p>
            </>
        )}
      </div>
    </div>
  );
};

export default ReadingStoryReader;
