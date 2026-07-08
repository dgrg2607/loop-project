import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLE_COLORS = {
  admin: 'var(--pos)',
  manager: 'var(--neu)',
  viewer: 'var(--ink-60)',
};

export default function Team() {
  const { user, organization } = useAuth();
  const toast = useToast();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then((res) => setTeam(res.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const updateRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const copyCode = () => {
    if (!organization?.inviteCode) return;
    navigator.clipboard.writeText(organization.inviteCode).then(() => {
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const initials = (name) => name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="team-header-row">
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Team</h1>
          <p style={{ color: 'var(--ink-60)', fontSize: '0.88rem' }}>
            Manage who has access to your workspace.
          </p>
        </div>
        <div className="invite-code-box">
          <div>
            <div className="invite-code-label">Invite code</div>
            <div className="invite-code-value">{organization?.inviteCode}</div>
          </div>
          <button className="invite-copy-btn" onClick={copyCode}>
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-60)' }}>Loading…</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--green-soft)', color: 'var(--green)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{member.name}</div>
                        {member._id === user?.id && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--ink-60)' }}>You</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-60)', fontSize: '0.83rem' }}>{member.email}</td>
                  <td>
                    <span className={`role-pill role-${member.role}`}>{member.role}</span>
                  </td>
                  <td style={{ color: 'var(--ink-60)', fontSize: '0.8rem' }}>
                    {new Date(member.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      {member._id !== user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => updateRole(member._id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="viewer">viewer</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-30)' }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
