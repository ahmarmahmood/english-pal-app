
import React from 'react';

const Loader: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => {
  return (
    <div className="loader">
      {text && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>{text}</p>}
    </div>
  );
};

export default Loader;
