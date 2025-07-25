
import React, { useState } from 'react';
import { BookOpen, Languages, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { AppTab } from './types';
import ReadingView from './components/ReadingView';
import TranslationView from './components/TranslationView';
import ChatView from './components/ChatView';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Reading);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  const navItems = [
    { id: AppTab.Reading, icon: BookOpen, label: 'Reading' },
    { id: AppTab.Translate, icon: Languages, label: 'Translate' },
    { id: AppTab.Chat, icon: MessageCircle, label: 'Chat' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.Reading:
        return <ReadingView />;
      case AppTab.Translate:
        return <TranslationView isTtsEnabled={isTtsEnabled} />;
      case AppTab.Chat:
        return <ChatView isTtsEnabled={isTtsEnabled} />;
      default:
        return <ReadingView />;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm h-[800px] max-h-[90vh] bg-light-bg text-dark-text font-sans rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <header className="p-4 flex justify-between items-center bg-primary text-white shadow-md z-10">
           <div className="w-8"></div> {/* Spacer */}
          <h1 className="text-xl font-bold">English Pal</h1>
          <button onClick={() => setIsTtsEnabled(prev => !prev)} className="text-white hover:text-gray-200 transition-colors" aria-label={isTtsEnabled ? "Disable text to speech" : "Enable text to speech"}>
            {isTtsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>

        <footer className="w-full bg-white shadow-top">
          <nav className="flex justify-around items-center h-20">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center justify-center w-full transition-colors duration-300 ${activeTab === id ? 'text-primary' : 'text-gray-400 hover:text-primary-hover'}`}
              >
                <Icon size={28} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default App;
