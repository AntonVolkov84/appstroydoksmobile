import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from "react-native";
import axios from "axios";
import Button from "../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { ObjectItem, ObjectItemData } from "../types";
import api, { authRequest } from "../api";

type ObjectScreenProps = NativeStackScreenProps<RootStackParamList, "Objects">;

export default function ObjectsScreen({ navigation }: ObjectScreenProps) {
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await authRequest((token) => api.get("/objects", { headers: { Authorization: `Bearer ${token}` } }));
      setObjects(res.data);
    } catch (err) {
      console.error("Ошибка загрузки объектов", err);
      Alert.alert("Ошибка", "Не удалось загрузить объекты");
    }
  };

  const addObject = async () => {
    if (!newName.trim() || !newAddress.trim()) {
      Alert.alert("Ошибка", "Введите название и адрес");
      return;
    }
    try {
      const res = await authRequest((token) =>
        api.post("/objects", { title: newName, address: newAddress }, { headers: { Authorization: `Bearer ${token}` } })
      );
      setObjects((prev) => [...prev, res.data]);
      setNewName("");
      setNewAddress("");
    } catch (err) {
      console.error("Ошибка добавления объекта", err);
      Alert.alert("Ошибка", "Не удалось создать объект");
    }
  };

  const deleteObject = (id: number, title: string) => {
    Alert.alert("Удалить объект", `Вы уверены, что хотите удалить объект "${title}"?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await authRequest((token) =>
              api.delete(`/objects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            );
            setObjects((prev) => prev.filter((obj) => obj.id !== id));
          } catch (err) {
            console.error("Ошибка удаления объекта", err);
            Alert.alert("Ошибка", "Не удалось удалить объект, возможно, есть несохраненные работы");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ObjectItemData }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.replace("ObjectWorkers", { objectId: item.id, object: item })}
    >
      <View>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteObject(item.id, item.title)}>
        <Text style={{ color: "#fff" }}>Удалить</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Объекты</Text>
      <Text style={styles.info}>Выберите объект для добавления на него рабочего</Text>
      <TextInput style={styles.input} placeholder="Название объекта" value={newName} onChangeText={setNewName} />
      <TextInput style={styles.input} placeholder="Адрес объекта" value={newAddress} onChangeText={setNewAddress} />
      <TouchableOpacity style={styles.addButton} onPress={addObject}>
        <Text style={styles.addButtonText}>Создать объект</Text>
      </TouchableOpacity>
      <FlatList
        data={objects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <Button containerStyle={{ marginBottom: 40 }} title="Назад" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9", paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, maxWidth: "100%" },
  info: { fontSize: 16, fontWeight: "400", marginBottom: 8, maxWidth: "100%" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "800", color: "#666" },
  address: { fontSize: 14, fontWeight: "500", color: "#666", maxWidth: "70%" },
  deleteButton: {
    backgroundColor: "red",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
