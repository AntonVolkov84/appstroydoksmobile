import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Modal } from "react-native";
import Button from "../components/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { User } from "../types";
import api, { authRequest } from "../api";

type Props = NativeStackScreenProps<RootStackParamList, "ObjectWorkers">;

export default function ObjectWorkersScreen({ route, navigation }: Props) {
  const { objectId, object } = route.params;
  const [workers, setWorkers] = useState<User[]>([]);
  const [allWorkers, setAllWorkers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await authRequest((token) =>
        api.get(`/objects/${objectId}/workers`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      setWorkers(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке рабочих объекта:", err);
      Alert.alert("Ошибка", "Не удалось загрузить рабочих объекта");
    }
  };

  const fetchAllWorkers = async () => {
    try {
      const res = await authRequest((token) => api.get("/workers", { headers: { Authorization: `Bearer ${token}` } }));
      setAllWorkers(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке всех рабочих:", err);
      Alert.alert("Ошибка", "Не удалось загрузить список рабочих");
    }
  };

  const addWorker = async (workerId: number) => {
    try {
      await authRequest((token) =>
        api.post(`/objects/${objectId}/workers`, { workerId }, { headers: { Authorization: `Bearer ${token}` } })
      );
      setModalVisible(false);
      fetchWorkers();
    } catch (err) {
      console.error("Ошибка при добавлении рабочего:", err);
      Alert.alert("Ошибка", "Не удалось добавить рабочего");
    }
  };

  const removeWorker = (worker: User) => {
    Alert.alert("Удалить рабочего", `Вы уверены, что хотите удалить ${worker.name} ${worker.surname} с объекта?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await authRequest((token) =>
              api.delete(`/objects/${objectId}/workers/${worker.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            );
            fetchWorkers();
          } catch (err) {
            console.error("Ошибка при удалении рабочего:", err);
            Alert.alert("Ошибка", "Не удалось удалить рабочего");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const renderWorker = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.workerItem} onLongPress={() => removeWorker(item)}>
      <Text style={styles.workerText}>
        {item.name} {item.surname}
      </Text>
    </TouchableOpacity>
  );

  const renderAllWorker = ({ item }: { item: User }) => {
    const alreadyAssigned = workers.some((w) => w.id === item.id);
    if (alreadyAssigned) return null;

    return (
      <TouchableOpacity style={styles.workerItem} onPress={() => addWorker(item.id)}>
        <Text style={styles.workerText}>
          {item.name} {item.surname}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Рабочие объекта</Text>
      <Text style={styles.name}>{object.title}</Text>
      <Text style={styles.address}>{object.address}</Text>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWorker}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Button
        title="Добавить рабочего"
        onPress={() => {
          fetchAllWorkers();
          setModalVisible(true);
        }}
      />
      <Button containerStyle={{ marginTop: 20, marginBottom: 40 }} title="Назад" onPress={() => navigation.goBack()} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите рабочего</Text>
            <FlatList data={allWorkers} keyExtractor={(item) => item.id.toString()} renderItem={renderAllWorker} />
            <Button containerStyle={{ marginTop: 10 }} title="Закрыть" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2", paddingTop: 50 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 10, textAlign: "center" },
  name: { fontSize: 24, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  address: { fontSize: 16, color: "#666", fontWeight: "400", marginBottom: 10, textAlign: "center" },
  workerItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  workerText: { fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
});
