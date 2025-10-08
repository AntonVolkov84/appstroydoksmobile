import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { FinishedWork, ObjectItemData } from "../types";
import { authRequest } from "../api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import Button from "../components/Button";
import axios from "axios";

type FinishedWorksProps = NativeStackScreenProps<RootStackParamList, "FinishedWorks">;

export const FinishedWorksScreen = ({ navigation, route }: FinishedWorksProps) => {
  const [works, setWorks] = useState<FinishedWork[]>([]);
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectItemData | null>(null);
  const [sortField, setSortField] = useState<"object" | "worker" | "date">("date");
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisibleObjects, setModalVisibleObjects] = useState(false);
  // const [modalVisibleWorkers, setModalVisibleWorkers] = useState(false);
  // const [modalVisibleDates, setModalVisibleDates] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = route.params ?? { currentUser: null };

  const fetchObjects = async () => {
    try {
      const res = await authRequest(async (token) => {
        return await axios.get("https://api.stroydoks.ru/mobile/objects", {
          headers: { Authorization: `Bearer ${token}` },
        });
      });
      setObjects(res.data);
    } catch (err) {
      console.log("fetchObjects", err);
    }
  };

  const fetchWorks = async () => {
    if (!selectedObject?.id) return;
    setLoading(true);
    try {
      const res = await authRequest(async (token) => {
        return await axios.get(`https://api.stroydoks.ru/mobile/objects/${selectedObject.id}/finished-works`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });
      setWorks(res.data);
    } catch (err) {
      console.log("fetchWorks error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  useEffect(() => {
    if (selectedObject?.id) {
      setWorks([]);
      setSelectedWorker(null);
      setSelectedDate(null);
      fetchWorks();
    }
  }, [selectedObject?.id]);

  const uniqueWorkers = Array.from(
    new Map(works.map((w) => [w.worker_id, { id: w.worker_id, name: `${w.worker_surname} ${w.worker_name}` }])).values()
  );

  const uniqueDates = Array.from(new Set(works.map((w) => new Date(w.confirmed_at).toDateString()))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const filteredWorks = works.filter((w) => {
    const workerMatch = selectedWorker ? w.worker_id === selectedWorker : true;
    const dateMatch = selectedDate ? new Date(w.confirmed_at).toDateString() === selectedDate : true;
    return workerMatch && dateMatch;
  });

  const sortedWorks = [...filteredWorks].sort((a, b) => {
    switch (sortField) {
      case "object":
        return a.object_id - b.object_id;
      case "worker":
        return a.worker_id - b.worker_id;
      case "date":
      default:
        return new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime();
    }
  });

  const exportInBilOfQuantities = async () => {
    try {
      if (!currentUser?.id) {
        Alert.alert("Ошибка", "Не удалось определить пользователя");
        return;
      }
      if (!selectedObject) {
        Alert.alert("Ошибка", "Выберите объект перед экспортом");
        return;
      }

      if (filteredWorks.length === 0) {
        Alert.alert("Ошибка", "Нет данных для экспорта");
        return;
      }

      const workerInfo = selectedWorker ? uniqueWorkers.find((w) => w.id === selectedWorker)?.name : "все рабочие";
      const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("ru-RU") : "все даты";
      const title = `${selectedObject.title} — ${workerInfo}, ${formattedDate}`;

      const rows = filteredWorks.map((w) => ({
        name: w.title,
        unit: w.unit,
        quantity: String(w.quantity),
      }));

      await authRequest(async (token) => {
        await axios.post(
          "https://api.stroydoks.ru/mobile/savebillbook",
          {
            userId: currentUser.id,
            title,
            rows,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      });

      Alert.alert("Успех", "Ведомость успешно сохранена на сайте");
    } catch (err) {
      console.log("exportInBilOfQuantities", err);
      Alert.alert("Ошибка", "Не удалось сохранить ведомость");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <Button
          textStyle={{ fontSize: 20 }}
          title={selectedObject ? selectedObject.title : "Выберите объект"}
          onPress={() => setModalVisibleObjects(true)}
          containerStyle={{ marginTop: 2, marginBottom: 8 }}
        />

        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll} showsHorizontalScrollIndicator={false}>
          <Button
            containerStyle={{
              backgroundColor: !selectedWorker ? "#ff001e" : "#007AFF",
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 5,
            }}
            title="Все рабочие"
            onPress={() => setSelectedWorker(null)}
          />
          {uniqueWorkers.map((w) => (
            <Button
              key={w.id}
              containerStyle={{
                marginLeft: 8,
                backgroundColor: selectedWorker === w.id ? "#ff001e" : "#007AFF",
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 5,
              }}
              title={w.name}
              onPress={() => setSelectedWorker(w.id)}
            />
          ))}
          <Button
            containerStyle={{
              marginLeft: 8,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 5,
              backgroundColor: !selectedDate ? "#ff001e" : "#007AFF",
            }}
            title="Все даты"
            onPress={() => setSelectedDate(null)}
          />
          {uniqueDates.map((d) => (
            <Button
              key={d}
              containerStyle={{
                marginLeft: 8,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 5,
                backgroundColor: selectedDate === d ? "#ff001e" : "#007AFF",
              }}
              title={d}
              onPress={() => setSelectedDate(d)}
            />
          ))}
        </ScrollView>

        <View style={styles.sortButtons}>
          <Button containerStyle={styles.sortButton} title="По рабочему" onPress={() => setSortField("worker")} />
          <Button containerStyle={styles.sortButton} title="По дате" onPress={() => setSortField("date")} />
        </View>
      </View>
      <FlatList
        style={styles.list}
        data={sortedWorks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.workCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.details}>
              Кол-во: {item.quantity} {item.unit}
            </Text>
            <Text style={styles.details}>
              Рабочий: {item.worker_surname} {item.worker_name}
            </Text>
            <Text style={styles.details}>Подтверждена: {new Date(item.confirmed_at).toLocaleString()}</Text>
          </View>
        )}
      />
      <View style={styles.bottomButtons}>
        <Button
          containerStyle={{ marginBottom: 8 }}
          title="Отправить на сайт в форму"
          onPress={() => exportInBilOfQuantities()}
        />
        <Button containerStyle={{ marginBottom: 30 }} title="Назад" onPress={() => navigation.goBack()} />
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
                <Text style={styles.modalItemText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
          <Button containerStyle={{ marginBottom: 40 }} title="Закрыть" onPress={() => setModalVisibleObjects(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 50,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  horizontalScroll: {
    alignItems: "center",
    height: 42,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sortButton: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  list: {
    flex: 1,
  },
  workCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: "#555",
  },
  bottomButtons: {
    paddingVertical: 8,
    marginBottom: 40,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 40,
    padding: 16,
    backgroundColor: "#f7f7f7",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 4,
    borderRadius: 6,
  },
  modalItemText: {
    fontSize: 18,
  },
});
