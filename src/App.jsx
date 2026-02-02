
import { useState, useEffect } from 'react';
import { useSpeech } from './hooks/useSpeech';
import { getGeminiResponse } from './lib/brain';
import { curriculum, getTopicById } from './lib/curriculum';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import PersonalitySetup from './components/PersonalitySetup';
import { getLearnedWords, saveLearnedWord, getUserProfile } from './lib/db';
import { Icons } from './components/Icons';
import './App.css';

function App() {
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, error, inputVolume, isModelLoading } = useSpeech();

  // Auth & Profile State
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // App State
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('interview');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [translateInput, setTranslateInput] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const [activeVocabList, setActiveVocabList] = useState([]);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);

  // Mobile State
  const [mobileTab, setMobileTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Swipe Logic
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) setMobileTab('feedback');
    if (isRightSwipe) setMobileTab('chat');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setLoadingProfile(true);
      getUserProfile(session.user.id).then(profile => {
        if (profile) setUserProfile(profile);
        setLoadingProfile(false);
      });
    }
  }, [session]);

  const handleProfileComplete = (newProfile) => {
    setUserProfile(newProfile);
    setIsEditingProfile(false);
  };

  if (authLoading) return <div style={{ height: '100vh', background: 'transparent' }}></div>;
  if (!session) return <Login />;
  if (loadingProfile) return <div style={{ height: '100vh', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Profile...</div>;
  if (!userProfile) return <PersonalitySetup userId={session.user.id} onComplete={handleProfileComplete} initialData={userProfile} />;
  if (isEditingProfile) return <PersonalitySetup userId={session.user.id} onComplete={handleProfileComplete} initialData={userProfile} />;

  const startPractice = () => {
    const allTopics = Object.values(curriculum).flatMap(c => c.topics);
    const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    setMode('practice');
    setSelectedTopic(randomTopic.id);
    startSession(randomTopic.id, 'practice');
  };

  const startSimulationMode = () => {
    setMode('simulation_menu');
  };

  const startSession = (topicId, sessionMode, customVocab = null) => {
    const topic = getTopicById(topicId);
    if (!topic) return;

    const finalMode = sessionMode === 'practice' ? 'practice' : 'exam';
    setSelectedTopic(topicId);
    setMode(finalMode);
    setHistory([]);
    setLatestFeedback(null);
    setMobileTab('chat');
    setIsSidebarOpen(false);

    const currentVocab = customVocab || topic.vocabulary;
    setActiveVocabList(currentVocab);

    if (finalMode === 'practice') {
      const firstWord = currentVocab[0];
      setHistory([{ role: 'model', text: `Preparing lesson for "${firstWord}"...` }]);
      setIsProcessing(true);
      getGeminiResponse([], `START_DRILL_FOR:${firstWord}`, 'practice', topicId, currentVocab, userProfile).then(data => {
        setHistory([{ role: 'model', text: data.avatar_response }]);
        setLatestFeedback(data);
        speak(data.avatar_response);
        setIsProcessing(false);
      });
    } else {
      // Dynamic Greeting Variations
      const variations = [
        "Let's begin. Could you tell me a little about yourself?",
        "I've been expecting you. Shall we get started?",
        "Good to meet you. What brings you here today?",
        "Let's jump right in. How are you doing?",
        "I'm interested to hear your thoughts. Where should we start?",
        "Please, introduce yourself.",
        "Let's start the session. How can I help you?",
        "Tell me, what are your goals for this conversation?",
        "I'm ready when you are. Please proceed."
      ];
      const randomCloser = variations[Math.floor(Math.random() * variations.length)];
      const greeting = `Hello! I'm ${topic.roleName}, ${topic.role}. ${topic.scenario} ${randomCloser}`;

      setHistory([{ role: 'model', text: greeting }]);
      speak(greeting);
    }
  };

  const handleMicToggle = () => {
    if (isModelLoading || mode === 'simulation_menu' || mode === null) return;
    if (isListening) {
      stopListening();
      if (transcript.length > 0) handleSend(transcript);
    } else {
      startListening();
    }
  };

  const handleSend = async (text) => {
    setIsProcessing(true);
    const newHistory = [...history, { role: 'user', text }];
    setHistory(newHistory);

    const data = await getGeminiResponse(newHistory, text, mode, selectedTopic, activeVocabList, userProfile);
    setHistory(prev => [...prev, { role: 'model', text: data.avatar_response }]);
    setLatestFeedback(data);
    setIsProcessing(false);
    speak(data.avatar_response);

    if (session?.user && mode === 'practice' && data.current_word) {
      saveLearnedWord(session.user.id, data.current_word, selectedTopic);
    }
  };

  const goHome = () => {
    setMode(null);
    setSelectedTopic(null);
    setHistory([]);
    setLearnedVocab([]);
    setLatestFeedback(null);
    setActiveVocabList([]);
  };

  const handleTranslate = async () => {
    if (!translateInput.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: 'You are a translator. Indo to English, English to Indo. Just the translation.' }, { role: 'user', content: translateInput }],
          temperature: 0.3, max_tokens: 200
        }),
      });
      const data = await response.json();
      setTranslateResult(data.choices[0].message.content);
    } catch { setTranslateResult('Error'); }
    setIsTranslating(false);
  };

  const handleGenerateNewWords = async () => {
    if (isGeneratingWords || !selectedTopic) return;
    setIsGeneratingWords(true);
    try {
      const topic = getTopicById(selectedTopic);
      const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const knownWords = await getLearnedWords(session?.user?.id);

      const allExcludes = [...new Set([...activeVocabList, ...knownWords])];
      const recentExcludes = allExcludes.slice(-200);

      const profileContext = userProfile ? `User is a ${userProfile.english_level} level ${userProfile.profession}. Context: Daily Business Communication.` : '';
      const seed = Math.floor(Math.random() * 10000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system', content: `You are a Business Communication Expert. 
              Generate 10 PRACTICAL, HIGH-VALUE, and PROFESSIONAL English vocabulary words, phrasal verbs, or idioms that are FREQUENTLY USED in modern international business.
              Focus on IMPACTFUL terms like 'Leverage', 'Align', 'Touch base', 'Mitigate', 'Scalable', 'Consensus', 'Feasible', 'Benchmark'.
              ${profileContext}
              CONSTRAINT: DO NOT use basic words (like 'Meeting', 'Work', 'Job').
              CONSTRAINT: DO NOT use archaic, literary, or overly academic words used only in books.
              CONSTRAINT: Exclude: [${recentExcludes.join(', ')}].
              Return a JSON object with a "words" property containing the array of strings.` },
            { role: 'user', content: `Topic: ${topic.name}. Variation Seed: ${seed}. Generate words for modern business use.` }
          ],
          temperature: 0.7, // Lower temperature for more relevant/common business terms
          response_format: { type: "json_object" }
        }),
      });
      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      const newWords = content.words || content.vocabulary || [];

      if (newWords.length > 0) {
        startSession(selectedTopic, 'practice', newWords);
      } else {
        alert("Try again - AI returned no words.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating words. Please try again.");
    }
    setIsGeneratingWords(false);
  };

  // --- HOME SCREEN ---
  // Background removed to show Vanta
  if (!mode) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #58a6ff 0%, #3fb950 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', letterSpacing: '-1px', textShadow: '0 10px 30px rgba(88,166,255,0.2)' }}>English Pro</h1>
        <p style={{ color: '#8b949e', fontSize: '1.2rem', marginBottom: '4rem', textAlign: 'center', fontWeight: 300 }}>Master English with AI simulation</p>

        {/* User Info Widget */}
        {session && (
          <div className="profile-widget">
            <div className="profile-avatar">
              {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <div className="profile-name">{userProfile?.username || 'User'}</div>
              <div className="profile-role">{userProfile?.profession || 'Member'}</div>
            </div>
            <div className="profile-actions">
              <button className="action-btn edit" onClick={() => setIsEditingProfile(true)} title="Edit Profile"><Icons.Edit size={16} /></button>
              <button className="action-btn logout" onClick={() => supabase.auth.signOut()} title="Sign Out"><Icons.LogOut size={16} /></button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10 }}>
          <div onClick={startPractice} className="home-card glass-panel" style={{ width: '280px', padding: '3rem', background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '24px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.3)' }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#58a6ff', filter: 'drop-shadow(0 0 20px rgba(88,166,255,0.3))' }}><Icons.Target size={64} /></div>
            <h2 style={{ color: '#58a6ff', marginBottom: '1rem' }}>Practice Mode</h2>
            <p style={{ color: '#8b949e' }}>Vocabulary Drilling</p>
          </div>
          <div onClick={startSimulationMode} className="home-card glass-panel" style={{ width: '280px', padding: '3rem', background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '24px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'rgba(248,81,73,0.3)' }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#f85149', filter: 'drop-shadow(0 0 20px rgba(248,81,73,0.3))' }}><Icons.Flame size={64} /></div>
            <h2 style={{ color: '#f85149', marginBottom: '1rem' }}>Real Simulation</h2>
            <p style={{ color: '#8b949e' }}>Roleplay Scenarios</p>
          </div>
        </div>
      </div>
    );
  }

  // --- SIMULATION MENU ---
  if (mode === 'simulation_menu') {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div onClick={goHome} style={{ cursor: 'pointer', color: '#8b949e', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><Icons.ArrowLeft size={18} /> Back to Home</div>
          <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '2rem', fontWeight: 700 }}>Select a Scenario</h2>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '10px' }}>
            {Object.entries(curriculum).map(([key, cat]) => (
              <button key={key} onClick={() => setSelectedCategory(key)} style={{ padding: '0.8rem 1.8rem', borderRadius: '50px', border: '1px solid', borderColor: selectedCategory === key ? '#238636' : 'rgba(255,255,255,0.1)', background: selectedCategory === key ? 'rgba(35,134,54,0.2)' : 'rgba(255,255,255,0.05)', color: selectedCategory === key ? '#3fb950' : '#8b949e', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, transition: 'all 0.2s' }}>{cat.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {curriculum[selectedCategory]?.topics.map((topic) => (
              <div key={topic.id} onClick={() => startSession(topic.id, 'exam')} style={{ background: 'rgba(22, 27, 34, 0.60)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '2rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                <h3 style={{ color: '#f0f6fc', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{topic.name}</h3>
                <p style={{ color: '#8b949e', fontSize: '0.9rem', lineHeight: 1.5 }}>{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE SESSION ---
  const currentTopic = getTopicById(selectedTopic);
  const mobileSidebarClass = isSidebarOpen ? 'mobile-sidebar-open' : 'mobile-sidebar-closed';

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', background: 'transparent', overflow: 'hidden' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Mobile Top Bar */}
      <div className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white' }}><Icons.Menu size={24} /></button>
        <span>English Pro</span>
        <button onClick={goHome} style={{ color: '#f85149', background: 'none', border: 'none' }}><Icons.X size={24} /></button>
      </div>

      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="mobile-only"
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            zIndex: 9998
          }}
        />
      )}

      {/* LEFT SIDEBAR - Add glass */}
      <aside className={`sidebar-left ${mobileSidebarClass}`} style={{ width: '260px', background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(15px)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 9999 }}>
        <div className="desktop-only" onClick={goHome} style={{ cursor: 'pointer', color: '#8b949e', marginBottom: '2rem', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.ArrowLeft size={16} /> Exit Session</div>

        {/* NO CLOSE BUTTON - Click Backdrop to Close */}

        {currentTopic && (
          <>
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#f0f6fc', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{currentTopic.roleName}</div>
              <div style={{ color: '#58a6ff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{currentTopic.role}</div>
            </div>
            {mode === 'practice' && (
              <button onClick={() => { handleGenerateNewWords(); setIsSidebarOpen(false); }} disabled={isGeneratingWords}
                style={{ width: '100%', padding: '0.8rem', marginBottom: '2rem', borderRadius: '12px', border: '1px solid rgba(88,166,255,0.2)', background: 'rgba(88,166,255,0.1)', color: '#58a6ff', cursor: isGeneratingWords ? 'wait' : 'pointer', fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icons.Refresh size={18} className={isGeneratingWords ? 'spin' : ''} /> {isGeneratingWords ? 'Generating...' : 'New Words'}
              </button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#8b949e', fontSize: '0.7rem', marginBottom: '0.8rem', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.Globe size={14} /> QUICK TRANSLATE</div>
              <input type="text" value={translateInput} onChange={(e) => setTranslateInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} placeholder="Word or phrase..." style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: '0.8rem', boxSizing: 'border-box', outline: 'none' }} />
              <button onClick={handleTranslate} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#238636', color: 'white', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(35,134,54,0.3)' }}>Translate</button>
              {translateResult && <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>{translateResult}</div>}
            </div>
          </>
        )}
      </aside>

      {/* MAIN CONTENT - Ensure transparency */}
      <main className={`main-content ${mobileTab === 'chat' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'transparent' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>

          {mode === 'practice' && (
            <div className="mobile-only" style={{ marginBottom: '2rem', textAlign: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.75rem', color: '#58a6ff', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Practice Drill</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{latestFeedback?.current_word || '...'}</div>
            </div>
          )}

          <div className={`ai-visualizer ${isSpeaking ? 'active' : ''}`} style={{ marginBottom: '2rem', transform: 'scale(1.2)' }}>
            <div className="ai-ring"></div><div className="ai-ring"></div>
            <div className="ai-icon" style={{ color: isSpeaking ? '#58a6ff' : 'rgba(255,255,255,0.2)' }}><Icons.Mic size={32} /></div>
          </div>

          {history.length > 0 && history[history.length - 1].role === 'model' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', maxWidth: '700px', textAlign: 'center', color: '#f0f6fc', fontSize: '1.25rem', lineHeight: 1.6, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
              {history[history.length - 1].text.split('\n').map((line, i) => <div key={i} style={{ marginBottom: line.trim() ? '0.8rem' : '0' }}>{line}</div>)}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="input-area" style={{ padding: '2rem', background: 'transparent', borderTop: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '800px', margin: '0 auto', background: 'rgba(22, 27, 34, 0.8)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ flex: 1, padding: '0.5rem', color: transcript ? '#f0f6fc' : '#8b949e', fontSize: '1.1rem' }}>{isListening ? transcript || 'Listening...' : transcript || 'Click microphone to speak...'}</div>
            <button onClick={handleMicToggle} disabled={isProcessing} style={{ width: '64px', height: '64px', borderRadius: '50%', border: 'none', background: isListening ? '#f85149' : 'linear-gradient(135deg, #238636 0%, #2ea043 100%)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Icons.Mic size={32} />
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR - Add glass */}
      <aside className={`sidebar-right ${mobileTab === 'feedback' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ width: '340px', background: 'rgba(22, 27, 34, 0.6)', backdropFilter: 'blur(15px)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
        {mode === 'practice' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(35,134,54,0.2) 0%, rgba(31,111,235,0.2) 100%)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.5rem' }}>CURRENT WORD</div>
            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800, textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>{latestFeedback?.current_word || '...'}</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#f0f6fc', opacity: 0.7 }}>Word {latestFeedback?.word_number || 0} / {activeVocabList.length}</div>
          </div>
        )}

        {latestFeedback ? (
          <>
            {latestFeedback.correction && <div style={{ background: 'rgba(248,81,73,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(248,81,73,0.2)' }}><div style={{ color: '#f85149', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.XCircle size={16} /> Improvement</div><div style={{ fontSize: '1rem', lineHeight: 1.5 }}>{latestFeedback.correction}</div></div>}
            {latestFeedback.vocab_lesson && <div style={{ background: 'rgba(88,166,255,0.08)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(88,166,255,0.2)' }}><div style={{ color: '#58a6ff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icons.FileText size={16} /> Lesson</div><div style={{ fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{latestFeedback.vocab_lesson}</div></div>}
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3 }}>
            <div style={{ marginBottom: '1rem', color: '#8b949e' }}><Icons.FileText size={64} /></div>
            <div>Feedback Area</div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Tabs */}
      <div className="mobile-tabs">
        <button className={mobileTab === 'chat' ? 'active' : ''} onClick={() => setMobileTab('chat')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><Icons.Chat size={18} /> Chat</button>
        <button className={mobileTab === 'feedback' ? 'active' : ''} onClick={() => setMobileTab('feedback')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><Icons.FileText size={18} /> Feedback</button>
      </div>

    </div>
  );
}

export default App;
