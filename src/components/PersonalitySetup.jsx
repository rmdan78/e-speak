
import { useState } from 'react';
import { saveUserProfile } from '../lib/db';

const PersonalitySetup = ({ userId, onComplete, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        username: '',
        profession: '',
        english_level: 'Intermediate',
        goal: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const result = await saveUserProfile(userId, formData);

        // Check if result is empty (RLS Blocked) or Error
        if (!result || result.length === 0) {
            setLoading(false);
            setErrorMsg(
                <div style={{ background: '#3e1f1f', color: '#ff8b8b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #da3633' }}>
                    <strong>⚠️ Gagal Menyimpan Data (Database Blocked)</strong><br /><br />
                    Supabase memblokir penyimpanan ini. Kamu WAJIB menjalankan Script ini di <u>Supabase SQL Editor</u>:<br /><br />
                    <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', userSelect: 'all', fontFamily: 'monospace' }}>
                        alter table profiles enable row level security;<br />
                        create policy "User access" on profiles for all using (auth.uid() = id);
                    </code>
                </div>
            );
            return;
        }

        setLoading(false);
        onComplete(formData);
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#0d1117', color: '#f0f6fc', padding: '2rem'
        }}>
            <div style={{ width: '100%', maxWidth: '500px', background: '#161b22', padding: '2rem', borderRadius: '16px', border: '1px solid #30363d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, textAlign: 'center', color: '#58a6ff' }}>{initialData ? 'Update Profile' : 'Setup Your Profile'}</h2>
                    {initialData && <button type="button" onClick={() => onComplete(initialData)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>}
                </div>

                <p style={{ color: '#8b949e', marginBottom: '2rem', textAlign: 'center' }}>
                    Help the AI customize the learning experience for you.
                </p>

                {errorMsg}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name / Nickname</label>
                        <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: 'white' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Profession / Field</label>
                        <input required placeholder="e.g., Software Engineer, Marketing..." type="text" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: 'white' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>English Level</label>
                        <select value={formData.english_level} onChange={e => setFormData({ ...formData, english_level: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: 'white' }}>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                            <option>Native-like</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Main Goal</label>
                        <textarea required rows="3" placeholder="e.g., Prepare for job interview, improve daily conversation..." value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: 'white' }} />
                    </div>

                    <button type="submit" disabled={loading}
                        style={{ marginTop: '1rem', padding: '1rem', background: '#238636', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>
                        {loading ? 'Saving...' : (initialData ? 'Update Profile' : 'Start Learning')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PersonalitySetup;
