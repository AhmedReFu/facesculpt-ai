import { FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CHART_MARGIN_HORIZONTAL = -20;
const CHART_WIDTH = WINDOW_WIDTH - CHART_MARGIN_HORIZONTAL * 2;

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
      icon: '#60A5FB',
      current: 0.5,
      target: 0.5,
      unit: '%',
      changePercent: 50,
      chartData: [0.6, 0.9, 0.8, -0.9, 0.8, 0.9, 0.6],
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

// ============================
// Utility: generate last N day labels
// ============================
const generateLastNDates = (n: number) => {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    arr.push(label);
  }
  return arr;
};

// ============================================
// COMPONENTS
// ============================================
const GoalChart = ({ goal }: any) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<View | null>(null);
  const hideTimeoutRef = useRef<any>(null);
  const [containerHeight, setContainerHeight] = useState(150);

  const pointsCount = Array.isArray(goal.chartData) ? goal.chartData.length : 0;
  const xLabels = generateLastNDates(pointsCount || 30);

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

  const getIndexByTouch = (touchX: number, totalWidth: number) => {
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
      {/* Header */}
      <View style={tw`flex-row items-center mb-1`}>
        <Text style={tw`text-base mr-2`}>
          <MaterialIcons name="show-chart" size={24} color={goal.icon} />
        </Text>
        <Text style={tw`text-white text-lg font-normal`}>
          {goal.name} ({goal.unit}) - {goal.current}
          {goal.unit} → {goal.target}
          {goal.unit} goal
        </Text>
      </View>

      {/* Chart container */}
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
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          style={{ marginLeft: 0 }}
        />

        {/* Tooltip */}
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
              {goal.chartData[selectedIndex]}
              {goal.unit}
            </Text>
          </View>
        )}
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
        <Text style={tw`text-gray-400 text-base w-12`}>#{entry.rank}</Text>
        <Text style={tw`text-gray-400 text-base`}>{entry.name}</Text>
      </View>
      <View style={tw`flex-row items-center`}>
        {entry && (
          <Text style={tw`${getTrendColor()} text-xs font-bold bg-[#56975E1A] rounded-2xl px-3 py-2`}>
            {getTrendSymbol()} {Math.abs(entry.change)}
          </Text>
        )}
        <Text style={tw`text-white font-bold text-base w-12 text-right`}>{entry.score}</Text>
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

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Using mock data directly since API is not configured
      const progressData = getMockData();
      const leaderboardData = getMockLeaderboard();
      const achievementsData = getMockAchievements();

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

  const handleBackPress = () => {
    navigation.goBack(); // Fixed: Use navigation.goBack() instead of exit app
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
        <Text style={tw`text-white text-xl font-bold mt-4 text-center`}>Oops! Something went wrong</Text>
        <Text style={tw`text-gray-400 text-sm mt-2 text-center`}>{error || 'Unable to load your data'}</Text>
        <TouchableOpacity style={tw`mt-6 bg-[#60A5FB] px-8 py-3 rounded-xl`} onPress={loadAllData}>
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
          <TouchableOpacity onPress={handleBackPress} style={tw`absolute left-0 z-10`}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>Daily Progress</Text>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-1`} showsVerticalScrollIndicator={false}>
        <View style={tw`pt-4`}>
          {/* Header */}
          <Text style={tw`text-white text-3xl font-bold mb-4`}>Day {data.dayCompleted} complete!</Text>

          {/* Streak Badge */}
          <View style={tw`bg-[#1E2532] p-3 rounded-full flex-row items-center self-start`}>
            <Text style={tw`text-lg mr-2`}>
              <MaterialIcons name="local-fire-department" size={24} color="#60A5FB" />
            </Text>
            <Text style={tw`text-white text-lg font-normal`}>Streak: {data.streak} days</Text>
          </View>

          {/* Goal Progress Card */}
          <View style={tw`mt-5 bg-[#181C22] rounded-3xl p-5`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Text style={tw`text-xl mr-2`}>
                <Ionicons name="flag" size={24} color="#60A5FB" />
              </Text>
              <Text style={tw`text-white text-lg font-semibold`}>Goal Progress</Text>
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
              <View style={[tw`bg-[#60A5FB] h-full rounded-full`, { width: `${data.overallProgress}%` }]} />
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2 leading-7`}>Next badge at {data.nextBadgeDays} days</Text>
            <Text style={tw`text-white text-xl mt-3`}>{data.motivationMessage}</Text>
            <Text style={tw`text-gray-400 text-lg mt-2`}>{data.improvementMessage}</Text>
          </View>

          {/* Achievements */}
          {achievements.map((achievement: any) => (
            <View key={achievement.id} style={tw`bg-[#181C22] rounded-2xl p-4 mt-4 flex-row items-center`}>
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
                  <Text style={tw`text-white text-xl font-bold ml-2`}>Leaderboard (private)</Text>
                </View>
                <TouchableOpacity>
                  <Text style={tw`text-[#60A5FB] text-lg font-medium`}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`flex-row justify-between py-2`}>
                <Text style={tw`text-gray-400 text-base`}>Your Rank</Text>
                <Text style={tw`text-white font-bold text-xl`}>#{leaderboard.userRank}</Text>
              </View>

              <View style={tw`flex-row justify-between py-2 mb-4`}>
                <Text style={tw`text-gray-400 text-base`}>Your Score</Text>
                <Text style={tw`text-white font-bold text-xl`}>{leaderboard.userScore}</Text>
              </View>

              {leaderboard.entries.map((entry: any) => (
                <LeaderboardEntry key={entry.rank} entry={entry} />
              ))}
            </View>
          )}

          {/* Bottom Buttons */}
          <View style={tw`bg-[#0D0F14] pt-20`}>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("DailyRoutine")}
                style={tw`flex-1 bg-[#60A5FB] py-4 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-center text-lg`}>Start Today's Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("FaceScan")}
                style={tw`bg-[#1C1E26] border border-white/20 px-6 py-4 rounded-2xl`}>
                <Text style={tw`text-white font-bold text-lg`}>Check-in Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FaceCoach Button */}
      <View>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('FaceCoach')}
          style={[
            tw`absolute bottom-19 right-0 z-50 px-5 py-4 rounded-2xl flex-row items-center justify-center`,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: 1,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={20}
            color="white"
            style={tw`mr-2`}
          />
          <Text style={tw`text-white text-sm font-semibold mx-1`}>
            Ask FaceCoach
          </Text>
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color="white"
            style={tw`ml-1`}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DailyTrack;