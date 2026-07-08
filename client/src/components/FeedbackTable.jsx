const sentimentColor = { positive: '#2D6A4F', neutral: '#C98A2C', negative: '#C1432D' };

export default function FeedbackTable({ items, onDelete, canDelete }) {
  if (!items.length) return <p className="empty-state">No feedback found for these filters.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Channel</th>
            <th>Feedback</th>
            <th>Sentiment</th>
            <th>Themes</th>
            <th>Date</th>
            {canDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((fb) => (
            <tr key={fb._id}>
              <td>{fb.customerName}</td>
              <td><span className="badge">{fb.channel.replace('_', ' ')}</span></td>
              <td className="feedback-text">{fb.text}</td>
              <td>
                <span className="sentiment-pill" style={{ background: sentimentColor[fb.sentiment.label] }}>
                  {fb.sentiment.label}
                </span>
              </td>
              <td className="themes-cell">{fb.themes.join(', ')}</td>
              <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
              {canDelete && (
                <td><button className="btn-link danger" onClick={() => onDelete(fb._id)}>Delete</button></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
