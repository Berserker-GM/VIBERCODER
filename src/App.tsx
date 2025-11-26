import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GenderSelection } from './components/GenderSelection';
import { DailyCheckIn } from './components/DailyCheckIn';
import { ChatBot } from './components/ChatBot';
import { DailyUplift } from './components/DailyUplift';
import { SoulNotes } from './components/SoulNotes';
import { EmpathyPillar } from './components/EmpathyPillar';
import { EmergencyContacts } from './components/EmergencyContacts';
import { MusicSuggestions } from './components/MusicSuggestions';
import { RelaxingGames } from './components/RelaxingGames';
import { PeriodTracker } from './components/PeriodTracker';
import {
  Zap,
  BookOpen,
  Users,
  Phone,
  Music,
  Gamepad2,
  Calendar,
  Flame,
  Sparkles,
  Heart,
  Smile,
  TrendingUp
} from 'lucide-react';
import { api } from './utils/api';

export default function App() {
  const [phase, setPhase] = useState<'welcome' | 'gender' | 'main'>('welcome');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState<'male' | 'female'>('female');
  const [streak, setStreak] = useState(0);
  const [todayMood, setTodayMood] = useState('');

  // Modal states
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showUplift, setShowUplift] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showEmpathy, setShowEmpathy] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showPeriodTracker, setShowPeriodTracker] = useState(false);

  useEffect(() => {
    // Check for persisted session
    const storedUserId = localStorage.getItem('moodglow_userId');
    const storedUserName = localStorage.getItem('moodglow_userName');
    const storedUserGender = localStorage.getItem('moodglow_userGender') as 'male' | 'female';

    if (storedUserId && storedUserName) {
      setUserId(storedUserId);
      setUserName(storedUserName);
      if (storedUserGender) setUserGender(storedUserGender);
      setPhase('main');
    }
  }, []);

  useEffect(() => {
    if (phase === 'main' && userId) {
      loadStreak();
      checkTodayCheckIn();
    }
  }, [phase, userId]);

  const handleLogout = () => {
    localStorage.removeItem('moodglow_userId');
    localStorage.removeItem('moodglow_userName');
    localStorage.removeItem('moodglow_userGender');
    setUserId('');
    setUserName('');
    setPhase('welcome');
    setStreak(0);
    setTodayMood('');
  };

  const loadStreak = async () => {
    try {
      const data = await api.getStreak(userId);
      setStreak(data.streak?.current || 0);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const checkTodayCheckIn = async () => {
    try {
      const data = await api.getCheckins(userId);
      const today = new Date().toISOString().split('T')[0];
      const todayCheckIn = data.checkins?.find((c: any) => c.date === today);

      if (todayCheckIn) {
        setTodayMood(todayCheckIn.emoji || '');
      }
    } catch (error) {
      console.error('Error checking today check-in:', error);
    }
  };

  const handleAuth = async (data: { name: string; password?: string; gender?: 'male' | 'female'; isLogin: boolean }) => {
    const { name, password, gender, isLogin } = data;

    if (isLogin) {
      // Login
      const result = await api.login(name, password || '');
      const { profile } = result;

      setUserId(profile.userId);
      setUserName(profile.name);
      setUserGender(profile.gender as 'male' | 'female');

      // Persist session
      localStorage.setItem('moodglow_userId', profile.userId);
      localStorage.setItem('moodglow_userName', profile.name);
      localStorage.setItem('moodglow_userGender', profile.gender);
    } else {
      // Signup
      const newUserId = `user_${Date.now()}`;
      await api.signup(newUserId, name, password || '', gender || 'not-specified');

      setUserId(newUserId);
      setUserName(name);
      if (gender) setUserGender(gender);

      // Persist session
      localStorage.setItem('moodglow_userId', newUserId);
      localStorage.setItem('moodglow_userName', name);
      if (gender) localStorage.setItem('moodglow_userGender', gender);
    }

    setPhase('main');
  };

  const handleCheckInComplete = async (data: { mood: string; emoji: string; answers: Record<string, string> }) => {
    try {
      await api.saveCheckin(userId, data);
      setTodayMood(data.emoji);
      await loadStreak();
      setShowCheckIn(false);
    } catch (error) {
      console.error('Error saving check-in:', error);
    }
  };

  if (phase === 'welcome') {
    return <WelcomeScreen onComplete={() => setPhase('gender')} />;
  }

  if (phase === 'gender') {
    return <GenderSelection onComplete={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl flex items-center gap-2">
              <Sparkles className="w-8 h-8" />
              MoodGlow
            </h1>
            <p className="text-purple-100">Welcome back, {userName}! ✨</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-300" />
                <span className="text-2xl">{streak}</span>
              </div>
              <p className="text-xs text-purple-100">Day Streak</p>
            </div>
            {todayMood && (
              <div className="text-center">
                <div className="text-3xl">{todayMood}</div>
                <p className="text-xs text-purple-100">Today's Mood</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4 text-gray-800">Daily Essentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCheckIn(true)}
              className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-2xl hover:scale-105 transition-transform shadow-lg"
            >
              <Smile className="w-10 h-10 mb-3" />
              <h3 className="text-xl mb-1">Daily Check-In</h3>
              <p className="text-sm text-blue-100">
                {todayMood ? 'Update your mood' : 'How are you feeling?'}
              </p>
            </button>

            <button
              onClick={() => setShowUplift(true)}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-6 rounded-2xl hover:scale-105 transition-transform shadow-lg"
            >
              <Zap className="w-10 h-10 mb-3" />
              <h3 className="text-xl mb-1">Daily Uplift</h3>
              <p className="text-sm text-orange-100">Get your daily affirmations</p>
            </button>

            <button
              onClick={() => setShowJournal(true)}
              className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-6 rounded-2xl hover:scale-105 transition-transform shadow-lg"
            >
              <BookOpen className="w-10 h-10 mb-3" />
              <h3 className="text-xl mb-1">Soul Notes</h3>
              <p className="text-sm text-purple-100">Write in your journal</p>
            </button>
          </div>
        </div>

        {/* Wellness Tools */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4 text-gray-800">Wellness Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowMusic(true)}
              className="bg-white p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-purple-400"
            >
              <Music className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-lg text-gray-800">Music</h3>
              <p className="text-sm text-gray-600">Mood-based playlists</p>
            </button>

            <button
              onClick={() => setShowGames(true)}
              className="bg-white p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-green-400"
            >
              <Gamepad2 className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-lg text-gray-800">Games</h3>
              <p className="text-sm text-gray-600">Relaxing activities</p>
            </button>

            <button
              onClick={() => setShowEmpathy(true)}
              className="bg-white p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-blue-400"
            >
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg text-gray-800">Empathy Pillar</h3>
              <p className="text-sm text-gray-600">Connect with others</p>
            </button>

            <button
              onClick={() => setShowContacts(true)}
              className="bg-white p-6 rounded-2xl hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-red-400"
            >
              <Phone className="w-8 h-8 text-red-600 mb-3" />
              <h3 className="text-lg text-gray-800">Emergency</h3>
              <p className="text-sm text-gray-600">Support contacts</p>
            </button>
          </div>
        </div>

        {/* Period Tracker (Female Only) */}
        {userGender === 'female' && (
          <div className="mb-8">
            <h2 className="text-2xl mb-4 text-gray-800">Cycle Tracking</h2>
            <button
              onClick={() => setShowPeriodTracker(true)}
              className="w-full bg-gradient-to-br from-pink-400 to-rose-500 text-white p-6 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Calendar className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="text-xl mb-1">Period Tracker</h3>
                  <p className="text-sm text-pink-100">Track your cycle and predict next period</p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Inspirational Quote */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-8 text-center border border-indigo-200">
          <Heart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <p className="text-xl text-gray-800 italic mb-2">
            "You are braver than you believe, stronger than you seem, and smarter than you think."
          </p>
          <p className="text-gray-600">— A.A. Milne</p>
        </div>
      </div>

      {/* Modals */}
      {showCheckIn && (
        <DailyCheckIn
          onComplete={handleCheckInComplete}
          onClose={() => setShowCheckIn(false)}
        />
      )}
      {showUplift && <DailyUplift onClose={() => setShowUplift(false)} />}
      {showJournal && <SoulNotes userId={userId} onClose={() => setShowJournal(false)} />}
      {showEmpathy && <EmpathyPillar onClose={() => setShowEmpathy(false)} />}
      {showContacts && <EmergencyContacts userId={userId} onClose={() => setShowContacts(false)} />}
      {showMusic && <MusicSuggestions mood={todayMood} onClose={() => setShowMusic(false)} />}
      {showGames && <RelaxingGames onClose={() => setShowGames(false)} />}
      {showPeriodTracker && userGender === 'female' && (
        <PeriodTracker userId={userId} onClose={() => setShowPeriodTracker(false)} />
      )}

      {/* Chatbot */}
      <ChatBot />
    </div>
  );
}
