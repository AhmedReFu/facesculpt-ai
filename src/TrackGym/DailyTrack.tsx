import { Award, ChevronRight, MessageCircle, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// ============================================
// API CONFIGURATION - PUT YOUR API ENDPOINT HERE
// ============================================
const API_CONFIG = {
  BASE_URL: 'https://your-api-endpoint.com/api', // Change this to your API
  ENDPOINTS: {
    DAILY_PROGRESS: '/daily-progress',
    LEADERBOARD: '/leaderboard',
    USER_STATS: '/user-stats'
  },
  // Add your API key if needed
  API_KEY: 'your-api-key-here'
};

// ============================================
// API SERVICE
// ============================================
const apiService = {
  async fetchDailyProgress(userId: any) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DAILY_PROGRESS}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily progress');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      // Return mock data if API fails
      return getMockData();
    }
  },

  async fetchLeaderboard() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERBOARD}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return getMockLeaderboard();
    }
  }
};

// ============================================
// MOCK DATA (Remove this when you have real API)
// ============================================
const getMockData = () => ({
  dayCompleted: 1,
  streak: 1,
  goals: [
    {
      id: 'jawline',
      name: 'Jawline',
      icon: '📐',
      current: 130,
      target: 118,
      unit: '°',
      changePercent: 60,
      chartData: [
        { day: 'Mon', value: 135 },
        { day: 'Tue', value: 133 },
        { day: 'Wed', value: 132 },
        { day: 'Thu', value: 131 },
        { day: 'Fri', value: 130 }
      ],
      color: '#F59E0B'
    },
    {
      id: 'symmetry',
      name: 'Symmetry',
      icon: '⚖️',
      current: 89,
      target: 97,
      unit: '%',
      changePercent: 50,
      chartData: [
        { day: 'Mon', value: 85 },
        { day: 'Tue', value: 86 },
        { day: 'Wed', value: 87 },
        { day: 'Thu', value: 88 },
        { day: 'Fri', value: 89 }
      ],
      color: '#10B981'
    },
    {
      id: 'depuff',
      name: 'Depuff Progress',
      icon: '💧',
      current: 0.54,
      target: 0.30,
      unit: '',
      changePercent: 0,
      chartData: [
        { day: 'Mon', value: 0.6 },
        { day: 'Tue', value: 0.52 },
        { day: 'Wed', value: 0.48 },
        { day: 'Thu', value: 0.56 },
        { day: 'Fri', value: 0.54 }
      ],
      color: '#3B82F6'
    }
  ],
  overallProgress: 95,
  nextBadgeDays: 3,
  motivationMessage: 'Consistency shapes results keep going!',
  improvementMessage: 'Your face is 50% more defined than last week - keep it up!',
  achievements: [
    {
      id: 'jawline-complete',
      title: 'Sharper Jawline: 100% complete',
      subtitle: '(Goal 118°)',
      completed: true
    }
  ]
});

const getMockLeaderboard = () => ({
  userRank: 3,
  userScore: 53,
  entries: [
    { rank: 1, name: 'Last Week', change: '+1M', score: 145, isUser: false, trend: 'up' },
    { rank: 2, name: 'Best Week', change: '+1M', score: 145, isUser: false, trend: 'up' },
    { rank: 3, name: 'You', change: '-97', score: 92, isUser: true, trend: 'down' }
  ]
});

// ============================================
// COMPONENTS
// ============================================
const GoalChart = ({ goal }: any) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{goal.icon}</span>
        <div className="flex-1">
          <h3 className="text-white font-medium text-sm">
            {goal.name} ({goal.unit}) - {goal.current}{goal.unit} {goal.target}{goal.unit} goal
          </h3>
        </div>
      </div>

      <div className="bg-[#0F1419] rounded-xl p-3 mb-2">
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={goal.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="day"
              stroke="#6B7280"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={10}
              tickLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={goal.color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className={`text-sm ${goal.changePercent > 0 ? 'text-green-400' : 'text-gray-400'}`}>
        {goal.changePercent > 0 ? '+' : ''}{goal.changePercent}% vs last week
      </p>
    </div>
  );
};

const LeaderboardEntry = ({ entry }: any) => {
  return (
    <div className={`flex items-center justify-between py-3 ${entry.rank !== 3 ? 'border-b border-gray-800' : ''}`}>
      <div className="flex items-center flex-1 gap-3">
        <span className={`text-gray-400 font-medium w-8 ${entry.isUser ? 'text-blue-400' : ''}`}>
          #{entry.rank}
        </span>
        <span className={`text-white ${entry.isUser ? 'font-semibold' : ''}`}>
          {entry.name}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-sm ${entry.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {entry.change}
        </span>
        <span className="text-white font-bold w-10 text-right">{entry.score}</span>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DailyTrack = () => {
  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressData, leaderboardData] = await Promise.all([
        apiService.fetchDailyProgress('user123'), // Replace with actual user ID
        apiService.fetchLeaderboard()
      ]);

      setData(progressData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Failed to load data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Scrollable Content */}
      <div className="pb-24 px-6 pt-14">
        {/* Header */}
        <h1 className="text-white text-3xl font-bold mt-4">
          Day {data.dayCompleted} complete!
        </h1>

        {/* Streak Badge */}
        <div className="bg-[#1E293B] px-4 py-2 rounded-full flex items-center self-start mt-4 inline-flex">
          <span className="text-2xl mr-2">🔥</span>
          <span className="text-white font-medium">Streak: {data.streak} days</span>
        </div>

        {/* Goal Progress Section */}
        <div className="mt-6 bg-[#1A1F2E] rounded-3xl p-5">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">🏁</span>
            <h2 className="text-white text-xl font-semibold">Goal Progress</h2>
          </div>

          {data.goals.map((goal: any) => (
            <GoalChart key={goal.id} goal={goal} />
          ))}
        </div>

        {/* Overall Progress */}
        <div className="mt-6">
          <h3 className="text-white text-lg font-semibold mb-3">
            Toward Improve Symmetry, Sharper Jawline, Reduce Puffiness: {data.overallProgress}%
          </h3>
          <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#60A5FB] h-full rounded-full transition-all duration-500"
              style={{ width: `${data.overallProgress}%` }}
            />
          </div>

          <p className="text-blue-400 text-sm mt-3 flex items-center gap-2">
            <Award size={16} />
            Next badge at {data.nextBadgeDays} days
          </p>

          <p className="text-white mt-3">{data.motivationMessage}</p>
          <p className="text-gray-400 text-sm mt-2">{data.improvementMessage}</p>
        </div>

        {/* Achievements */}
        {data.achievements.map((achievement: any) => (
          <div key={achievement.id} className="bg-[#1A1F2E] rounded-2xl p-4 mt-4 flex items-center">
            <div className="bg-[#60A5FB] w-12 h-12 rounded-full flex items-center justify-center mr-3">
              <Award className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold">{achievement.title}</h4>
              <p className="text-gray-400 text-sm">{achievement.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Leaderboard */}
        {leaderboard && (
          <div className="mt-6 bg-[#1A1F2E] rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="text-blue-400 mr-2" size={24} />
                <h2 className="text-white text-xl font-semibold">Leaderboard (private)</h2>
              </div>
              <button className="text-[#60A5FB] flex items-center gap-1 text-sm font-medium">
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex justify-between mb-3 pb-3 border-b border-gray-800">
              <span className="text-gray-400">Your Rank</span>
              <span className="text-white font-bold text-2xl">#{leaderboard.userRank}</span>
            </div>

            <div className="flex justify-between mb-5 pb-3 border-b border-gray-800">
              <span className="text-gray-400">Your Score</span>
              <span className="text-white font-bold text-2xl">{leaderboard.userScore}</span>
            </div>

            {leaderboard.entries.map((entry: any) => (
              <LeaderboardEntry key={entry.rank} entry={entry} />
            ))}
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-[#60A5FB] py-4 rounded-2xl hover:bg-[#5094EA] transition-colors">
            <span className="text-white font-semibold">Start Today's Session</span>
          </button>

          <button className="bg-[#1E293B] px-6 py-4 rounded-2xl hover:bg-[#2D3B4E] transition-colors">
            <span className="text-white font-semibold">Check-in Scan</span>
          </button>
        </div>
      </div>

      {/* Floating Ask FaceCoach Button */}
      <button
        className="fixed bottom-6 right-6 bg-[#1D2229] px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xl hover:bg-[#2A3038] transition-colors z-50"
        onClick={() => {/* Navigate to chat */ }}
      >
        <MessageCircle size={20} className="text-white" />
        <span className="text-white text-sm font-medium">Ask FaceCoach</span>
      </button>
    </div>
  );
};

export default DailyTrack;