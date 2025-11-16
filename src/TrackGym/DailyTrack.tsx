import { FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

// ============================================
// API CONFIGURATION - CHANGE THESE VALUES
// ============================================
const API_CONFIG = {
  // Replace with your actual API endpoint
  BASE_URL: 'https://your-backend.com/api',

  // API Endpoints
  ENDPOINTS: {
    DAILY_PROGRESS: '/user/daily-progress',
    LEADERBOARD: '/user/leaderboard',
    ACHIEVEMENTS: '/user/achievements',
  },

  // Add your API key/token here
  API_KEY: 'your-api-key-here',

  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

// ============================================
// API SERVICE WITH ERROR HANDLING
// ============================================
const apiService = {
  //   // Helper function to make API calls
  async makeRequest(endpoint: string, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
          // ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API Request Error:', error);
      throw error;
    }
  },

  // Fetch daily progress data
  async fetchDailyProgress(userId: string) {
    try {
      const data = await this.makeRequest(
        `${API_CONFIG.ENDPOINTS.DAILY_PROGRESS}?userId=${userId}`
      );
      return data;
    } catch (error) {
      console.warn('Using mock data due to API error');
      return getMockData();
    }
  },

  // Fetch leaderboard data
  async fetchLeaderboard(userId: string) {
    try {
      const data = await this.makeRequest(
        `${API_CONFIG.ENDPOINTS.LEADERBOARD}?userId=${userId}`
      );
      return data;
    } catch (error) {
      console.warn('Using mock leaderboard data');
      return getMockLeaderboard();
    }
  },

  // Fetch achievements
  async fetchAchievements(userId: string) {
    try {
      const data = await this.makeRequest(
        `${API_CONFIG.ENDPOINTS.ACHIEVEMENTS}?userId=${userId}`
      );
      return data;
    } catch (error) {
      console.warn('Using mock achievements data');
      return getMockAchievements();
    }
  },
};

// ============================================
// MOCK DATA (Use while developing/testing)
// ============================================
const getMockData = () => ({
  dayCompleted: 1,
  streak: 1,
  goals: [
    {
      id: 'jawline',
      name: 'Jawline',
      icon: '#D69544',
      current: -130,
      target: 220,
      unit: '°',
      changePercent: 50,
      chartData: [-130, -40, 100, 170, 100, 190, 220],
    },
    {
      id: 'symmetry',
      name: 'Symmetry',
      icon: '#519659',
      current: 100,
      target: -97,
      unit: '%',
      changePercent: 50,
      chartData: [100, 50, 0, -90, -40, -90, -100],
    },
    {
      id: 'depuff',
      name: 'Depuff Progress',
      icon: "#60A5FB",
      current: 0.50,
      target: 0.50,
      unit: '%',
      changePercent: 50,
      chartData: [0.60, 0.90, 0.80, -0.90, 0.80, 0.90, 0.60],
    },
  ],
  overallProgress: 95,
  nextBadgeDays: 3,
  motivationMessage: 'Consistency shapes results keep going!',
  improvementMessage: 'Your face is 50% more defined than last week - keep it up!',
});

const getMockLeaderboard = () => ({
  userRank: 3,
  userScore: 53,
  entries: [
    { rank: 1, name: 'Last Week', change: 145, score: 145, isUser: false, trend: 'up' },
    { rank: 2, name: 'Best Week', change: 0, score: 145, isUser: false, trend: 'up' },
    { rank: 3, name: 'You', change: -92, score: 92, isUser: true, trend: 'down' },
  ],
});

const getMockAchievements = () => ([
  {
    id: 'jawline-complete',
    title: 'Sharper Jawline: 100% complete',
    subtitle: '(Goal 118°)',
    completed: true,
  },
]);

// ============================================
// COMPONENTS
// ============================================
const GoalChart = ({ goal }: any) => {
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#181C22',
    backgroundGradientTo: '#181C22',
    decimalPlaces: goal.unit === '' ? 2 : 0,
    color: (opacity = 1) => goal.id === 'jawline' ? '#F59E0B' : goal.id === 'symmetry' ? '#10B981' : '#3B82F6',
    labelColor: () => 'transparent',
    strokeWidth: 2,
    propsForBackgroundLines: {
      strokeDasharray: '5, 5',
      stroke: '#374151',
      strokeWidth: 1,
    },
  };

  return (
    <View style={tw``}>
      {/* Header */}
      <View style={tw`flex-row items-center `}>
        <Text style={tw`text-base mr-2`}><MaterialIcons name="show-chart" size={24} color={goal.icon} /></Text>
        <Text style={tw`text-white text-lg font-normal`}>
          {goal.name} ({goal.unit}) - {goal.current}{goal.unit} → {goal.target}{goal.unit} goal
        </Text>
      </View>

      {/* Chart */}
      <View style={tw`overflow-hidden`}>
        <LineChart
          data={{
            labels: ['', '', '', '', '', '', ''],
            datasets: [{ data: goal.chartData, strokeWidth: 2 }],
          }}
          width={width}
          height={120}
          chartConfig={chartConfig}
          bezier
          withDots={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          style={tw`-ml-0`}
        />
      </View>

      {/* Percentage */}
      <Text style={tw`text-gray-400 text-sm mt-1`}>
        +{goal.changePercent}% vs last week
      </Text>
    </View>
  );
};

const LeaderboardEntry = ({ entry }: any) => {
  const getTrendColor = () => {
    if (entry.trend === 'up') return 'text-green-400';
    if (entry.trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendSymbol = () => {
    if (entry.trend === 'up') return '↑';
    if (entry.trend === 'down') return '↓';
    return '';
  };

  return (
    <View style={tw`flex-row items-center justify-between py-3`}>
      <View style={tw`flex-row items-center flex-1`}>
        <Text style={tw`text-gray-400 text-[4] w-12`}>
          #{entry.rank}
        </Text>
        <Text style={tw`text-gray-400 text-[4]`}>
          {entry.name}
        </Text>
      </View>
      <View style={tw`flex-row items-center`}>
        {entry && (
          <Text style={tw`${getTrendColor()} text-xs font-bold  bg-[#56975E1A] rounded-2xl px-3 py-2`}>
            {getTrendSymbol()} {Math.abs(entry.change)}
          </Text>
        )}
        <Text style={tw`text-white font-bold text-base w-12 text-right`}>
          {entry.score}
        </Text>
      </View>

    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DailyTrack = () => {
  const navigation = useNavigation();

  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace with actual user ID from your auth system
  const userId = 'user123';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [progressData, leaderboardData, achievementsData] = await Promise.all([
        apiService?.fetchDailyProgress(userId),
        apiService?.fetchLeaderboard(userId),
        apiService?.fetchAchievements(userId),
      ]);

      setData(progressData);
      setLeaderboard(leaderboardData);
      setAchievements(achievementsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center`}>
        <ActivityIndicator size="large" color="#60A5FB" />
        <Text style={tw`text-white text-base mt-4`}>Loading your progress...</Text>
      </View>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center px-6`}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={tw`text-white text-xl font-bold mt-4 text-center`}>
          Oops! Something went wrong
        </Text>
        <Text style={tw`text-gray-400 text-sm mt-2 text-center`}>
          {error || 'Unable to load your data'}
        </Text>
        <TouchableOpacity
          style={tw`mt-6 bg-[#60A5FB] px-8 py-3 rounded-xl`}
          onPress={loadAllData}
        >
          <Text style={tw`text-white font-semibold text-base`}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#0D0F14]`}>
      <StatusBar style="light" />

      <ScrollView
        style={tw`flex-1 px-4`}
        contentContainerStyle={tw`pb-10`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw` pt-4`}>
          {/* Header */}
          <Text style={tw`text-white text-3xl font-bold mb-4`}>
            Day {data.dayCompleted} complete!
          </Text>

          {/* Streak Badge */}
          <View style={tw`bg-[#1E2532]  p-3 rounded-full flex-row items-center self-start`}>
            <Text style={tw`text-lg mr-2`}><MaterialIcons name="local-fire-department" size={24} color="#60A5FB" /></Text>
            <Text style={tw`text-white text-lg font-normal`}>
              Streak: {data.streak} days
            </Text>
          </View>

          {/* Goal Progress Card */}
          <View style={tw`mt-5 bg-[#181C22] rounded-3xl p-5`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Text style={tw`text-xl mr-2`}>
                <Ionicons name="flag" size={24} color="#60A5FB" />
              </Text>
              <Text style={tw`text-white text-lg font-semibold`}>
                Goal Progress
              </Text>
            </View>

            {data.goals.map((goal: any) => (
              <GoalChart key={goal.id} goal={goal} />
            ))}
          </View>

          {/* Overall Progress */}
          <View style={tw`mt-5`}>
            <Text style={tw`text-white text-xl font-bold mb-3`}>
              Toward Improve Symmetry, Sharper Jawline, Reduce Puffiness: {data.overallProgress}%
            </Text>
            <View style={tw`bg-gray-800 h-3 rounded-full overflow-hidden`}>
              <View
                style={[tw`bg-[#60A5FB] h-full rounded-full`, { width: `${data.overallProgress}%` }]}
              />
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 leading-7`}>
              Next badge at {data.nextBadgeDays} days
            </Text>
            <Text style={tw`text-white text-xl mt-3`}>{data.motivationMessage}</Text>
            <Text style={tw`text-gray-400 text-lg mt-2`}>{data.improvementMessage}</Text>
          </View>

          {/* Achievements */}
          {achievements.map((achievement: any) => (
            <View
              key={achievement.id}
              style={tw`bg-[#181C22] rounded-2xl p-4 mt-4 flex-row items-center`}
            >
              <View style={tw`bg-[#60A5FB] w-10 h-10 rounded-full items-center justify-center mr-3`}>
                <Ionicons name="flag" size={20} color="black" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-xl font-bold`}>{achievement.title}</Text>
                <Text style={tw`text-white text-xl`}>{achievement.subtitle}</Text>
              </View>
            </View>
          ))}

          {/* Leaderboard */}
          {leaderboard && (
            <View style={tw`mt-5 bg-[#181C22] rounded-3xl p-5`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <FontAwesome6 name="chart-simple" size={24} color="#60A5FB" />
                  <Text style={tw`text-white text-xl font-bold ml-2`}>
                    Leaderboard (private)
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={tw`text-[#60A5FB] text-lg font-medium`}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`flex-row justify-between py-2`}>
                <Text style={tw`text-gray-400 text-[4]`}>Your Rank</Text>
                <Text style={tw`text-white font-bold text-xl`}>#{leaderboard.userRank}</Text>
              </View>

              <View style={tw`flex-row justify-between py-2 mb-4`}>
                <Text style={tw`text-gray-400 text-[4]`}>Your Score</Text>
                <Text style={tw`text-white font-bold text-xl`}>{leaderboard.userScore}</Text>
              </View>

              {leaderboard.entries.map((entry: any) => (
                <LeaderboardEntry key={entry.rank} entry={entry} />
              ))}
            </View>
          )}
        </View>


        <View style={tw`  bg-[#0D0F14] pb-8`}>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("FaceCoach")}
            style={tw`bg-[#181C22] w-[50] self-end border border-white/20 p-4 my-3 rounded-2xl flex-row items-center justify-center`}
          >
            <MaterialCommunityIcons
              name="message-text-outline"
              size={24}
              color="white"
            />

            <Text style={tw`text-white text-sm font-medium mx-2`}>
              Ask FaceCoach
            </Text>
            <Ionicons name="chatbubble-ellipses" size={24}
              color="white" />

          </TouchableOpacity>

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity style={tw`flex-1 bg-[#60A5FB] py-4 rounded-2xl`}>
              <Text style={tw`text-white font-bold text-center text-lg`}>
                Start Today's Session
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-[#1C1E26] border border-white/20 px-6 py-4 rounded-2xl`}>
              <Text style={tw`text-white font-bold text-lg`}>Check-in Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DailyTrack;