import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SentimentTrendChart({ data }) {
  if (!data.length) return <p className="empty-state">Not enough data yet — add some feedback first.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="positive" name="Positive" stroke="#2D6A4F" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#C98A2C" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="negative" name="Negative" stroke="#C1432D" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
