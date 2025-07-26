import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, ArrowLeft, VolumeX } from 'lucide-react';
import { createChat, getConversationFeedback } from '../services/openaiService';
import { ChatMessage, MessageRole, Exercise, Feedback, ExerciseCategory } from '../types';
import Loader from './common/Loader';
import ExerciseCard from './ExerciseCard';
import FeedbackCard from './FeedbackCard';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ConversationPracticeProps {
  exercise: Exercise;
  onGoBack: () => void;
  isTtsEnabled: boolean;
}

const ConversationPractice: React.FC<ConversationPracticeProps> = ({ exercise, onGoBack, isTtsEnabled }) => {
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechApi, setSpeechApi] = useState<{ recognition: any, synthesis: SpeechSynthesis } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Improved auto-resize function
  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechApi?.synthesis) {
      speechApi.synthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechApi]);

  const speak = useCallback((text: string) => {
    if (!text || !isTtsEnabled || !speechApi?.synthesis) return;
    speechApi.synthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    speechApi.synthesis.speak(utterance);
  }, [isTtsEnabled, speechApi]);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("Speech Recognition is not supported by this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const newText = finalTranscript + interimTranscript;
      setUserInput(newText);
      
      // Auto-resize the textarea when speech input is received
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        resizeTextarea();
      });
    };

    recognition.onend = () => {
        setIsListening(false);
        if (formRef.current && finalTranscript.trim()) {
            formRef.current.requestSubmit();
        }
        finalTranscript = ''; // Reset for next time.
    }
    
    setSpeechApi({ recognition, synthesis: window.speechSynthesis });
    
    return () => {
        recognition.stop();
    };
  }, [resizeTextarea]);

  useEffect(() => {
    const chatInstance = createChat(exercise);
    setChat(chatInstance);
    setFeedback(null); // Reset feedback when exercise changes

    const startConversation = async () => {
      setIsLoading(true);
      try {
        const response = await chatInstance.sendMessage("Let's begin.");
        const botMessage: ChatMessage = { id: `bot-${Date.now()}`, role: MessageRole.Assistant, text: response };
        setMessages([botMessage]);
        speak(response);
      } catch (e) {
        console.error("Failed to start conversation:", e);
        const errorMessage: ChatMessage = { id: 'error-start', role: MessageRole.Assistant, text: "Sorry, I couldn't start the exercise. Please go back and try again." };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    
    startConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea when userInput changes
  useEffect(() => {
    resizeTextarea();
  }, [userInput, resizeTextarea]);
  
  const handleEndConversation = async () => {
      if (!messages.some(m => m.role === MessageRole.User)) {
          // If user didn't say anything, just go back.
          onGoBack();
          return;
      }
      setIsGeneratingFeedback(true);
      try {
          const feedbackResult = await getConversationFeedback(messages);
          setFeedback(feedbackResult);
          speak(`Here is your feedback.`);
      } catch (error) {
          console.error("Error getting feedback:", error);
          // Show error in chat
          const errorMessage: ChatMessage = { id: 'error-feedback', role: MessageRole.Assistant, text: "Sorry, I couldn't generate your feedback right now." };
          setMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsGeneratingFeedback(false);
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text || !chat || isLoading) return;

    if (exercise.category === ExerciseCategory.Conversation) {
        const endKeywords = [
            "i'm done", "give me feedback", "end chat", "that's all", "end conversation", "stop now", "am done"
        ];
        const lowerText = text.toLowerCase();
        // Check for any end keyword or if the message ends with 'done' or contains ' done ' as a word
        const isEnd = endKeywords.some(kw => lowerText.includes(kw)) ||
            /\bdone\b/.test(lowerText);
        if (isEnd) {
            setUserInput('');
            handleEndConversation();
            return;
        }
    }

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: MessageRole.User, text };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage(text);
      const botMessage: ChatMessage = { id: `bot-${Date.now()}`, role: MessageRole.Assistant, text: response };
      setMessages(prev => [...prev, botMessage]);
      speak(response);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = { id: 'error-send', role: MessageRole.Assistant, text: "Sorry, something went wrong. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleListening = () => {
    if (!speechApi) return;
    if (isListening) {
      speechApi.recognition.stop();
    } else {
      setUserInput(''); // Clear input before starting new recognition
      speechApi.recognition.start();
    }
    setIsListening(!isListening);
  };
  
  if (isGeneratingFeedback) {
      return <Loader text="Analyzing your conversation..." />
  }

  if (feedback) {
      return <FeedbackCard feedback={feedback} onGoBack={onGoBack} />;
  }

  return (
    <div className="chat-container fade-in">
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <button 
          onClick={onGoBack} 
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
        <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.5rem' }}>{exercise.title}</h2>
        </div>
      </header>
      
      <ExerciseCard exercise={exercise} />

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '0.5rem',
            justifyContent: msg.role === MessageRole.User ? 'flex-end' : 'flex-start',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              maxWidth: '80%', 
              padding: '0.75rem', 
              borderRadius: '1rem', 
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              backgroundColor: msg.role === MessageRole.User ? '#4f46e5' : '#f3f4f6',
              color: msg.role === MessageRole.User ? 'white' : '#1f2937',
              borderBottomRightRadius: msg.role === MessageRole.User ? '0.25rem' : '1rem',
              borderBottomLeftRadius: msg.role === MessageRole.User ? '1rem' : '0.25rem',
              position: 'relative'
            }}>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{msg.text}</p>
              {msg.role === MessageRole.Assistant && isSpeaking && messages[messages.length - 1]?.id === msg.id && (
                <button
                  onClick={stopSpeaking}
                  style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    padding: '0.25rem',
                    color: '#ef4444',
                    background: 'white',
                    border: '2px solid #ef4444',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  aria-label="Stop AI speech"
                >
                  <VolumeX size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (messages[messages.length-1]?.role === MessageRole.User) && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', justifyContent: 'flex-start' }}>
                 <div style={{ 
                   maxWidth: '80%', 
                   padding: '0.75rem', 
                   borderRadius: '1rem', 
                   boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                   backgroundColor: '#f3f4f6',
                   color: '#1f2937',
                   borderBottomLeftRadius: '0.25rem'
                 }}>
                    <Loader text="" />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form ref={formRef} onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                // Auto-resize the textarea using the improved function
                requestAnimationFrame(() => {
                  resizeTextarea();
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (userInput.trim() && !isLoading) {
                    handleSendMessage(e as any);
                  }
                }
              }}
              placeholder="Type or speak..."
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingRight: '3rem',
                border: '1px solid #d1d5db',
                borderRadius: '1rem',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '48px',
                maxHeight: '120px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                backgroundColor: 'white'
              }}
              disabled={isLoading}
              rows={1}
            />
            <button
              type="button"
              onClick={toggleListening}
              style={{
                position: 'absolute',
                right: '0.25rem',
                bottom: '0.25rem',
                padding: '0.5rem',
                borderRadius: '50%',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isListening ? '#ef4444' : '#4f46e5',
                transition: 'background-color 0.3s ease'
              }}
              disabled={!speechApi}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              <Mic size={20} />
            </button>
          </div>
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: isLoading || !userInput.trim() ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              cursor: isLoading || !userInput.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.3s ease'
            }}
            disabled={isLoading || !userInput.trim()}
            aria-label="Send message"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationPractice;
