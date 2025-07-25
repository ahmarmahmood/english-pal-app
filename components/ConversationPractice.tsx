import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, ArrowLeft } from 'lucide-react';
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
  const [speechApi, setSpeechApi] = useState<{ recognition: any, synthesis: SpeechSynthesis } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speak = useCallback((text: string) => {
    if (!text || !isTtsEnabled || !speechApi?.synthesis) return;
    speechApi.synthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
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
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
      }, 10);
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
  }, []);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [userInput]);
  
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
        const endKeywords = ["i'm done", "give me feedback", "end chat", "that's all", "end conversation", "stop now"];
        if (endKeywords.some(kw => text.toLowerCase().includes(kw))) {
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
    <div className="flex flex-col h-full animate-fade-in">
      <header className="flex items-center mb-4 pb-2 border-b">
        <button onClick={onGoBack} className="p-2 text-gray-600 hover:text-dark-text" aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-dark-text truncate px-2">{exercise.title}</h2>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </header>
      
      <ExerciseCard exercise={exercise} />

      <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role === MessageRole.User ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.role === MessageRole.User ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-dark-text rounded-bl-none'}`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (messages[messages.length-1]?.role === MessageRole.User) && (
            <div className="flex items-end gap-2 justify-start">
                 <div className="max-w-[80%] p-3 rounded-2xl shadow-sm bg-gray-200 text-dark-text rounded-bl-none">
                    <Loader text="" />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form ref={formRef} onSubmit={handleSendMessage} className="mt-auto flex items-end gap-2">
        <div className="flex-grow relative">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              // Auto-resize the textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
            className="w-full p-3 pr-12 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden min-h-[48px] max-h-[120px]"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-1 bottom-1 p-2 rounded-full text-white transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-primary hover:bg-primary-hover'}`}
            disabled={!speechApi}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            <Mic size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="p-3 rounded-full bg-primary text-white disabled:bg-gray-400 shrink-0 transition-colors"
          disabled={isLoading || !userInput.trim()}
          aria-label="Send message"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default ConversationPractice;
