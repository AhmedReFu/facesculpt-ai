import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import tw from "twrnc";
import CustomButton from '../Components/CustomButton';

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View style={tw`flex-row items-start mb-3`}>
        <View style={tw`w-1.5 h-1.5 rounded-full bg-white mt-2 mr-3`} />
        <Text style={tw`text-[#9CA3AF] text-sm flex-1 leading-5`}>
            {text}
        </Text>
    </View>
);

const Exercise = () => {
    const navigator = useNavigation();

    const instructions = [
        'Sit upright with relaxed shoulders.',
        'Engage the target muscle gently first.',
        'Increase tension to a firm, pain-free hold.',
        'Breathe steadily through your nose.',
        'Release slowly and reset posture.',
    ];
  return (
      <View style={tw`flex-1 bg-[#000000] px-6`}>
          <StatusBar style='light' />
          <View style={tw`mt-14 flex-1`}>
              <View style={tw`mb-6`}>
                  <View style={tw`flex-row items-center justify-center py-4 relative`}>
                      <TouchableOpacity
                          onPress={() => navigator.goBack()}
                          style={tw`right-34`}
                      >
                          <Ionicons name="arrow-back" size={28} color="white" />
                      </TouchableOpacity>

                      <Text style={tw`text-white text-xl font-semibold`}>
                          Exercise
                      </Text>
                  </View>
              </View>
              <Text style={tw`text-white text-2xl my-4`}>Jaw Clench Hold</Text>
              <View style={tw`bg-[#1D2229] rounded-2xl p-20 flex-row gap-4`}>
                  <View style={tw``}>
                      <Ionicons name="image" size={28} color="#60A5FB" />
                  </View>
                  <View ><Text style={tw`text-white text-lg`}>Diagram coming soon</Text></View>
              </View>
              <View>
                  <Text style={tw`text-white text-lg my-4`}>How to do it</Text>
              </View>
              <View style={tw` rounded-2xl`}>
                  

                  {instructions.map((instruction, index) => (
                      <InstructionItem key={index} text={instruction} />
                  ))}
              </View>
          </View>
          <View style={tw`my-4`}>
              <CustomButton name="Start Exercise" route="Exercise" />
          </View>
          </View>
  )
}

export default Exercise