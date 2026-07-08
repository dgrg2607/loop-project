import { useRef, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const SUGGESTED = [
  'What are customers saying about pricing?',
  'Which feature gets the most complaints?',
  'What do customers love most?',
  'Any support issues this week?',
];

export default function AskAI() {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const ask = async (q) => {
    const text = (q || question).trim();
    if (!text) return;
    setLoading(true);
    setQuestion('');
    try {
      const res = await api.post('/ai/ask', { question: text });
      setHistory((h) => [...h, { question: text, ...res.data }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } };

  return (
    <div className="chat-root">
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Ask AI ✦</h1>
        <p style={{ color: 'var(--ink-60)', fontSize: '0.88rem' }}>
          Ask plain-English questions about your customer feedback. Answers are grounded in your actual data.
        </p>
      </div>

      <div className="chat-window">
        {history.length === 0 && !loading && (
          <div className="empty-state" style={{ paddingTop: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>✦</div>
            <p>Ask anything about your feedback data.</p>
            <p style={{ fontSize: '0.8rem', marginTop: 6 }}>Examples below to get you started.</p>
          </div>
        )}

        {history.map((h, i) => (
          <div key={i} className="chat-entry">
            <div className="chat-question-wrap">
              <div className="chat-question">{h.question}</div>
            </div>
            <div className="chat-answer-wrap">
              <div className="chat-ai-avatar">AI</div>
              <div>
                <div className="chat-answer">{h.answer}</div>
                {h.supportingFeedback?.length > 0 && (
                  <div className="supporting-list">
                    {h.supportingFeedback.map((f) => (
                      <div key={f.id} className="supporting-item">
                        <div className={`dot ${f.sentiment}`} />
                        <span>"{f.text.length > 100 ? f.text.slice(0, 100) + '…' : f.text}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-entry">
            <div className="chat-answer-wrap">
              <div className="chat-ai-avatar">AI</div>
              <div className="chat-answer">
                <div className="chat-typing">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {history.length === 0 && (
        <div className="suggested-qs">
          {SUGGESTED.map((q) => (
            <button key={q} className="suggested-q" onClick={() => ask(q)}>{q}</button>
          ))}
        </div>
      )}

      <div className="chat-input">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask a question about your feedback…"
          disabled={loading}
        />
        <button className="btn-primary" onClick={() => ask()} disabled={loading || !question.trim()}>
          {loading ? <span className="btn-spinner" /> : 'Ask →'}
        </button>
      </div>
    </div>
  );
}
