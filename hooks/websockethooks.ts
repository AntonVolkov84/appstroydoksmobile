import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WSMessage } from "../types";

export const useWebSocketObjects = (onNewObject: (obj: WSMessage) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token || !isMounted) return;

      wsRef.current = new WebSocket(`wss://api.stroydoks.ru/ws?token=${token}`);

      wsRef.current.onopen = () => console.log("WebSocket connected");

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "assigned_to_object") {
            console.log("assigned_to_object", data);
            onNewObject(data);
          }
          if (data.type === "work") {
            onNewObject(data);
          }
          if (data.type === "work-update") {
            onNewObject(data);
          }
          if (data.type === "work-deleted") {
            console.log(data);
            onNewObject(data);
          }
        } catch (error) {
          console.log("Websocket hook", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected", event.reason);
        if (isMounted) {
          reconnectTimeout.current = setTimeout(init, 3000);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error", err);
        wsRef.current?.close();
      };
    };

    init();

    return () => {
      isMounted = false;
      wsRef.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [onNewObject]);
};
