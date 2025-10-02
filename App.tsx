import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AuthLoading from "./screens/AuthLoadingScreen";
import { User, ObjectItemData } from "./types";
import ObjectsScreen from "./screens/ObjectsScreen";
import WorkersScreen from "./screens/WorkersScreen";
import ObjectWorkersScreen from "./screens/ObjectWorkersScreen";
import ObjectDetailsScreen from "./screens/ObjectDetailsScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
  Dashboard: { user: User };
  Objects: undefined;
  ObjectWorkers: { objectId: number; object: ObjectItemData };
  Workers: undefined;
  ObjectDetails: { objectId: number; currentUser: User };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoading">
        <Stack.Screen name="AuthLoading" component={AuthLoading} options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen name="Objects" component={ObjectsScreen} options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="Workers" component={WorkersScreen} options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen
          name="ObjectWorkers"
          component={ObjectWorkersScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="ObjectDetails"
          component={ObjectDetailsScreen}
          options={{ headerShown: false, animation: "none" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
