import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { WorkItem, ObjectItemData } from "../types";
import api, { authRequest } from "../api";
import Button from "../components/Button";
import { Pencil, Check, X } from "lucide-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "InspectionWorks">;

export default function FinishedWorksScreen({ route, navigation }: Props) {
  const { currentUser } = route.params;
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [filter, setFilter] = useState<"all" | "sent" | "accepted">("all");
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editWorkItem, setEditWorkItem] = useState<WorkItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  const openEditModal = (work: WorkItem) => {
    setEditWorkItem(work);
    setEditTitle(work.title);
    setEditUnit(work.unit);
    setEditQuantity(work.quantity.toString());
    setEditModalVisible(true);
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
      console.log("getObjects error:", err);
    }
  };

  const getWorks = async () => {
    if (!selectedObjectId) return;
    setLoading(true);
    try {
      await authRequest(async (token) => {
        const res = await api.get(`/sendworks?object_id=${selectedObjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorks(res.data);
      });
    } catch (err) {
      console.log("getWorks error:", err);
      Alert.alert("Ошибка", "Не удалось загрузить работы");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (workId: number, newStatus: "sent" | "accepted") => {
    try {
      await authRequest(async (token) => {
        await api.put(
          `/sendworks/${workId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, status: newStatus } : w)));
    } catch (err) {
      console.log("updateStatus error:", err);
      Alert.alert("Ошибка", "Не удалось обновить статус работы");
    }
  };
  const saveEdit = async () => {
    if (!editWorkItem) return;
    try {
      await authRequest(async (token) => {
        await api.put(
          `/sendworks/${editWorkItem.id}`,
          { title: editTitle, unit: editUnit, quantity: editQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      setEditModalVisible(false);
      getWorks();
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось изменить работу");
    }
  };

  const filteredWorks = works.filter((w) => (filter === "all" ? true : w.status === filter));

  useEffect(() => {
    getObjects();
  }, []);

  useEffect(() => {
    if (selectedObjectId) getWorks();
  }, [selectedObjectId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Принятые / Отправленные работы</Text>
      <View style={styles.objectsContainer}>
        {objects.length === 0 ? (
          <Text style={styles.noObjects}>Нет объектов</Text>
        ) : (
          <FlatList
            horizontal
            data={objects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.objectButton, selectedObjectId === item.id && styles.objectButtonSelected]}
                onPress={() => setSelectedObjectId(item.id)}
              >
                <Text style={[styles.objectButtonText, selectedObjectId === item.id && { color: "#fff" }]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <View style={styles.filterContainer}>
        {["all", "sent", "accepted"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Все" : f === "sent" ? "Непроверенные" : "Принятые"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
      ) : selectedObjectId ? (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colTitle]}>Название</Text>
            <Text style={[styles.cell, styles.colUnit]}>Ед</Text>
            <Text style={[styles.cell, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.cell, styles.colStatus]}>Статус</Text>
            <Text style={[styles.cell, styles.colActions]}>Действия</Text>
          </View>
          <FlatList
            data={filteredWorks}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>Нет работ по выбранному объекту</Text>
            }
            renderItem={({ item }) => {
              const isAccepted = item.status === "accepted";
              return (
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colTitle]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
                  <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>

                  <View style={[styles.cell, styles.colStatus, { alignItems: "center", justifyContent: "center" }]}>
                    {item.status === "accepted" ? <Check size={20} color="green" /> : <X size={20} color="red" />}
                  </View>

                  <View style={[styles.cell, styles.colActions]}>
                    {!isAccepted && (
                      <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: "#ff9f0a",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Pencil size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                    <Switch
                      value={item.status === "accepted"}
                      onValueChange={(val) => {
                        updateStatus(item.id, val ? "accepted" : "sent");
                      }}
                    />
                  </View>
                </View>
              );
            }}
          />
        </>
      ) : (
        <Text style={{ textAlign: "center", marginTop: 40, color: "#666" }}>
          Выберите объект, чтобы просмотреть работы
        </Text>
      )}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput placeholder="Название" value={editTitle} onChangeText={setEditTitle} style={styles.input} />
            <TextInput placeholder="Ед. изм." value={editUnit} onChangeText={setEditUnit} style={styles.input} />
            <TextInput
              placeholder="Количество"
              value={editQuantity}
              onChangeText={setEditQuantity}
              style={styles.input}
              keyboardType="numeric"
            />
            <Button title="Сохранить" containerStyle={{ marginBottom: 10 }} onPress={saveEdit} />
            <Button title="Отмена" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Button containerStyle={{ marginTop: 20, marginBottom: 70 }} title="Назад" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 70, backgroundColor: "#f8f8f8" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 15 },
  objectsContainer: { marginBottom: 15 },
  objectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginRight: 8,
  },
  objectButtonSelected: {
    backgroundColor: "#007AFF",
  },
  objectButtonText: { color: "#007AFF", fontWeight: "500" },
  noObjects: { color: "#666", textAlign: "center" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  filterBtnActive: { backgroundColor: "#007AFF" },
  filterText: { color: "#007AFF", fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 5,
  },
  cell: { paddingHorizontal: 6, textAlignVertical: "center" },
  colTitle: { flex: 2.0, fontSize: 15 },
  colUnit: { width: 30, textAlign: "center" },
  colQty: { width: 60, textAlign: "center", fontWeight: "500" },
  colStatus: { width: 60 },
  colActions: {
    width: 75,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
