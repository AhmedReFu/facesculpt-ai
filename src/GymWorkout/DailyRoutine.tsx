import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';

const DailyRoutine = () => {
    const navigator = useNavigation();

    return (
        <View style={tw`flex-1 bg-[#000000]`}>
            <StatusBar style='light' />
            <View style={tw`px-6 mt-14`}>
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center py-4`}>
                        <TouchableOpacity
                            onPress={() => navigator.goBack()}
                            style={tw`absolute left-0 z-10`}
                        >
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>
                            Today's Routine
                        </Text>
                    </View>

                    <Text style={tw`text-[#9CA3AF] text-lg mt-4 leading-6`}>
                        Personalized from your latest scan.
                    </Text>
                </View>
            </View>

            <ScrollView
                style={tw`flex-1 px-6`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`flex-row bg-[#1D2229] rounded-xl p-4 my-3`}>
                    <MaterialIcons name="auto-awesome" size={32} color="#60A5FB" />
                    <View style={tw`flex-1 pl-4`}>
                        <Text style={tw`text-white text-lg`}>
                            Based on your facial scan these workouts were created to strengthen and balance your features
                        </Text>
                    </View>
                </View>


                <TouchableOpacity

                    onPress={() => (navigator as any).navigate('Exercise')}
                    activeOpacity={0.8}
                >
                    <View style={tw`flex-row justify-between items-center bg-[#1D2229] rounded-xl p-4 my-2`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                                <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                            </View>
                            <View>
                                <Text style={tw`text-white text-lg`}>Jaw Clench Hold</Text>
                                <Text style={tw`text-[#9CA3AF] text-sm`}>8s</Text>
                            </View>
                        </View>
                        <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity

                    onPress={() => (navigator as any).navigate('Exercise')}
                    activeOpacity={0.8}
                >
                    <View style={tw`flex-row justify-between items-center bg-[#1D2229] rounded-xl p-4 my-2`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                                <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                            </View>
                            <View>
                                <Text style={tw`text-white text-lg`}>Eye Circle Massage</Text>
                                <Text style={tw`text-[#9CA3AF] text-sm`}>8s</Text>
                            </View>
                        </View>
                        <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity

                    onPress={() => (navigator as any).navigate('Exercise')}
                    activeOpacity={0.8}
                >
                    <View style={tw`flex-row justify-between items-center bg-[#1D2229] rounded-xl p-4 my-2`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                                <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                            </View>
                            <View>
                                <Text style={tw`text-white text-lg`}>Chew Motion</Text>
                                <Text style={tw`text-[#9CA3AF] text-sm`}>8s</Text>
                            </View>
                        </View>
                        <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity

                    onPress={() => (navigator as any).navigate('Exercise')}
                    activeOpacity={0.8}
                >
                    <View style={tw`flex-row justify-between items-center bg-[#1D2229] rounded-xl p-4 my-2`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                                <MaterialCommunityIcons name="meditation" size={28} color="#60A5FB" />
                            </View>
                            <View>
                                <Text style={tw`text-white text-lg`}>Cheek Lift</Text>
                                <Text style={tw`text-[#9CA3AF] text-sm`}>8s</Text>
                            </View>
                        </View>
                        <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                    </View>
                </TouchableOpacity>


                <View style={tw`h-24`} />
            </ScrollView>

            <View style={tw`px-6 pb-6 pt-4 bg-[#000000]`}>
                <CustomButton name="Start Workout" route="Exercise" />
            </View>
        </View>
    );
};

export default DailyRoutine;