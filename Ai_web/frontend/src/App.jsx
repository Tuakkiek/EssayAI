import { useState } from 'react';
import './App.css';

function App() {
  const [essayContent, setEssayContent] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

  const handleGradeEssay = async () => {
    if (!essayContent.trim()) {
      setError('Please enter your essay content first.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/essays/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essayContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grade essay. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Essay Grader</h1>
        <p>Get instant feedback and professional corrections for your academic writing.</p>
      </header>

      <main className="input-section">
        <textarea
          className="essay-textarea"
          placeholder="Paste or write your essay here (minimum 50 words recommended for better analysis)..."
          value={essayContent}
          onChange={(e) => setEssayContent(e.target.value)}
        />
        
        <div className="action-bar">
          <span className="word-count">Words: {getWordCount(essayContent)}</span>
          <button 
            onClick={handleGradeEssay} 
            disabled={isLoading || !essayContent.trim()}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="loader"></div>
                Analyzing...
              </div>
            ) : 'Grade Essay'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }}>
            {error}
          </div>
        )}
      </main>

      {result && (
        <section className="results-section">
          <div className="card">
            <h3>Overall Performance</h3>
            <div className="score-grid">
              <div className="score-item">
                <span className="score-value">{result.score.overall}/10</span>
                <span className="score-label">Overall</span>
              </div>
              <div className="score-item">
                <span className="score-value">{result.score.grammar}/10</span>
                <span className="score-label">Grammar</span>
              </div>
              <div className="score-item">
                <span className="score-value">{result.score.vocabulary}/10</span>
                <span className="score-label">Vocab</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Feedback</h3>
            <div>
              <h4 style={{ color: 'var(--success-color)', marginBottom: '0.5rem' }}>Strengths</h4>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>{result.feedback.strengths}</p>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ color: 'var(--warning-color)', marginBottom: '0.5rem' }}>Areas for Improvement</h4>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>{result.feedback.weaknesses}</p>
            </div>
          </div>

          {result.corrections && result.corrections.length > 0 && (
            <div className="card feedback-section">
              <h3>Specific Corrections</h3>
              <div className="corrections-list">
                {result.corrections.map((item, index) => (
                  <div key={index} className="correction-item">
                    <span className="original">"{item.original}"</span>
                    <span className="improvement">→ {item.improvement}</span>
                    <p className="reason">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
