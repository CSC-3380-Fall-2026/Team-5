import React, { ReactNode } from 'react';
import {
  Modal as ReactNativeModal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

type ModalProps = Readonly<{
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}>;

function Modal({ visible, title, children, onClose }: ModalProps) {
  return (
    <ReactNativeModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>

          {children}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </ReactNativeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modal: {
    width: '85%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 16,
    padding: 10,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
  },
});

export default Modal;