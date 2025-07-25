
import React, { useState, useEffect, useCallback } from 'react';
import { generateReadingStories } from '../services/openaiService';
import { Story } from '../types';
import Loader from './common/Loader';
import Card from './common/Card';
import ReadingStoryReader from './ReadingStoryReader';
import { BookOpen } from 'lucide-react';

const ReadingView: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedStories = await generateReadingStories();
      setStories(fetchedStories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch stories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
  };

  const handleGoBack = () => {
    setSelectedStory(null);
    // Optionally refetch stories for a new list
    fetchStories();
  };

  if (selectedStory) {
    return <ReadingStoryReader story={selectedStory} onBack={handleGoBack} />;
  }

  return (
    <div className="fade-in">
      <h2 className="section-title">Reading Practice</h2>
      <p className="section-subtitle">Select a story to test your pronunciation.</p>
      
      {isLoading && <Loader text="Finding stories for you..." />}
      {error && <div style={{ textAlign: 'center', color: '#ef4444', padding: '1rem' }}>{error}</div>}

      {!isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stories.map((story, index) => (
            <Card key={index} className="card">
              <button 
                onClick={() => handleSelectStory(story)} 
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                <div className="card-content">
                  <div className="card-icon">
                     <BookOpen size={24}/>
                  </div>
                  <div className="card-text">
                    <h3 className="card-title">{story.title}</h3>
                    <p className="card-description">{story.content}</p>
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingView;
