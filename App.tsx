import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AuthLoading from "./screens/AuthLoadingScreen";
import { User } from "./types";
import ObjectsScreen from "./screens/ObjectsScreen";
import WorkersScreen from "./screens/WorkersScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
  Dashboard: { user: User };
  Objects: undefined;
  Workers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoading">
        <Stack.Screen name="AuthLoading" component={AuthLoading} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Objects" component={ObjectsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Workers" component={WorkersScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
