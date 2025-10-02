import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WSMessage } from "../types";

export const useWebSocketObjects = (onNewObject: (obj: WSMessage) => void) => {
  useEffect(() => {
    let ws: WebSocket;

    const init = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      ws = new WebSocket(`wss://api.stroydoks.ru/ws?token=${token}`);

      ws.onopen = () => console.log("WebSocket connected");

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "assigned_to_object") {
          onNewObject(data.object);
        }
        if (data.type === "work") {
          onNewObject(data.object);
        }
      };

      ws.onclose = () => console.log("WebSocket disconnected");

      ws.onerror = (err) => console.error("WebSocket error", err);
    };

    init();

    return () => {
      ws?.close();
    };
  }, [onNewObject]);
};
