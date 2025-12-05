import { DAILY_TRACK, IPA_BASE } from '@env';
import { Feather, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useBackHandler } from '../lib/useBackHandler';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
  DAILY_TRACK: DAILY_TRACK,
};

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CHART_MARGIN_HORIZONTAL = -16;
const CHART_WIDTH = WINDOW_WIDTH - CHART_MARGIN_HORIZONTAL * 2;

// ============================================
// TYPES
// ============================================
type RootStackParamList = {
  Auth: undefined;
  DailyRoutine: undefined;
  UnlockFacialGym: undefined;
  FaceScan: undefined;
  FaceCoach: { token: string };
};

interface ScanData {
  id: number;
  image: string;
  jawline_angle: number;
  symmetry_score: number;
  puffiness_index: number;
  created_at: string;
}

interface Competitor {
  rank: string;
  name: string;
  score: number;
  trend: string;
}

interface LeaderboardData {
  your_rank: string;
  your_score: number;
  competitors: Competitor[];
}

interface GoalHit {
  title: string;
  status: string;
  target: string;
}
interface ProgressSummary {
  overall_progress: number;
  jawline_status: string;
  goals_hit: GoalHit[];
}



interface DashboardData {
  streak_days: number;
  graph_data: ScanData[];
  progress_summary: ProgressSummary;
  leaderboard: LeaderboardData;
  badges: any[];
  next_badge_in_days: number;
  consistency_text: string;
  comparison_text: string;
}

interface Goal {
  id: string;
  name: string;
  icon: string;
  current: number;
  target: number;
  unit: string;
  changePercent: number;
  chartData: number[];
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  change: number;
  score: number;
  isUser: boolean;
  trend: 'up' | 'down' | 'neutral';
}

// ============================
// Utility: generate last N day labels
// ============================
const generateLastNDates = (n: number): string[] => {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    arr.push(label);
  }
  return arr;
};

// ============================
// Transform API data to chart format
// ============================
const transformGraphData = (graphData: ScanData[]): Goal[] => {
  const jawlineData = graphData.map(item => item.jawline_angle);
  const symmetryData = graphData.map(item => item.symmetry_score);
  const puffinessData = graphData.map(item => item.puffiness_index);

  const latestScan = graphData[graphData.length - 1];

  return [
    {
      id: 'jawline',
      name: 'Jawline',
      icon: '#D69544',
      current: latestScan?.jawline_angle || 0,
      target: 132, // Default target, can be dynamic
      unit: '°',
      changePercent: 50, // Calculate based on data
      chartData: jawlineData,
    },
    {
      id: 'symmetry',
      name: 'Symmetry',
      icon: '#519659',
      current: latestScan?.symmetry_score || 0,
      target: 97,
      unit: '%',
      changePercent: 50,
      chartData: symmetryData,
    },
    {
      id: 'depuff',
      name: 'Depuff Progress',
      icon: '#60A5FB',
      current: latestScan?.puffiness_index || 0,
      target: 0.3,
      unit: '',
      changePercent: 50,
      chartData: puffinessData,
    },
  ];
};

const transformLeaderboard = (apiLeaderboard: LeaderboardData): LeaderboardEntry[] => {
  return apiLeaderboard.competitors.map((competitor, index) => {
    const trendValue = parseInt(competitor.trend.replace('+', ''));
    return {
      rank: parseInt(competitor.rank.replace('#', '')),
      name: competitor.name,
      change: trendValue,
      score: competitor.score,
      isUser: competitor.name === 'You',
      trend: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral'
    };
  });
};

// ============================================
// COMPONENTS
// ============================================
interface GoalChartProps {
  goal: Goal;
}

const GoalChart = ({ goal }: GoalChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<View | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [containerHeight, setContainerHeight] = useState(150);

  const pointsCount = Array.isArray(goal.chartData) ? goal.chartData.length : 0;
  const xLabels = generateLastNDates(pointsCount || 7);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#181C22',
    backgroundGradientTo: '#181C22',
    decimalPlaces: goal.unit === '' ? 2 : 0,
    color: (opacity = 1) =>
      goal.id === 'jawline'
        ? '#F59E0B'
        : goal.id === 'symmetry'
          ? '#10B981'
          : '#3B82F6',
    labelColor: () => 'transparent',
    strokeWidth: 2,
    propsForBackgroundLines: {
      strokeDasharray: '5, 5',
      stroke: '#374151',
      strokeWidth: 1,
    },
  };

  const getIndexByTouch = (touchX: number, totalWidth: number): number => {
    const available = totalWidth;
    if (pointsCount <= 1) return 0;
    const step = available / pointsCount;
    let idx = Math.floor(touchX / step);
    idx = Math.max(0, Math.min(pointsCount - 1, idx));
    return idx;
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height || 150);
  };

  const handleStartResponder = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const index = getIndexByTouch(x, CHART_WIDTH);
    setSelectedIndex(index);
    setTooltipPos({ x, y: evt.nativeEvent.locationY });
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setSelectedIndex(null), 2000);
    return true;
  };

  const handleMoveResponder = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    const index = getIndexByTouch(x, CHART_WIDTH);
    setSelectedIndex(index);
    setTooltipPos({ x, y: evt.nativeEvent.locationY });
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setSelectedIndex(null), 2000);
  };

  const handleReleaseResponder = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setSelectedIndex(null), 1000);
  };

  return (
    <View style={tw`mb-5`}>
      <View style={tw`flex-row items-center mb-1`}>
        <Text style={tw`text-base mr-2`}>
          <MaterialIcons name="show-chart" size={24} color={goal.icon} />
        </Text>
        <Text style={tw`text-white text-lg font-normal`}>
          {goal.name} ({goal.unit}) - {goal.current.toFixed(1)}
          {goal.unit} → {goal.target}
          {goal.unit} goal
        </Text>
      </View>

      <View
        ref={chartContainerRef}
        onLayout={onContainerLayout}
        style={[tw`overflow-hidden`, { width: CHART_WIDTH, alignSelf: 'center' }]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleStartResponder}
        onResponderMove={handleMoveResponder}
        onResponderRelease={handleReleaseResponder}
      >
        <LineChart
          data={{
            labels: xLabels,
            datasets: [{ data: goal.chartData.map((v: any) => Number(v)), strokeWidth: 2 }],
          }}
          width={CHART_WIDTH}
          height={containerHeight}
          chartConfig={chartConfig}
          bezier
          withDots={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          style={{ marginLeft: 0 }}
        />

        {selectedIndex !== null && selectedIndex >= 0 && (
          <View
            style={{
              position: 'absolute',
              left: Math.max(6, Math.min(CHART_WIDTH - 110, tooltipPos.x - 50)),
              top: 8,
              backgroundColor: '#0F1724',
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#374151',
              zIndex: 20,
            }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{xLabels[selectedIndex]}</Text>
            <Text style={{ color: '#60A5FB', fontWeight: '700', fontSize: 14 }}>
              {goal.chartData[selectedIndex].toFixed(goal.unit === '' ? 2 : 1)}
              {goal.unit}
            </Text>
          </View>
        )}
      </View>

      <Text style={tw`text-gray-400 text-sm mt-1`}>
        +{goal.changePercent}% vs last week
      </Text>
    </View>
  );
};

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
}

const LeaderboardEntry = ({ entry }: LeaderboardEntryProps) => {
  const getTrendColor = (): string => {
    if (entry.trend === 'up') return 'text-green-400 bg-green-400/20';
    if (entry.trend === 'down') return 'text-red-400 bg-red-400/20';
    return 'text-gray-400';
  };

  const getTrendSymbol = (): any => {
    if (entry.trend === 'up') return (<Feather name="arrow-up" size={15} color="green" />);
    if (entry.trend === 'down') return (<Feather name="arrow-down" size={15} color="red" />);
    return null;
  };

  return (
    <View style={tw`flex-row items-center justify-between py-3`}>
      <View style={tw`flex-row items-center flex-1`}>
        <Text style={tw`text-gray-400 text-base w-12`}>#{entry.rank}</Text>
        <Text style={tw`text-gray-400 text-base`}>{entry.name}</Text>
      </View>
      <View style={tw`flex-row items-center`}>
        {entry.change !== 0 && (
          <Text style={tw`${getTrendColor()} text-sm text-center font-bold rounded-2xl px-3 py-1`}>
            {getTrendSymbol()} {Math.abs(entry.change)}
          </Text>
        )}
        <Text style={tw`text-white font-bold text-lg w-12 text-right ml-2`}>{entry.score}</Text>
      </View>
    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DailyTrack = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get access token
      const accessToken = await AsyncStorage.getItem('token');
      setToken(accessToken);

      if (!accessToken) {
        navigation.navigate("Auth");
        return;
      }

      // Check network
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('No internet connection');
      }

      // Fetch dashboard data from API
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DAILY_TRACK}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Dashboard API Response:', result);

      // Handle 401 - Token expired
      if (response.status === 401) {
        await AsyncStorage.removeItem('token');
        Alert.alert(
          'Session Expired',
          'Please log in again',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
        return;
      }

      if (response.ok && result.success) {
        const apiData: DashboardData = result.data;
        setDashboardData(apiData);

        // Transform graph data to goals
        const transformedGoals = transformGraphData(apiData.graph_data);
        setGoals(transformedGoals);

        // Transform leaderboard
        const transformedLeaderboard = transformLeaderboard(apiData.leaderboard);
        setLeaderboardEntries(transformedLeaderboard);

      } else {
        throw new Error(result.message || 'Failed to load dashboard');
      }

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUser = async () => {
    await AsyncStorage.removeItem("isLoggedIn");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    ToastAndroid.showWithGravity(
      'Logout Successfully',
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
    navigation.navigate("Auth");
  };

  useBackHandler();

  const handleFaceCoachPress = () => {
    if (!token) {
      Alert.alert(
        'Authentication Required',
        'Please login again to access FaceCoach',
        [
          { text: 'Login', onPress: () => navigation.navigate("Auth") },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    navigation.navigate('FaceCoach', { token });
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
  if (error || !dashboardData) {
    return (
      <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center px-6`}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={tw`text-white text-xl font-bold mt-4 text-center`}>Oops! Something went wrong</Text>
        <Text style={tw`text-gray-400 text-sm mt-2 text-center`}>{error || 'Unable to load your data'}</Text>
        <TouchableOpacity style={tw`mt-6 bg-[#60A5FB] px-8 py-3 rounded-xl`} onPress={loadDashboardData}>
          <Text style={tw`text-white font-semibold text-base`}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }



  return (
    <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
      <StatusBar style="light" />
      <View style={tw`mb-2`}>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>Daily Progress</Text>
          <TouchableOpacity onPress={handleUser}>
            <MaterialIcons name="exit-to-app" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 4 }} showsVerticalScrollIndicator={false}>
        <View style={tw`pt-2`}>
          {/* Header */}
          <Text style={tw`text-white text-2xl font-bold mb-4`}>{dashboardData.badges}!</Text>

          {/* Streak Badge */}
          <View style={tw`bg-[#1E2532] p-3 rounded-full flex-row items-center self-start`}>
            <MaterialIcons name="local-fire-department" size={24} color="#60A5FB" />
            <Text style={tw`text-white text-lg font-normal ml-2`}>
              Streak: {dashboardData.streak_days} days
            </Text>
          </View>

          {/* Goal Progress Card */}
          <View style={tw`mt-5 bg-[#181C22] rounded-3xl p-5`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="flag" size={24} color="#60A5FB" />
              <Text style={tw`text-white text-lg font-semibold ml-2`}>Goal Progress</Text>
            </View>

            {goals.map((goal: Goal) => (
              <GoalChart key={goal.id} goal={goal} />
            ))}
          </View>

          {/* Overall Progress */}
          <View style={tw`mt-5`}>
            <Text style={tw`text-white text-xl font-bold mb-3`}>
              Toward Improve Symmetry, Sharper Jawline, Reduce Puffiness: {dashboardData.progress_summary.overall_progress}%
            </Text>
            <View style={tw`bg-gray-800 h-3 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`bg-[#60A5FB] h-full rounded-full`,
                  { width: `${dashboardData.progress_summary.overall_progress}%` }
                ]}
              />
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 leading-7`}>Next badge at {dashboardData.next_badge_in_days} days</Text>
            <Text style={tw`text-white text-xl mt-3`}>
              {dashboardData.consistency_text}
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-2`}>{dashboardData.comparison_text}</Text>
          </View>


          {/* Achievements */}
          {dashboardData.progress_summary.goals_hit.map((goalHit: GoalHit, index: number) =>
            <View key={index} style={tw`bg-[#181C22] rounded-2xl p-4 mt-4 flex-row items-center`}>
              <View style={tw`bg-[#60A5FB] w-10 h-10 rounded-full items-center justify-center mr-3`}>
                <Ionicons name="flag" size={20} color="black" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-xl font-bold`}>{goalHit.title} : {goalHit.status}</Text>
                <Text style={tw`text-white text-xl`}>({goalHit.target})</Text>
              </View>
            </View>

          )}
          {/* Leaderboard */}
          <View style={tw`my-5 bg-[#181C22] rounded-3xl p-5`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center`}>
                <FontAwesome6 name="chart-simple" size={24} color="#60A5FB" />
                <Text style={tw`text-white text-xl font-bold ml-2`}>Leaderboard (private)</Text>
              </View>
            </View>

            <View style={tw`flex-row items-center justify-between py-2`}>
              <Text style={tw`text-gray-400 text-xl`}>Your Rank</Text>
              <Text style={tw`text-white font-bold text-xl`}>
                {dashboardData.leaderboard.your_rank}
              </Text>
            </View>

            <View style={tw`flex-row justify-between py-2 mb-4`}>
              <Text style={tw`text-gray-400 text-base`}>Your Score</Text>
              <Text style={tw`text-white font-bold text-xl`}>
                {dashboardData.leaderboard.your_score}
              </Text>
            </View>

            {leaderboardEntries.map((entry: LeaderboardEntry) => (
              <LeaderboardEntry key={entry.rank} entry={entry} />
            ))}
          </View>

          {/* Bottom Buttons */}
          <View style={tw`bg-[#000000] mt-16`}>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity
                onPress={() => navigation.navigate("DailyRoutine")}
                style={tw`flex-1 bg-[#60A5FB] py-5 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-center text-base`}>Start Today's Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("FaceScan")}
                style={tw`flex-1 bg-[#1C1E26] border border-white/20 py-5 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-center text-base`}>Check-in Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FaceCoach Button */}
      <View>
        <TouchableOpacity
          onPress={handleFaceCoachPress}
          style={[
            tw`absolute bottom-20 right-0 px-4 py-4 rounded-2xl flex-row items-center justify-center`,
            {
              backgroundColor: 'rgba(0,0,0, 0.20',
              borderColor: 'rgba(255, 255, 255, 0.30)',
              borderWidth: 1,
            }
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color="white" />
          <Text style={tw`text-white text-lg font-semibold mx-1`}>Ask FaceCoach</Text>
          <FontAwesome5 name="robot" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DailyTrack;