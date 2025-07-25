
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
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-dark-text mb-1 text-center">Reading Practice</h2>
      <p className="text-center text-gray-500 mb-6">Select a story to test your pronunciation.</p>
      
      {isLoading && <Loader text="Finding stories for you..." />}
      {error && <div className="text-center text-red-500 p-4">{error}</div>}

      {!isLoading && !error && (
        <div className="space-y-4">
          {stories.map((story, index) => (
            <Card key={index} className="hover:shadow-lg hover:border-primary border-transparent border-2 transition-all duration-300 cursor-pointer">
              <button onClick={() => handleSelectStory(story)} className="w-full text-left">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 text-secondary p-3 rounded-full">
                     <BookOpen size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-dark-text">{story.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{story.content}</p>
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
