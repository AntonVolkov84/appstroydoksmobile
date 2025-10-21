import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Modal, Alert, TouchableOpacity, Switch } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import api, { authRequest } from "../api";
import Button from "../components/Button";
import { ReceivedWirkItem, ObjectItem } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ReceivedWorks">;

export default function ReceivedWorksScreen({ navigation }: Props) {
  const [works, setWorks] = useState<ReceivedWirkItem[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<number[]>([]);
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [objectModalVisible, setObjectModalVisible] = useState(false);
  const [filterWithoutObject, setFilterWithoutObject] = useState(false);

  const getWorks = async () => {
    try {
      await authRequest(async (token) => {
        const res = await api.get("/sendworks/received", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorks(res.data);
      });
    } catch (err) {
      console.error("getWorks error:", err);
      Alert.alert("Ошибка", "Не удалось загрузить полученные работы");
    }
  };

  const getObjects = async () => {
    try {
      await authRequest(async (token) => {
        const res = await api.get("/objects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setObjects(res.data);
      });
    } catch (err) {
      console.error("getObjects error:", err);
      Alert.alert("Ошибка", "Не удалось загрузить объекты");
    }
  };

  useEffect(() => {
    getWorks();
  }, []);

  const toggleSelectWork = (id: number, value: boolean) => {
    setSelectedWorks((prev) => (value ? [...prev, id] : prev.filter((wId) => wId !== id)));
  };

  const openAssignModal = () => {
    if (selectedWorks.length === 0) {
      Alert.alert("Ошибка", "Выберите хотя бы одну работу");
      return;
    }
    getObjects();
    setObjectModalVisible(true);
  };

  const assignObject = async (objectId: number) => {
    try {
      await authRequest(async (token) => {
        await api.put(
          "/sendworks/assign-object",
          { work_ids: selectedWorks, object_id: objectId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      setObjectModalVisible(false);
      setSelectedWorks([]);
      getWorks();
    } catch (err) {
      console.error("assignObject error:", err);
      Alert.alert("Ошибка", "Не удалось назначить объект");
    }
  };

  // фильтрация
  const displayedWorks = filterWithoutObject ? works.filter((w) => !w.object_title) : works;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Полученные работы</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filterWithoutObject && styles.filterButtonActive]}
          onPress={() => setFilterWithoutObject((prev) => !prev)}
        >
          <Text style={[styles.filterText, filterWithoutObject && styles.filterTextActive]}>
            {filterWithoutObject ? "Показать все" : "Без объекта"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.colTitle]}>Название</Text>
        <Text style={[styles.cell, styles.colUnit]}>Ед</Text>
        <Text style={[styles.cell, styles.colQty]}>Кол-во</Text>
        <Text style={[styles.cell, styles.colSender]}>ФИО</Text>
        <Text style={[styles.cell, styles.colObj]}>Объект</Text>
        <Text style={[styles.cell, styles.colSelect]}>Выбор</Text>
      </View>

      <FlatList
        data={displayedWorks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.colTitle]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
            <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.cell, styles.colSender]}>
              {item.sender_name} {item.sender_surname}
            </Text>
            <Text style={[styles.cell, styles.colObj, { color: item.object_title ? "#007AFF" : "#999" }]}>
              {item.object_title || "—"}
            </Text>
            <View style={[styles.cell, styles.colSelect]}>
              <Switch
                value={selectedWorks.includes(item.id)}
                onValueChange={(val) => toggleSelectWork(item.id, val)}
                style={{ transform: [{ scale: 0.8 }] }}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#777", marginTop: 40 }}>Нет полученных работ</Text>
        }
      />

      <Button title="Назначить объект" containerStyle={{ marginBottom: 10 }} onPress={openAssignModal} />
      <Button title="Назад" containerStyle={{ marginBottom: 70 }} onPress={() => navigation.goBack()} />

      <Modal visible={objectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Выберите объект</Text>
            <FlatList
              data={objects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.objectItem} onPress={() => assignObject(item.id)}>
                  <Text style={{ fontWeight: "500" }}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ textAlign: "center", color: "#777" }}>У вас нет объектов</Text>}
            />
            <Button title="Отмена" onPress={() => setObjectModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 60 },
  header: { fontSize: 20, fontWeight: "600", marginBottom: 10 },
  filterRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 },
  filterButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterButtonActive: { backgroundColor: "#007AFF" },
  filterText: { color: "#333", fontWeight: "500" },
  filterTextActive: { color: "#fff" },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: { paddingHorizontal: 6, textAlignVertical: "center" },
  colTitle: { width: 120, fontSize: 15 },
  colUnit: { width: 30, textAlign: "center", color: "#444" },
  colQty: { width: 60, textAlign: "center", fontWeight: "500" },
  colSender: { width: 60, textAlign: "center", color: "#333" },
  colObj: { width: 60, textAlign: "center" },
  colSelect: { width: 60, alignItems: "center", textAlign: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  objectItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
});
