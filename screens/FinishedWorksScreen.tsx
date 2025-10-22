import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { ObjectItemData, FinishedWork } from "../types";
import Button from "../components/Button";
import { authRequest } from "../api";
import api from "../api";
import axios from "axios";

type Props = NativeStackScreenProps<RootStackParamList, "FinishedWorks">;

export const FinishedWorksScreen = ({ navigation, route }: Props) => {
  const { currentUser } = route.params;
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectItemData | null>(null);
  const [works, setWorks] = useState<FinishedWork[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisibleObjects, setModalVisibleObjects] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchObjects = async () => {
    try {
      const res = await authRequest(async (token) =>
        api.get("/objects", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      setObjects(res.data);
    } catch (err) {
      console.log("fetchObjects error", err);
    }
  };

  const fetchWorks = async () => {
    if (!selectedObject?.id) return;
    setLoading(true);
    try {
      const res = await authRequest(async (token) =>
        api.get(`/sendworks/finishedworks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            object_id: selectedObject.id,
            status: "accepted",
          },
        })
      );
      console.log(res.data);
      setWorks(res.data);
    } catch (err) {
      console.log("fetchWorks error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (selectedObject) {
      setWorks([]);
      setSelectedWorker(null);
      setSelectedDate(null);
      fetchWorks();
    }
  }, [selectedObject]);

  const uniqueWorkers = Array.from(
    new Map(works.map((w) => [w.worker_id, { id: w.worker_id, name: `${w.surname} ${w.name}` }])).values()
  );

  const uniqueDates = Array.from(new Set(works.map((w) => new Date(w.updated_at).toLocaleDateString("ru-RU")))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const filteredWorks = works.filter((w) => {
    const workerMatch = selectedWorker ? w.worker_id === selectedWorker : true;
    const dateMatch = selectedDate ? new Date(w.updated_at).toLocaleDateString("ru-RU") === selectedDate : true;
    return workerMatch && dateMatch;
  });

  const exportReport = async () => {
    if (!currentUser || !selectedObject) return;
    if (filteredWorks.length === 0) {
      Alert.alert("Ошибка", "Нет данных для экспорта");
      return;
    }

    const title = `${selectedObject.title} — ${
      selectedWorker ? uniqueWorkers.find((w) => w.id === selectedWorker)?.name : "Все рабочие"
    }, ${selectedDate ?? "Все даты"}`;
    const rows = filteredWorks.map((w) => ({
      name: w.title,
      unit: w.unit,
      quantity: String(w.quantity),
    }));

    try {
      await authRequest(async (token) =>
        axios.post(
          "https://api.stroydoks.ru/mobile/savebillbook",
          { userId: currentUser.id, title, rows },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      Alert.alert("Успех", "Ведомость успешно сохранена на сайте");
    } catch (err) {
      console.log("exportReport error", err);
      Alert.alert("Ошибка", "Не удалось сохранить ведомость");
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={selectedObject ? selectedObject.title : "Выберите объект"}
        onPress={() => setModalVisibleObjects(true)}
        containerStyle={{ marginBottom: 10 }}
      />
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <Button
            title="Все рабочие"
            containerStyle={{
              backgroundColor: !selectedWorker ? "#ff001e" : "#007AFF",
              marginRight: 8,
            }}
            onPress={() => setSelectedWorker(null)}
          />
          {uniqueWorkers.map((w) => (
            <Button
              key={w.id}
              title={w.name}
              containerStyle={{
                backgroundColor: selectedWorker === w.id ? "#ff001e" : "#007AFF",
                marginRight: 8,
              }}
              onPress={() => setSelectedWorker(w.id)}
            />
          ))}
          <Button
            title="Все даты"
            containerStyle={{
              backgroundColor: !selectedDate ? "#ff001e" : "#007AFF",
              marginRight: 8,
            }}
            onPress={() => setSelectedDate(null)}
          />
          {uniqueDates.map((d, index) => (
            <Button
              key={`${d}-${index}`}
              title={d}
              containerStyle={{
                backgroundColor: selectedDate === d ? "#ff001e" : "#007AFF",
                marginRight: 8,
              }}
              onPress={() => setSelectedDate(d)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredWorks}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Нет принятых работ</Text>}
        renderItem={({ item }) => (
          <View style={styles.workCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>
              Кол-во: {item.quantity} {item.unit}
            </Text>
            <Text>
              Рабочий: {item.surname} {item.name}
            </Text>
            <Text>Дата: {new Date(item.updated_at).toLocaleString()}</Text>
          </View>
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <View style={styles.buttonsContainer}>
        <Button title="Отправить на сайт в форму" onPress={exportReport} containerStyle={{ marginBottom: 10 }} />
        <Button title="Назад" containerStyle={{ marginBottom: 70 }} onPress={() => navigation.goBack()} />
      </View>
      <Modal visible={modalVisibleObjects} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Выберите объект</Text>
          <FlatList
            data={objects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedObject(item);
                  setModalVisibleObjects(false);
                }}
                style={styles.modalItem}
              >
                <Text>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Закрыть" onPress={() => setModalVisibleObjects(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 50,
  },
  filtersWrapper: {
    height: 50,
    marginBottom: 10,
  },
  filtersScrollContent: {
    alignItems: "center",
    paddingHorizontal: 0,
  },
  workCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  title: { fontWeight: "bold", marginBottom: 4 },
  buttonsContainer: { marginTop: 10 },
  modalContainer: { flex: 1, paddingTop: 40, paddingHorizontal: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  modalItem: { padding: 12, borderBottomWidth: 1, borderColor: "#ccc" },
});
