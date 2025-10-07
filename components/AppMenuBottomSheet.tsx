import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { User } from "../types";

type AppMenuBottomSheetProps = {
  role: "worker" | "foreman";
  onLogout: () => void;
  onToggleRole: () => void;
  onManageObjects: () => void;
  onManageWorkers: () => void;
  onfinishedWorks: () => void;
  currentUser: User;
};

export default function AppMenuBottomSheet({
  role,
  currentUser,
  onLogout,
  onToggleRole,
  onManageObjects,
  onManageWorkers,
  onfinishedWorks,
}: AppMenuBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  const openMenu = () => setIsVisible(true);
  const closeMenu = () => setIsVisible(false);

  return (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
        <Text style={styles.menuText}>☰</Text>
      </TouchableOpacity>
      <Modal isVisible={isVisible} onBackdropPress={closeMenu} onBackButtonPress={closeMenu} style={styles.modal}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.item} onPress={onToggleRole}>
            <Text>
              {currentUser.role === "foreman" ? "Переключить роль на рабочего" : "Переключить роль на Прораба"}
            </Text>
          </TouchableOpacity>
          {currentUser.role === "foreman" && (
            <>
              <TouchableOpacity style={styles.item} onPress={onManageObjects}>
                <Text>Управление объектами</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.item} onPress={onManageWorkers}>
                <Text>Управление рабочими</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.item} onPress={onfinishedWorks}>
                <Text>Завершенные работы</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={[styles.item, { marginBottom: 30 }]} onPress={onLogout}>
            <Text>Выйти</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    top: 70,
    right: 30,
    zIndex: 100,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
    aspectRatio: 1,
    height: 45,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: { fontSize: 28 },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  content: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
