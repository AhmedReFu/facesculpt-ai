import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'
import CustomButton from '../Components/CustomButton'

interface GoalItemProps {
    label: string
    isSelected: boolean
    onPress: () => void
}

const GoalItem = ({ label, isSelected, onPress }: GoalItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={tw`border-2 ${isSelected
                ? 'bg-[#60A5FA] border-[#60A5FA]'
                : 'bg-transparent border-white'
            } my-1 rounded-full px-4 py-2 flex-row items-center`}
        activeOpacity={0.7}
    >
        {isSelected && (
            <Ionicons name="checkmark" size={20} color="black" style={tw`mr-2`} />
        )}
        <Text style={tw` text-base font-medium ${isSelected ? 'text-black': 'text-white' }`}>{label}</Text>
    </TouchableOpacity>
)

const ChooseGoal = () => {
    const navigation = useNavigation()

    const [selectedGoals, setSelectedGoals] = useState<string[]>([
        'Sharper Jawline',
        'Reduce Puffiness',
        'Improve Symmetry'
    ])

    const goals = [
        { label: 'Sharper Jawline' },
        { label: 'Reduce Puffiness' },
        { label: 'Improve Symmetry' },
    ]

    const toggleGoal = (goalLabel: string) => {
        if (selectedGoals.includes(goalLabel)) {
            setSelectedGoals(selectedGoals.filter(goal => goal !== goalLabel))
        } else {
            setSelectedGoals([...selectedGoals, goalLabel])
        }
    }

    const isGoalSelected = (goalLabel: string) => {
        return selectedGoals.includes(goalLabel)
    }

    const handleSetGoals = () => {
        console.log('Selected Goals:', selectedGoals)
    }

    return (
        <View style={tw`flex-1 bg-[#0f1418] px-6`}>
            <StatusBar style='light' />
            <View style={tw`mt-14 flex-1`}>
                {/* Header */}
                <View style={tw`mb-6`}>
                    <View style={tw`flex-row justify-between items-start`}>
                        <Text style={tw`text-white text-3xl font-bold flex-1 mr-4`}>
                            Choose Your Goal
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={tw`mt-1`}
                        >
                            <Ionicons name="close" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={tw`text-[#9CA3AF] text-base mt-4 leading-6`}>
                        All goals selected. Deselect any you don't want — your plan adapts automatically.
                    </Text>
                </View>

                {/* Goals List */}
                <View style={tw`flex-row flex-wrap gap-3`}>
                    {goals.map((goal, index) => (
                        <GoalItem
                            key={index}
                            label={goal.label}
                            isSelected={isGoalSelected(goal.label)}
                            onPress={() => toggleGoal(goal.label)}
                        />
                    ))}
                </View>

                {/* Selected Count (Optional) 
                <View style={tw`mt-6`}>
                    <Text style={tw`text-[#9CA3AF] text-sm`}>
                        {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
                    </Text>
                </View>
                */}
            </View>

            {/* Bottom Button */}
            <View style={tw`pb-8`}>
                <CustomButton
                    name="Set My Goals"
                    route="UnlockFacialGym"
                    onPress={handleSetGoals}
                />
            </View>
        </View>
    )
}

export default ChooseGoal