import EvilIcons from '@expo/vector-icons/EvilIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    useNavigation
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';


const Home = () => {
    const navigator = useNavigation();
    return (

        <View style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style='light' />
            <View style={tw`mt-14 flex-1`}>
                <View style={tw`h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4`}>
                    <MaterialIcons name="face" size={24} color="#548ED7" />
                </View>
                <Text style={tw`text-5xl my-4 text-white`}>Welcome to FaceSculpt AI</Text>
                <Text style={tw`text-xl text-white`}>Scan your face to get started</Text>
            </View>

            <CustomButton name="Start Face Scan" route="FaceScan" />

            <View style={tw`flex-row my-4 items-center`}>
                <EvilIcons name="lock" size={28} color="white" />
                {/* <Text style={tw`text-white text-sm font-bold`}>No sign-up needed. Permissions requested only for...</Text> */}
                <Text style={tw`text-white text-sm font-bold`}>Our App Protected by High Quality Security</Text>
            </View>
        </View>

    )
}

export default Home