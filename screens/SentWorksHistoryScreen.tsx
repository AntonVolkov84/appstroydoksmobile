import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { authRequest } from "../api";
import api from "../api";
import Button from "../components/Button";
import { HistoryWorksData } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SentWorksHistory">;

export const SentWorksHistoryScreen = ({ navigation, route }: Props) => {
  const { currentUser } = route.params;
  const [works, setWorks] = useState<HistoryWorksData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "accepted" | "pending">("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      await authRequest(async (token) => {
        const res = await api.get("/sendworks/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorks(res.data);
      });
    } catch (err) {
      console.log("fetchHistory error", err);
      Alert.alert("Ошибка", "Не удалось загрузить историю работ");
    } finally {
      setLoading(false);
    }
  };

  const filteredWorks = works.filter((w) => {
    if (filter === "all") return true;
    if (filter === "accepted") return w.status === "accepted";
    if (filter === "pending") return w.status !== "accepted";
    return true;
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>История отправленных работ</Text>

      <View style={styles.filterContainer}>
        {[
          { key: "all", label: "Все" },
          { key: "accepted", label: "Принятые" },
          { key: "pending", label: "Непринятые" },
        ].map((f) => (
          <Button
            key={f.key}
            title={f.label}
            containerStyle={{
              flex: 1,
              paddingHorizontal: 3,
              marginHorizontal: 4,
              backgroundColor: filter === f.key ? "#007AFF" : "#fff",
              borderWidth: 1,
              borderColor: "#007AFF",
            }}
            textStyle={{ color: filter === f.key ? "#fff" : "#007AFF", fontSize: 16 }}
            onPress={() => setFilter(f.key as any)}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colTitle]}>Название</Text>
            <Text style={[styles.cell, styles.colUnit]}>Ед</Text>
            <Text style={[styles.cell, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.cell, styles.colObject]}>Объект</Text>
            <Text style={[styles.cell, styles.colDate]}>Принято</Text>
          </View>

          <FlatList
            data={filteredWorks}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 40, color: "#666" }}>Нет работ для отображения</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cell, styles.colTitle]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.colObject]} numberOfLines={1}>
                  {item.object_title}
                </Text>
                <Text style={[styles.cell, styles.colDate]}>
                  {item.status === "accepted" ? new Date(item.updated_at).toLocaleDateString("ru-RU") : ""}
                </Text>
              </View>
            )}
          />
        </>
      )}

      <Button title="Назад" containerStyle={{ marginTop: 20, marginBottom: 70 }} onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 70, backgroundColor: "#f8f8f8" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 15 },
  filterContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, maxHeight: 50 },
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
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },
  cell: { paddingHorizontal: 6, textAlignVertical: "center", fontSize: 14 },
  colTitle: { flex: 2 },
  colUnit: { width: 40, textAlign: "center" },
  colQty: { width: 60, textAlign: "center", fontWeight: "500" },
  colObject: { flex: 1.3, textAlign: "center" },
  colDate: { width: 90, textAlign: "center" },
});
