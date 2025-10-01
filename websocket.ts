import { useEffect, useRef } from "react";

export const useWebSocket = (token: string) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`wss://api.stroydoks.ru/ws?token=${token}`);

    ws.current.onopen = () => {
      console.log("Подключение к WebSocket установлено");
    };

    ws.current.onmessage = (event) => {
      console.log("Получено сообщение от сервера:", event.data);
    };

    ws.current.onclose = () => {
      console.log("WebSocket соединение закрыто");
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket ошибка:", err);
    };

    return () => {
      ws.current?.close();
    };
  }, [token]);

  return ws;
};
