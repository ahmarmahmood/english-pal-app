
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
    <div className="container">
      <div className="main-content">
        <header className="header">
           <div style={{ width: '2rem' }}></div>
          <h1>English Pal</h1>
          <button 
            onClick={() => setIsTtsEnabled(prev => !prev)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '0.5rem'
            }} 
            aria-label={isTtsEnabled ? "Disable text to speech" : "Enable text to speech"}
          >
            {isTtsEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </header>

        <main style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
          {renderContent()}
        </main>

        <nav className="nav-bar">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <Icon size={28} />
              <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
