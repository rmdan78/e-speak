
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgot, setIsForgot] = useState(false);
    const [msg, setMsg] = useState('');
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            if (isForgot) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                setMsg('✅ Reset link sent! Check your email.');
                setLoading(false);
                return;
            }

            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({ email, password });

                if (error) {
                    if (error.message.toLowerCase().includes("already registered")) {
                        setIsSignUp(false);
                        throw new Error("Email ini sudah terdaftar! Silakan Login.");
                    }
                    throw error;
                }
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setIsSignUp(false);
                    throw new Error("Email ini sudah terdaftar! Silakan Login.");
                }
                if (data.user) {
                    setMsg('✅ Akun berhasil dibuat! Sedang masuk...');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message.includes('Invalid login')) throw new Error("Email atau Password salah.");
                    throw error;
                }
            }
        } catch (error) {
            setMsg(`❌ ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent', // Transparent to show Vanta Background
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background Animations (Keep subtle floating glow) */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%', filter: 'blur(80px)', animation: 'float 10s infinite ease-in-out',
                zIndex: -1
            }}></div>
            <style>{`
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .glass-card {
                    background: rgba(22, 27, 34, 0.65);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                }
                .input-field:focus {
                    border-color: #58a6ff !important;
                    box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.15);
                    background: rgba(13, 17, 23, 0.8) !important;
                }
            `}</style>

            <div className="glass-card" style={{
                width: '100%', maxWidth: '420px', padding: '0', borderRadius: '24px',
                opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                overflow: 'hidden',
                zIndex: 10
            }}>
                {/* Header Image / Gradient */}
                <div style={{
                    height: '140px',
                    background: isForgot ? 'linear-gradient(135deg, #f85149, #da3633)' : (isSignUp ? 'linear-gradient(135deg, #2ea043, #238636)' : 'linear-gradient(135deg, #1f6feb, #58a6ff)'),
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.5s ease'
                }}>
                    <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        {isForgot ? 'Reset Password' : 'English Pro'}
                    </h1>
                    <div style={{ position: 'absolute', bottom: '-20px', width: '100%', height: '40px', background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(24px)', borderTopLeftRadius: '50%', borderTopRightRadius: '50%' }}></div>
                </div>

                <div style={{ padding: '2rem 2.5rem 2.5rem 2.5rem' }}>

                    {!isForgot ? (
                        <div style={{ display: 'flex', background: 'rgba(13, 17, 23, 0.5)', padding: '4px', borderRadius: '12px', marginBottom: '2rem' }}>
                            <button onClick={() => { setIsSignUp(false); setMsg(''); }}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: !isSignUp ? '#21262d' : 'transparent', color: !isSignUp ? 'white' : '#8b949e', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
                                Sign In
                            </button>
                            <button onClick={() => { setIsSignUp(true); setMsg(''); }}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: isSignUp ? '#21262d' : 'transparent', color: isSignUp ? 'white' : '#8b949e', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
                                Sign Up
                            </button>
                        </div>
                    ) : (
                        <p style={{ color: '#8b949e', textAlign: 'center', marginBottom: '1.5rem' }}>Enter your email to receive a password reset link.</p>
                    )}

                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem', marginLeft: '4px' }}>Email Address</label>
                            <input
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="input-field" placeholder="you@example.com"
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(48, 54, 61, 0.5)', background: 'rgba(13, 17, 23, 0.4)', color: 'white', outline: 'none', transition: 'all 0.3s', fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>

                        {!isForgot && (
                            <div>
                                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem', marginLeft: '4px' }}>Password</label>
                                <input
                                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="input-field" placeholder="••••••••"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(48, 54, 61, 0.5)', background: 'rgba(13, 17, 23, 0.4)', color: 'white', outline: 'none', transition: 'all 0.3s', fontSize: '1rem', boxSizing: 'border-box' }}
                                />
                                {!isSignUp && (
                                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                        <span onClick={() => { setIsForgot(true); setMsg(''); }}
                                            style={{ color: '#58a6ff', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.8 }}>
                                            Forgot Password?
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {msg && <div style={{
                            padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center',
                            background: msg.includes('✅') ? 'rgba(35, 134, 54, 0.2)' : 'rgba(218, 54, 51, 0.2)',
                            color: msg.includes('✅') ? '#3fb950' : '#f85149',
                            border: msg.includes('✅') ? '1px solid rgba(63, 185, 80, 0.3)' : '1px solid rgba(248, 81, 73, 0.3)',
                            animation: 'fadeIn 0.3s ease'
                        }}>{msg}</div>}

                        <button type="submit" disabled={loading}
                            style={{
                                marginTop: '0.5rem', padding: '1.2rem',
                                background: isForgot ? '#da3633' : (isSignUp ? 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' : 'linear-gradient(135deg, #1f6feb 0%, #58a6ff 100%)'),
                                color: 'white', border: 'none', borderRadius: '14px',
                                fontSize: '1.1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                                boxShadow: isSignUp ? '0 8px 20px rgba(46, 160, 67, 0.3)' : '0 8px 20px rgba(31, 111, 235, 0.3)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                transform: loading ? 'scale(0.98)' : 'scale(1)'
                            }}
                            onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {loading ? <span style={{ opacity: 0.7 }}>Processing...</span> : (isForgot ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In'))}
                        </button>

                        {isForgot && (
                            <button type="button" onClick={() => { setIsForgot(false); setMsg(''); }}
                                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Back to Login
                            </button>
                        )}
                    </form>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: '2rem', color: '#484f58', fontSize: '0.8rem', letterSpacing: '1px' }}>SECURE ACCESS v1.0</div>
        </div>
    );
};

export default Login;
