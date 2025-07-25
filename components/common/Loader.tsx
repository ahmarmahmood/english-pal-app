
import React from 'react';

const Loader: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
      {text && <p className="mt-4 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default Loader;
