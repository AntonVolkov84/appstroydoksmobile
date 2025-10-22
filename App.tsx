import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AuthLoading from "./screens/AuthLoadingScreen";
import { User, ObjectItemData } from "./types";
import ObjectsScreen from "./screens/ObjectsScreen";
import ObjectDetailsScreen from "./screens/ObjectDetailsScreen";
import { FinishedWorksScreen } from "./screens/FinishedWorksScreen";
import { StatusBar } from "expo-status-bar";
import InspectionWorksScreen from "./screens/InspectionWorksScreen";
import ReceivedWorksScreen from "./screens/ReceivedWorksScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
  Dashboard: { user: User };
  Objects: { currentUser: User };
  ReceivedWorks: { currentUser: User };
  ObjectDetails: { currentUser: User };
  FinishedWorks: { currentUser: User };
  InspectionWorks: { currentUser: User };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
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
        <Stack.Screen
          name="ObjectDetails"
          component={ObjectDetailsScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="InspectionWorks"
          component={InspectionWorksScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="ReceivedWorks"
          component={ReceivedWorksScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="FinishedWorks"
          component={FinishedWorksScreen}
          options={{ headerShown: false, animation: "none" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
