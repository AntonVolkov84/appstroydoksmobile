import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Modal, TextInput, Switch, Alert, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { WorkItem } from "../types";
import api, { authRequest } from "../api";
import { User, ObjectItemData } from "../types";
import Button from "../components/Button";
import { Pencil, Trash2, Copy } from "lucide-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "ObjectDetails">;

export default function ObjectDetailsScreen({ route, navigation }: Props) {
  const { currentUser } = route.params;
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedWorks, setSelectedWorks] = useState<number[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);

  const [editWorkItem, setEditWorkItem] = useState<WorkItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [addWorkModalVisible, setAddWorkModalVisible] = useState(false);

  const openEditModal = (work: WorkItem) => {
    setEditWorkItem(work);
    setEditTitle(work.title);
    setEditUnit(work.unit);
    setEditQuantity(work.quantity.toString());
    setEditModalVisible(true);
  };
  const getRecipients = async () => {
    try {
      await authRequest(async (token) => {
        const res = await api.get("/recipients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecipients(res.data);
      });
    } catch (err) {
      console.log("getRecipients error:", err);
    }
  };

  useEffect(() => {
    if (recipientModalVisible) {
      getRecipients();
    }
  }, [recipientModalVisible]);

  useEffect(() => {
    getWorks();
  }, []);

  const getWorks = async () => {
    try {
      await authRequest(async (token) => {
        const res = await api.get("/pendingworks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorks(res.data);
      });
    } catch (error) {
      console.log("getWorks error:", error);
    }
  };

  const saveEdit = async () => {
    if (!editWorkItem) return;
    if (!editTitle || !editUnit || !editQuantity) {
      Alert.alert("Ошибка", "Все поля обязательны");
      return;
    }
    try {
      await authRequest(async (token) => {
        const res = await api.put(
          `/pendingworks/${editWorkItem.id}`,
          {
            title: editTitle,
            unit: editUnit,
            quantity: editQuantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorks((prev) => prev.map((w) => (w.id === editWorkItem.id ? res.data : w)));
        setEditModalVisible(false);
        setEditWorkItem(null);
        setEditTitle("");
        setEditUnit("");
        setEditQuantity("");
      });
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось изменить работу");
    }
  };

  const deleteWork = async (workId: number) => {
    Alert.alert("Удалить работу?", "Это действие нельзя отменить", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await authRequest(async (token) => {
              await api.delete(`/pendingworks/${workId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            });
            setWorks((prev) => prev.filter((w) => w.id !== workId));
          } catch (err) {
            console.log("deleteWork error:", err);
            Alert.alert("Ошибка", "Не удалось удалить работу");
          }
        },
      },
    ]);
  };

  const copyWork = async (work: WorkItem) => {
    try {
      await authRequest(async (token) => {
        const res = await api.post(
          "/pendingworks",
          {
            title: work.title,
            unit: work.unit,
            quantity: work.quantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWorks((prev) => [res.data, ...prev]);
      });
    } catch (err) {
      console.log("copyWork error:", err);
      Alert.alert("Ошибка", "Не удалось скопировать работу");
    }
  };

  const addWork = async () => {
    if (!title || !unit || !quantity) {
      Alert.alert("Ошибка", "Все поля обязательны");
      return;
    }
    try {
      await authRequest(async (token) => {
        await api.post("/pendingworks", { title, unit, quantity }, { headers: { Authorization: `Bearer ${token}` } });
        getWorks();
      });
      setTitle("");
      setUnit("");
      setQuantity("");
    } catch (err) {
      console.log("addWork error:", err);
      Alert.alert("Ошибка", "Не удалось добавить работу");
    }
  };

  const toggleSelectWork = (workId: number, value: boolean) => {
    setSelectedWorks((prev) => (value ? [...prev, workId] : prev.filter((id) => id !== workId)));
  };

  const handleSubmitWork = () => {
    if (selectedWorks.length === 0) {
      Alert.alert("Ошибка", "Выберите хотя бы одну работу");
      return;
    }
    setRecipientModalVisible(true);
  };

  const handleConfirmRecipient = async () => {
    if (!selectedRecipient && !emailInput.trim()) {
      Alert.alert("Ошибка", "Выберите или введите получателя");
      return;
    }
    let recipientId = selectedRecipient;
    try {
      await authRequest(async (token) => {
        if (!selectedRecipient && emailInput.trim()) {
          const res = await api.post(
            "/recipients",
            { email: emailInput.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          recipientId = res.data.id;
        }
        await api.post(
          "/sendworks",
          {
            recipient_id: recipientId,
            work_ids: selectedWorks,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        getWorks();
      });
      setRecipientModalVisible(false);
      setSelectedRecipient(null);
      setEmailInput("");
      setSelectedWorks([]);
    } catch (err) {
      console.error("Ошибка при отправке работ:", err);
      Alert.alert("Ошибка", "Не удалось отправить работы");
    }
  };
  const exportWorks = async () => {
    if (!selectedObject) {
      Alert.alert("Ошибка", "Выберите объект");
      return;
    }
    try {
      await authRequest(async (token) => {
        await api.post(
          "/sendworks/export",
          { object_id: selectedObject },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      Alert.alert("Успех", "Работы экспортированы");
      setExportModalVisible(false);
    } catch (err) {
      console.log("exportWorks error:", err);
      Alert.alert("Ошибка", "Не удалось экспортировать работы");
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
      console.log("getObjects error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.colTitle]}>Название</Text>
        <Text style={[styles.cell, styles.colUnit]}>Ед.</Text>
        <Text style={[styles.cell, styles.colQty]}>Кол-во</Text>
        <Text style={[styles.cell, styles.colActions]}>Действия</Text>
      </View>
      <FlatList
        data={works}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.colTitle]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
            <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
            <View style={[styles.cell, styles.colActions, { flexDirection: "row", justifyContent: "center", gap: 8 }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#007AFF" }]}
                onPress={() => copyWork(item)}
              >
                <Copy size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#ff9f0a" }]}
                onPress={() => openEditModal(item)}
              >
                <Pencil size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#ff3b30" }]}
                onPress={() => deleteWork(item.id)}
              >
                <Trash2 size={16} color="#fff" />
              </TouchableOpacity>
              <Switch
                value={selectedWorks.includes(item.id)}
                onValueChange={(val) => toggleSelectWork(item.id, val)}
                style={{ transform: [{ scale: 0.8 }] }}
              />
            </View>
          </View>
        )}
      />
      <Button
        title="Добавить работу"
        containerStyle={{ marginTop: 10, marginBottom: 10 }}
        onPress={() => setAddWorkModalVisible(true)}
      />
      <Button
        title="Экспортировать работы"
        containerStyle={{ marginBottom: 10 }}
        onPress={() => {
          setExportModalVisible(true);
          getObjects();
        }}
      />
      <Button containerStyle={{ marginBottom: 10 }} title="Сдать работу" onPress={handleSubmitWork} />
      <Button containerStyle={{ marginBottom: 70 }} title="Назад" onPress={() => navigation.goBack()} />
      <Modal visible={recipientModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Кому сдать работу?</Text>
            <TextInput
              placeholder="Введите email получателя"
              value={emailInput}
              onChangeText={setEmailInput}
              style={styles.input}
              keyboardType="email-address"
            />
            <Text style={{ fontWeight: "500", marginTop: 10, marginBottom: 5 }}>Ранее использованные:</Text>
            <FlatList
              data={recipients}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.recipientItem, selectedRecipient === item.id && { backgroundColor: "#e0f0ff" }]}
                  onPress={() => setSelectedRecipient(item.id)}
                >
                  <Text style={{ fontWeight: "500" }}>
                    {item.name} {item.surname}
                  </Text>
                  <Text style={{ color: "#555" }}>{item.email}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: "#888", textAlign: "center" }}>Нет сохранённых получателей</Text>
              }
            />
            <Button
              containerStyle={{ marginTop: 10, marginBottom: 10 }}
              title="Отправить"
              onPress={handleConfirmRecipient}
            />
            <Button title="Отмена" onPress={() => setRecipientModalVisible(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Редактировать работу</Text>
            <TextInput placeholder="Название" value={editTitle} onChangeText={setEditTitle} style={styles.input} />
            <TextInput placeholder="Ед. изм." value={editUnit} onChangeText={setEditUnit} style={styles.input} />
            <TextInput
              placeholder="Количество"
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <Button containerStyle={{ marginBottom: 10 }} title="Сохранить" onPress={saveEdit} />
            <Button title="Отмена" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={exportModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Выберите объект для экспорта</Text>
            <FlatList
              data={objects}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.objectItem, selectedObject === item.id && { backgroundColor: "#d9eaff" }]}
                  onPress={() => setSelectedObject(item.id)}
                >
                  <Text style={{ fontSize: 16 }}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: "#666", textAlign: "center" }}>Нет доступных объектов</Text>}
            />
            <Button
              containerStyle={{ marginBottom: 10 }}
              title="Экспортировать"
              onPress={() => {
                exportWorks();
                getWorks();
              }}
            />
            <Button title="Отмена" onPress={() => setExportModalVisible(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={addWorkModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Добавить новую работу</Text>
            <TextInput placeholder="Название" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Ед. изм." value={unit} onChangeText={setUnit} style={styles.input} />
            <TextInput
              placeholder="Количество"
              value={quantity}
              onChangeText={setQuantity}
              style={styles.input}
              keyboardType="numeric"
            />
            <Button
              title="Добавить"
              containerStyle={{ marginBottom: 10 }}
              onPress={() => {
                addWork();
                setAddWorkModalVisible(false);
              }}
            />
            <Button title="Отмена" onPress={() => setAddWorkModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 30 },
  form: { marginBottom: 20, marginTop: 70 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 12, maxHeight: "80%" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginTop: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: { paddingHorizontal: 6, textAlignVertical: "center" },
  colTitle: { flex: 1.6, fontSize: 15 },
  colUnit: { flex: 0.4, textAlign: "center", fontSize: 14, color: "#444" },
  colQty: { flex: 0.8, textAlign: "center", fontSize: 15, fontWeight: "500" },
  colActions: { flex: 2.2, alignItems: "center", textAlign: "center" },
  actionButton: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  recipientItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  objectItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
});
