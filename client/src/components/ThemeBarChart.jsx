import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ThemeBarChart({ data }) {
  if (!data.length) return <p className="empty-state">No themes detected yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis type="category" dataKey="theme" width={170} tick={{ fontSize: 12, fill: '#14213D' }} />
        <Tooltip />
        <Bar dataKey="count" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
