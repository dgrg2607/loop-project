import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2D6A4F', '#C98A2C', '#C1432D', '#3D6B8C', '#7A5195', '#5C8A72'];

export default function ChannelPieChart({ data }) {
  if (!data.length) return <p className="empty-state">No channel data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="channel" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={entry.channel} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
