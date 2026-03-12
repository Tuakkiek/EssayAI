import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { Link } from "expo-router";

export default function IndividualSubscription() {
  const { user } = useAuth();

  if (!user || user.role !== "free_student") {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-xl font-bold mb-4">Subscription Required</Text>
        <Link href="/subscription" className="bg-blue-500 px-6 py-3 rounded-lg">
          <Text className="text-white font-semibold">Upgrade Plan</Text>
        </Link>
      </View>
    );
  }

  const plans = [
    {
      id: "individual_free",
      name: "Free Plan",
      price: "$0/mo",
      essays: "50 essays/month",
      features: ["AI Grading", "Feedback History"],
    },
    {
      id: "individual_pro",
      name: "Pro Plan",
      price: "$9.99/mo",
      essays: "Unlimited essays",
      features: ["Pro Plan", "Priority Grading", "Advanced Analytics"],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Choose Your Plan</Text>

        {plans.map((plan) => (
          <View
            key={plan.id}
            className="bg-white rounded-xl p-6 mb-4 shadow-sm"
          >
            <Text className="text-xl font-bold mb-2">{plan.name}</Text>
            <Text className="text-3xl font-black text-blue-600 mb-4">
              {plan.price}
            </Text>
            <Text className="text-gray-600 mb-4">{plan.essays}</Text>

            <View className="space-y-1 mb-6">
              {plan.features.map((feature) => (
                <Text key={feature} className="text-gray-700">
                  • {feature}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-xl"
              onPress={() => {
                /* Integrate Sepay */
              }}
            >
              <Text className="text-white font-bold text-center text-lg">
                Select Plan
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
