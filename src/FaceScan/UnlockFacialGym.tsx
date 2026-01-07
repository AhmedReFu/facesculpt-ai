import { IPA_BASE, PAYMENT_REQUIRED } from '@env';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
  PAYMENT_REQUIRED: PAYMENT_REQUIRED,
};

interface PlanProps {
  id: string;
  title: string;
  price: string;
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
}

type PlanId = 'monthly' | 'sixmonthly' | 'yearly';

interface FormattedPackage {
  id: PlanId;
  title: string;
  price: string;
  badge: string;
  package: PurchasesPackage;
  isTrialAvailable: boolean;
}

const PlanItem = ({ title, price, badge, isSelected, onSelect }: PlanProps) => (
  <TouchableOpacity
    onPress={onSelect}
    className={`
      bg-[#1D2229] rounded-2xl p-3 my-3
      ${isSelected ? 'border-2 border-[#60A5FA]' : 'border-2 border-transparent'}
    `}
    activeOpacity={0.8}
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View
          className={`
            w-6 h-6 rounded-full border-2 items-center justify-center mr-3
            ${isSelected ? 'border-[#60A5FA]' : 'border-gray-500'}
          `}
        >
          {isSelected && <View className="w-3 h-3 rounded-full bg-[#60A5FA]" />}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold">{title}</Text>
          </View>
          <Text className="text-[#9CA3AF] text-base mt-1">{price}</Text>
        </View>

        {badge ? (
          <View className="bg-[#60A5FB66] px-3 py-2 rounded-2xl ml-3">
            <Text className="text-white font-medium">{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

const UnlockFacialGym = () => {
  const toast = useToast();
  const navigator = useNavigation<any>();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('sixmonthly');
  const [plans, setPlans] = useState<FormattedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // ---------- API ----------
  const callPaymentRequiredAPI = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT_REQUIRED}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.ok;
    } catch (e) {
      console.log('payment-required api error', e);
      return false;
    }
  };

  //debug alert


  // ✅ Same behavior like your previous: success/active -> API + redirect
  const grantPremiumAndGo = async (planId: PlanId) => {
    await AsyncStorage.setItem('subscribe', 'true');
    await AsyncStorage.setItem('current_plan', planId);

    await callPaymentRequiredAPI();

    toast.show({
      message: '🎉 Premium unlocked! Welcome to FaceSculpt AI Premium!',
      type: 'success',
      style: 'center',
      buttons: [
        {
          text: 'Get Started',
          action: 'custom',
          onPress: () => navigator.navigate('DailyTrack'),
        },
      ],
    });
  };

  const hasPremium = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      return !!info.entitlements.active?.premium;
    } catch {
      return false;
    }
  };

  // ---------- Load RevenueCat plans ----------
  const getRevenueCatData = async () => {
    try {
      setLoading(true);

      // Optional login
      const stored = await AsyncStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.phone_number) {
        try {
          await Purchases.logIn(user.phone_number);
        } catch {
        // ignore
        }
      }

      const offerings = await Purchases.getOfferings();
      const current = offerings?.current || offerings?.all?.premium;

      if (!current || !current.availablePackages?.length) {
        throw new Error('No offerings/packages found');
      }
      toast.show({
        message: offerings.all?.premium.availablePackages.length.toString(),
        type: "warning",
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      })
      const debugText =
        `Offer: ${current?.identifier || 'null'}\n` +
        `Count: ${current?.availablePackages?.length || 0}\n` +
        (current?.availablePackages || []).map((p: any) =>
          `${p.identifier} | ${p.packageType} | ${p.product?.identifier} | ${p.product?.priceString}`
        ).join('\n');

      toast.show({
        message: debugText,
        type: 'warning',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });


      // ✅ Map by packageType (this matches your debug output exactly)
      const slot: Partial<Record<PlanId, FormattedPackage>> = {};

      for (const pkg of current.availablePackages) {
        const type = String(pkg.packageType || '').toUpperCase();

        let planId: PlanId | null = null;
        if (type === 'MONTHLY') planId = 'monthly';
        else if (type === 'SIX_MONTH') planId = 'sixmonthly';
        else if (type === 'ANNUAL' || type === 'YEARLY') planId = 'yearly';

        if (!planId) continue;

        const product = pkg.product;

        slot[planId] = {
          id: planId,
          title: planId === 'monthly' ? 'Monthly' : planId === 'sixmonthly' ? '6 Month Plan' : 'Yearly',
          badge: planId === 'sixmonthly' ? 'Popular' : '',
          price: product.priceString || '—',
          package: pkg,
          isTrialAvailable: !!product.introPrice,
        };
      }

      const finalPlans: FormattedPackage[] = [];
      if (slot.monthly) finalPlans.push(slot.monthly);
      if (slot.sixmonthly) finalPlans.push(slot.sixmonthly);
      if (slot.yearly) finalPlans.push(slot.yearly);

      if (finalPlans.length === 0) {
        throw new Error('No supported packages found (need MONTHLY/SIX_MONTH/ANNUAL)');
      }

      setPlans(finalPlans);
      setSelectedPlan(slot.sixmonthly ? 'sixmonthly' : finalPlans[0].id);
    } catch (error: any) {
      console.log('RevenueCat Error:', error);
      toast.show({
        message: 'Unable to load subscription plans. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRevenueCatData();
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      if (customerInfo.entitlements.active?.premium) {
        // premium
      }
    });
  }, []);

  const handleSelectPlan = (planId: PlanId) => setSelectedPlan(planId);

  // ---------- Subscribe ----------
  const handleSubscribe = async () => {
    if (purchasing) return;

    try {
      setPurchasing(true);

      // already premium -> old behavior
      if (await hasPremium()) {
        await grantPremiumAndGo(selectedPlan);
        return;
      }

      const selectedPlanData = plans.find(p => p.id === selectedPlan);

      if (!selectedPlanData?.package) {
        toast.show({
          message: 'Subscriptions are currently unavailable. Please try again later.',
          type: 'error',
          style: 'center',
          buttons: [{ text: 'OK', action: 'dismiss' }],
        });
        return;
      }

      const result = await Purchases.purchasePackage(selectedPlanData.package);

      if (result?.customerInfo?.entitlements?.active?.premium) {
        await grantPremiumAndGo(selectedPlanData.id);
        return;
      }

      // entitlement may update slightly later
      const again = await Purchases.getCustomerInfo();
      if (again.entitlements.active?.premium) {
        await grantPremiumAndGo(selectedPlanData.id);
        return;
      }

      toast.show({
        message: 'Purchase completed. Verifying subscription… Please try again or Restore Purchases.',
        type: 'warning',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });
    } catch (error: any) {
      if (error?.userCancelled) return;

      const msg = String(error?.message || '').toLowerCase();
      const code = String(error?.code || '');

      // already subscribed/active -> API + redirect
      if (
        code === 'ProductAlreadyPurchasedError' ||
        msg.includes('already active') ||
        msg.includes('already subscribed') ||
        msg.includes('already purchased')
      ) {
        await grantPremiumAndGo(selectedPlan);
        return;
      }

      toast.show({
        message: error?.message || 'Something went wrong. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });
    } finally {
      setPurchasing(false);
    }
  };

  // ---------- Restore ----------
  const handleRestorePurchases = async () => {
    try {
      setLoading(true);

      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active?.premium) {
        await grantPremiumAndGo(selectedPlan);
        return;
      }

      toast.show({
        message: 'No active subscription found to restore.',
        type: 'warning',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });
    } catch (error: any) {
      console.log('Restore error:', error);
      toast.show({
        message: error?.message || 'Failed to restore purchases. Please try again.',
        type: 'error',
        style: 'center',
        buttons: [{ text: 'OK', action: 'dismiss' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrialText = () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return '';

    const hasTrial = selectedPlanData.isTrialAvailable;
    const priceText = selectedPlanData.price;

    if (hasTrial) return `Try free for 7 days, then ${priceText}. Cancel anytime.`;
    return `Subscribe for ${priceText}. Cancel anytime.`;
  };

  const getButtonText = () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return 'Subscribe Now';

    return selectedPlanData.isTrialAvailable ? 'Start Free 7-Day Trial' : 'Start Free 7-Day Trial';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#000000] items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-white mt-4">Loading plans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#000000] px-4">
      <StatusBar style="light" />
      <View className="mt-2 flex-1">
        <View className="mb-6">
          <View className="flex-row justify-between items-start">
            <Text className="text-white text-2xl font-bold flex-1 mr-4">
              Unlock Your Facial Gym
            </Text>
            <TouchableOpacity onPress={() => navigator.goBack()} className="mt-1">
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-[#9CA3AF] text-lg mt-4 leading-6">
            Train your face with personalized workouts, AI coaching, and measurable progress.
          </Text>
        </View>

        <View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Adaptive workout plans</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="head-cog" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">AI FaceCoach guidance</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Progress analytics</Text>
          </View>
          <View className="flex-row items-center gap-4 my-1">
            <MaterialIcons name="bar-chart" size={28} color="#60A5FB" />
            <Text className="text-[#9CA3AF] text-lg">Advanced tracking</Text>
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-white text-lg font-bold mb-2">Choose Your Plan:</Text>

          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              id={plan.id}
              title={plan.title}
              price={plan.price}
              badge={plan.badge}
              isSelected={selectedPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </View>

        <View className="my-4">
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={purchasing || !selectedPlan}
            className={`p-5 rounded-xl flex-row gap-2 items-center justify-center ${purchasing || !selectedPlan ? 'bg-gray-600' : 'bg-[#60A5FA]'
              }`}
          >
            {purchasing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-center text-white text-xl font-semibold ml-2">
                  Processing...
                </Text>
              </>
            ) : (
                <Text className="text-center text-white text-xl font-semibold">
                  {getButtonText()}
                </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-white text-center text-base mb-4">{getTrialText()}</Text>
        <TouchableOpacity
          onPress={async () => {
            const offerings = await Purchases.getOfferings();
            const current = offerings?.current || offerings?.all?.premium;

            const debugText =
              'OFFERING=' + (current?.identifier || 'null') + '\n' +
              'PKG_COUNT=' + (current?.availablePackages?.length || 0) + '\n\n' +
              (current?.availablePackages || []).map((p: any) => {
                return `${p.identifier} | ${p.packageType} | ${p.product?.identifier} | ${p.product?.priceString}`;
              }).join('\n');

            toast.show({
              message: debugText,
              type: 'warning',
              style: 'center',
              buttons: [{ text: 'OK', action: 'dismiss' }],
            });

          }}
          style={{ padding: 12, marginTop: 12 }}
        >
          <Text style={{ color: '#60A5FB', textAlign: 'center' }}>Show RC Debug</Text>
        </TouchableOpacity>

        <View className="my-4">
          <TouchableOpacity onPress={handleRestorePurchases} className="py-3" disabled={loading}>
            <Text className={`text-lg font-medium ${loading ? 'text-gray-500' : 'text-[#60A5FB]'}`}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </View>
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

export default UnlockFacialGym;
