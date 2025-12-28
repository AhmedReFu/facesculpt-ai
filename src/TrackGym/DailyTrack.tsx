import { DAILY_TRACK, IPA_BASE, LOG_OUT } from '@env';
import { Feather, FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import apiClient from '../api/apiClient';
import { useBackHandler } from '../hooks/useBackHandler';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
  DAILY_TRACK: DAILY_TRACK,
  LOG_OUT: LOG_OUT
};

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CHART_MARGIN_HORIZONTAL = -16;
const CHART_WIDTH = WINDOW_WIDTH - CHART_MARGIN_HORIZONTAL * 2;

// ============================================
// TYPES
// ============================================
type RootStackParamList = {
  Auth: undefined;
  FaceScanWithDetection: undefined;
  DailyRoutine: undefined;
  UnlockFacialGym: undefined;
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
// UTILITY FUNCTIONS
// ============================
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return Number(value).toFixed(decimals);
};

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

const transformGraphData = (graphData: ScanData[]): Goal[] => {
  if (!Array.isArray(graphData) || graphData.length === 0) {
    return getDefaultGoals();
  }

  const safeMapValues = (data: ScanData[], key: keyof ScanData): number[] => {
    return data
      .map(item => {
        const value = item[key];
        return typeof value === 'number' && !isNaN(value) ? value : null;
      })
      .filter((v): v is number => v !== null);
  };

  const jawlineData = safeMapValues(graphData, 'jawline_angle');
  const symmetryData = safeMapValues(graphData, 'symmetry_score');
  const puffinessData = safeMapValues(graphData, 'puffiness_index');

  const latestScan = graphData[graphData.length - 1];

  return [
    {
      id: 'jawline',
      name: 'Jawline',
      icon: '#D69544',
      current: latestScan?.jawline_angle ?? 0,
      target: 132,
      unit: '°',
      changePercent: 50,
      chartData: jawlineData.length > 0 ? jawlineData : [0],
    },
    {
      id: 'symmetry',
      name: 'Symmetry',
      icon: '#519659',
      current: latestScan?.symmetry_score ?? 0,
      target: 97,
      unit: '%',
      changePercent: 50,
      chartData: symmetryData.length > 0 ? symmetryData : [0],
    },
    {
      id: 'depuff',
      name: 'Depuff Progress',
      icon: '#60A5FB',
      current: latestScan?.puffiness_index ?? 0,
      target: 0.3,
      unit: '',
      changePercent: 50,
      chartData: puffinessData.length > 0 ? puffinessData : [0],
    },
  ];
};

const getDefaultGoals = (): Goal[] => {
  return [
    {
      id: 'jawline',
      name: 'Jawline',
      icon: '#D69544',
      current: 0,
      target: 132,
      unit: '°',
      changePercent: 0,
      chartData: [0],
    },
    {
      id: 'symmetry',
      name: 'Symmetry',
      icon: '#519659',
      current: 0,
      target: 97,
      unit: '%',
      changePercent: 0,
      chartData: [0],
    },
    {
      id: 'depuff',
      name: 'Depuff Progress',
      icon: '#60A5FB',
      current: 0,
      target: 0.3,
      unit: '',
      changePercent: 0,
      chartData: [0],
    },
  ];
};

const transformLeaderboard = (apiLeaderboard: LeaderboardData): LeaderboardEntry[] => {
  if (!apiLeaderboard || !Array.isArray(apiLeaderboard.competitors)) {
    return [];
  }

  return apiLeaderboard.competitors.map((competitor) => {
    const trendValue = parseInt(competitor.trend.replace('+', '')) || 0;
    return {
      rank: parseInt(competitor.rank.replace('#', '')) || 0,
      name: competitor.name || 'Unknown',
      change: trendValue,
      score: competitor.score || 0,
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

  const safeChartData = Array.isArray(goal.chartData) && goal.chartData.length > 0
    ? goal.chartData.map(v => typeof v === 'number' && !isNaN(v) ? v : 0)
    : [0];

  const pointsCount = safeChartData.length;
  const xLabels = generateLastNDates(pointsCount);

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

  const currentValue = goal.current ?? 0;
  const displayCurrent = safeToFixed(currentValue, goal.unit === '' ? 2 : 1);

  return (
    <View style={tw`mb-5`}>
      <View style={tw`flex-row items-center mb-1`}>
        <Text style={tw`text-base mr-2`}>
          <MaterialIcons name="show-chart" size={24} color={goal.icon} />
        </Text>
        <Text style={tw`text-white text-lg font-normal`}>
          {goal.name} ({goal.unit}) - {displayCurrent}
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
            datasets: [{ data: safeChartData, strokeWidth: 2 }],
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

        {selectedIndex !== null && selectedIndex >= 0 && selectedIndex < safeChartData.length && (
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
              {safeToFixed(safeChartData[selectedIndex], goal.unit === '' ? 2 : 1)}
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
  const toast = useToast();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();


  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    loadDashboardData();
  }, []);



  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      setRefreshToken(refreshToken)
      const subscribe = await AsyncStorage.getItem("subscribe");
      // setIsSubscribed(subscribe)
      setToken(accessToken);

      if (!accessToken) {
        toast.show({
          message: 'Authentication Required Please log in to continue',
          type: 'warning',
          style: 'center',
          buttons: [
            {
              text: 'OK',
              action: 'custom',
              onPress: () => (navigation as any).navigate('Auth')
            }
          ]
        })
        return;
      }

      if (!subscribe) {
        navigation.navigate("UnlockFacialGym");
        return;
      }

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('No internet connection');
      }


      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DAILY_TRACK}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      const customer = await Purchases.getCustomerInfo();
      console.log(customer.entitlements.active)
      if (customer.entitlements.active.isSandbox) {
        await AsyncStorage.setItem("subscribe", "true")
        console.log("User has active premium subscription");
        console.log("Premium entitlement:", customer.entitlements.active.premium);

      // Check if subscription is active
      // if (customer.entitlements.active.premium.isActive) {
      //   console.log("Premium subscription is active");

        //   // Get subscription expiration date
        //   const expirationDate = customer.entitlements.active.premium.expirationDate;
        //   console.log("Expiration date:", expirationDate);
        // }
       }

      // // You can also check active subscriptions
      // if (customer.activeSubscriptions && customer.activeSubscriptions.length > 0) {
      //   console.log("Active subscriptions:", customer.activeSubscriptions);
      // }

      // const premium = offerings?.current || offerings?.all?.premium;
      if (response.status === 401) {
        await AsyncStorage.removeItem('token');
        toast.show({
          message: 'Session Expired Please log in again',
          type: 'error',
          style: 'center',
          buttons: [
            {
              text: 'OK',
              action: 'custom',
              onPress: () => (navigation as any).navigate('Auth')
            }
          ]
        })
        return;
      }

      if (response.ok && result.success) {
        const apiData: DashboardData = result.data;
        setDashboardData(apiData);

        const transformedGoals = transformGraphData(apiData.graph_data || []);
        setGoals(transformedGoals);

        const transformedLeaderboard = transformLeaderboard(apiData.leaderboard);
        setLeaderboardEntries(transformedLeaderboard);

      } else if (result.message === "PAYMENT_REQUIRED") {
        navigation.navigate("UnlockFacialGym")
      }
      else {
        console.log("error here")
        throw new Error(result.message || 'Failed to load dashboard');
      }

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      navigation.navigate("Auth")
      await AsyncStorage.removeItem('refresh_token',);
      await AsyncStorage.removeItem("subscribe")
      await AsyncStorage.removeItem('isLoggedIn',);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUser = async () => {
    await AsyncStorage.removeItem("isLoggedIn");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");


    toast.show({
      message: 'Logout successfully',
      type: 'warning',
      style: 'top',
      duration: 3000
    });

    const bodyPayLoad = {
      refresh: refreshToken
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOG_OUT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bodyPayLoad)
    });
    const result = await response.json();
    if (result.success) {
      navigation.navigate("Auth");
    }
  };

  useBackHandler();

  const handleFaceCoachPress = () => {
    if (!token) {
      toast.show({
        message: 'Authentication Required Please login again to access FaceCoach',
        type: 'warning',
        style: 'center',
        buttons: [
          {
            text: 'OK',
            action: 'custom',
            onPress: () => (navigation as any).navigate('Auth')
          }
        ]
      })
      return;
    }
    navigation.navigate('FaceCoach', { token });
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center`}>
        <ActivityIndicator size="large" color="#60A5FB" />
        <Text style={tw`text-white text-base mt-4`}>Loading your progress...</Text>
      </View>
    );
  }

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
          <View style={tw`bg-[#000000] my-4`}>
            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity
                onPress={() => navigation.navigate("DailyRoutine")}
                style={tw`flex-1 bg-[#60A5FB] py-5 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-center text-base`}>Start Today's Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("FaceScanWithDetection")}
                style={tw`flex-1 bg-[#1C1E26] border border-white/20 py-5 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-center text-base`}>Check-in Scan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={tw`text-white text-2xl font-bold my-4`}>{dashboardData.badges || 'Day 0 Complete'}!</Text>

          <View style={tw`bg-[#1E2532] p-3 rounded-full flex-row items-center self-start`}>
            <MaterialIcons name="local-fire-department" size={24} color="#60A5FB" />
            <Text style={tw`text-white text-lg font-normal ml-2`}>
              Streak: {dashboardData.streak_days || 0} days
            </Text>
          </View>

          <View style={tw`mt-5 bg-[#181C22] rounded-3xl p-5`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="flag" size={24} color="#60A5FB" />
              <Text style={tw`text-white text-lg font-semibold ml-2`}>Goal Progress</Text>
            </View>

            {goals.length > 0 ? (
              goals.map((goal: Goal) => (
                <GoalChart key={goal.id} goal={goal} />
              ))
            ) : (
              <View style={tw`py-8 items-center`}>
                <Ionicons name="stats-chart-outline" size={48} color="#374151" />
                <Text style={tw`text-gray-400 text-base mt-3`}>No chart data available yet</Text>
                <Text style={tw`text-gray-500 text-sm mt-1`}>Complete a face scan to see your progress</Text>
              </View>
            )}
          </View>

          <View style={tw`mt-5`}>
            <Text style={tw`text-white text-xl font-bold mb-3`}>
              Toward Improve Symmetry, Sharper Jawline, Reduce Puffiness: {dashboardData.progress_summary?.overall_progress || 0}%
            </Text>
            <View style={tw`bg-gray-800 h-3 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`bg-[#60A5FB] h-full rounded-full`,
                  { width: `${dashboardData.progress_summary?.overall_progress || 0}%` }
                ]}
              />
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 leading-7`}>
              Next badge at {dashboardData.next_badge_in_days || 0} days
            </Text>
            <Text style={tw`text-white text-xl mt-3`}>
              {dashboardData.consistency_text || ''}
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-2`}>
              {dashboardData.comparison_text || ''}
            </Text>
          </View>

          {dashboardData.progress_summary?.goals_hit?.map((goalHit: GoalHit, index: number) => (
            <View key={index} style={tw`bg-[#181C22] rounded-2xl p-4 mt-4 flex-row items-center`}>
              <View style={tw`bg-[#60A5FB] w-10 h-10 rounded-full items-center justify-center mr-3`}>
                <Ionicons name="flag" size={20} color="black" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-xl font-bold`}>{goalHit.title}: {goalHit.status}</Text>
                <Text style={tw`text-white text-xl`}>({goalHit.target})</Text>
              </View>
            </View>
          ))}

          <View style={tw`my-5 bg-[#181C22] rounded-3xl p-5 mb-20`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center`}>
                <FontAwesome6 name="chart-simple" size={24} color="#60A5FB" />
                <Text style={tw`text-white text-xl font-bold ml-2`}>Leaderboard (private)</Text>
              </View>
            </View>

            <View style={tw`flex-row items-center justify-between py-2`}>
              <Text style={tw`text-gray-400 text-xl`}>Your Rank</Text>
              <Text style={tw`text-white font-bold text-xl`}>
                {dashboardData.leaderboard?.your_rank || '--'}
              </Text>
            </View>

            <View style={tw`flex-row justify-between py-2 mb-4`}>
              <Text style={tw`text-gray-400 text-base`}>Your Score</Text>
              <Text style={tw`text-white font-bold text-xl`}>
                {dashboardData.leaderboard?.your_score || 0}
              </Text>
            </View>

            {leaderboardEntries.map((entry: LeaderboardEntry) => (
              <LeaderboardEntry key={entry.rank} entry={entry} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View>
        <TouchableOpacity
          onPress={handleFaceCoachPress}
          style={[
            tw`absolute bottom-4 right-0 px-4 py-3 rounded-2xl flex-row items-center justify-center`,
            {
              backgroundColor: '#000000',
              borderColor: 'rgba(255, 255, 255, 0.30)',
              borderWidth: 2
            }
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color="white" />
          <Text style={tw`text-white text-lg font-semibold mx-1`}>Ask FaceCoach</Text>
          <FontAwesome5 name="robot" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <Toast
        style={toast.style}
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        fadeAnim={toast.fadeAnim}
        buttons={toast.buttons}
        onHide={toast.hide}
      />
    </SafeAreaView>
  );
};

export default DailyTrack;