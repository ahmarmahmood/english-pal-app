
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Mic, ArrowLeft, RefreshCw, Volume2, Lightbulb } from 'lucide-react';
import { Story } from '../types';

interface ReadingStoryReaderProps {
  story: Story;
  onBack: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const getPronunciationLevel = (score: number | null): { level: string, color: string, feedback: string } | null => {
    if (score === null) return null;
    if (score >= 90) return { 
        level: 'Excellent Pronunciation!', 
        color: '#059669', 
        feedback: 'Your pronunciation is very clear and accurate. Great job!' 
    };
    if (score >= 75) return { 
        level: 'Good Pronunciation!', 
        color: '#2563eb', 
        feedback: 'Your pronunciation is good. Try to slow down and enunciate more clearly.' 
    };
    if (score >= 60) return { 
        level: 'Fair Pronunciation', 
        color: '#ca8a04', 
        feedback: 'Your pronunciation needs improvement. Focus on clear articulation and word stress.' 
    };
    return { 
        level: 'Needs Practice', 
        color: '#dc2626', 
        feedback: 'Your pronunciation needs work. Practice speaking slowly and clearly, focusing on each sound.' 
    };
};

const getPronunciationSuggestions = (score: number, confidence: number, transcript: string, storyContent: string): string[] => {
    const suggestions: string[] = [];
    
    if (score < 60) {
        suggestions.push(
            "🗣️ Speak louder and more clearly",
            "⏱️ Slow down your speech pace",
            "🎯 Focus on each word individually",
            "📏 Practice with shorter sentences first"
        );
    } else if (score < 75) {
        suggestions.push(
            "🔊 Increase your volume slightly",
            "🎵 Pay attention to word stress patterns",
            "👄 Enunciate consonants more clearly",
            "🔄 Practice difficult words repeatedly"
        );
    } else if (score < 90) {
        suggestions.push(
            "🎤 Maintain consistent volume",
            "📝 Work on sentence intonation",
            "🎭 Add more expression to your voice",
            "📚 Practice with different text types"
        );
    } else {
        suggestions.push(
            "🌟 Excellent work! Keep practicing",
            "🎯 Try more challenging texts",
            "🌍 Practice different accents",
            "📖 Read aloud regularly to maintain skills"
        );
    }
    
    // Add specific suggestions based on confidence
    if (confidence < 0.5) {
        suggestions.push("🎧 Check your microphone and environment");
    }
    
    if (transcript.length < storyContent.length * 0.3) {
        suggestions.push("📖 Try reading the entire story");
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
};

const ReadingStoryReader: React.FC<ReadingStoryReaderProps> = ({ story, onBack }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [currentSpokenWordIndex, setCurrentSpokenWordIndex] = useState<number | null>(null);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<number[]>([]);

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

  const calculatePronunciationScore = useCallback(() => {
    if (confidenceScores.length === 0) return;
    
    // Calculate average confidence score
    const averageConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
    
    // Convert confidence to pronunciation score (0-100)
    const pronunciationScore = Math.round(averageConfidence * 100);
    setPronunciationScore(pronunciationScore);
  }, [confidenceScores]);
  
  const startListening = useCallback(() => {
    if (!recognition || isListening || isSpeaking) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setHighlightedWordIndex(null);
    setCurrentSpokenWordIndex(null);
    setTranscript('');
    setPronunciationScore(null);
    setConfidenceScores([]);
    setIsListening(true);
    recognition.start();
  }, [recognition, isListening, isSpeaking]);

  const stopListening = useCallback(() => {
    if (!recognition || !isListening) return;
    setIsListening(false);
    recognition.stop();
  }, [recognition, isListening]);

  // Calculate pronunciation score when listening stops
  useEffect(() => {
    if (!isListening && confidenceScores.length > 0) {
        calculatePronunciationScore();
    }
  }, [isListening, confidenceScores, calculatePronunciationScore]);

  const reset = () => {
    if (isListening) {
      recognition.stop();
    }
    window.speechSynthesis.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setPronunciationScore(null);
    setHighlightedWordIndex(null);
    setCurrentSpokenWordIndex(null);
    setConfidenceScores([]);
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
      const newConfidenceScores: number[] = [];
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        fullTranscript += result[0].transcript;
        
        // Collect confidence scores for pronunciation assessment
        if (result.isFinal) {
          newConfidenceScores.push(result[0].confidence);
        }
      }
      
      setTranscript(fullTranscript);
      setConfidenceScores(newConfidenceScores);
      
      // Highlight current word being spoken for visual feedback
      const spokenWords = fullTranscript.trim().toLowerCase().split(/\s+/).filter(w => w);
      if (spokenWords.length > 0) {
        const lastSpokenWord = spokenWords[spokenWords.length - 1].replace(/[.,!?]/g, '');
        const currentIndex = storyWords.findIndex((storyWord, index) => 
          storyWord.toLowerCase().replace(/[.,!?]/g, '') === lastSpokenWord
        );
        setCurrentSpokenWordIndex(currentIndex !== -1 ? currentIndex : null);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setCurrentSpokenWordIndex(null);
    };
    
    setRecognition(rec);

    return () => {
        rec.stop();
    };
  }, [storyWords]);

  const pronunciationLevelInfo = getPronunciationLevel(pronunciationScore);
  const averageConfidence = confidenceScores.length > 0 ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length : 0;
  const suggestions = pronunciationScore !== null ? getPronunciationSuggestions(pronunciationScore, averageConfidence, transcript, story.content) : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button 
          onClick={handleBack} 
          style={{ 
            padding: '0.5rem', 
            color: '#6b7280', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer' 
          }} 
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          color: '#1f2937', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap', 
          padding: '0 0.5rem' 
        }}>
          {story.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={speak} 
            disabled={isSpeaking || isListening} 
            style={{ 
              padding: '0.5rem', 
              color: isSpeaking || isListening ? '#d1d5db' : '#6b7280', 
              background: 'none', 
              border: 'none', 
              cursor: isSpeaking || isListening ? 'not-allowed' : 'pointer' 
            }} 
            aria-label="Listen to story"
          >
            <Volume2 size={22} />
          </button>
          <button 
            onClick={reset} 
            style={{ 
              padding: '0.5rem', 
              color: '#6b7280', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }} 
            aria-label="Reset practice"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.5rem', 
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', 
        flexGrow: 1, 
        overflowY: 'auto' 
      }}>
        <p style={{ fontSize: '1.25rem', lineHeight: '1.75', color: '#1f2937' }}>
          {storyWords.map((word, index) => (
            <span 
              key={index} 
              style={{
                transition: 'all 0.15s ease',
                borderRadius: '0.125rem',
                padding: '0 0.125rem',
                backgroundColor: (isSpeaking && highlightedWordIndex === index) ? '#fef3c7' :
                                 (isListening && currentSpokenWordIndex === index) ? '#dbeafe' : 'transparent',
                color: '#1f2937'
              }}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'center', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
         {pronunciationScore !== null && !isListening && pronunciationLevelInfo && (
            <div className="fade-in" style={{ marginBottom: '1rem', width: '100%' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: pronunciationLevelInfo.color }}>
                  {pronunciationLevelInfo.level}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Pronunciation Score: <span style={{ color: '#4f46e5' }}>{pronunciationScore}%</span>
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '300px', margin: '0.5rem auto' }}>
                  {pronunciationLevelInfo.feedback}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                  Confidence: {Math.round(averageConfidence * 100)}%
                </p>
                
                {/* AI Suggestions */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Lightbulb size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                      AI Suggestions for Improvement
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {suggestions.map((suggestion, index) => (
                      <div key={index} style={{ 
                        fontSize: '0.75rem', 
                        color: '#4b5563', 
                        textAlign: 'left',
                        padding: '0.25rem 0'
                      }}>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
            </div>
        )}

        {(pronunciationScore === null || isListening) && (
            <>
                <button
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking}
                style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem auto',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    cursor: isSpeaking ? 'not-allowed' : 'pointer',
                    backgroundColor: isSpeaking ? '#9ca3af' : (isListening ? '#ef4444' : '#4f46e5'),
                    transition: 'all 0.2s ease-in-out'
                }}
                >
                <Mic size={32} />
                </button>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {isSpeaking ? 'The app is reading...' : (isListening ? 'Listening...' : 'Tap to practice pronunciation')}
                </p>
                {isListening && (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Read the story aloud to practice your pronunciation
                  </p>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default ReadingStoryReader;
