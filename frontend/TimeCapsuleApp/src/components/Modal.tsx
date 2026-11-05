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
            <Text style={styles.closeText}>OK</Text>
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
    backgroundColor: 'rgba(61, 48, 40, 0.45)',
    padding: 24,
  },

  modal: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#50382B',
    marginBottom: 12,
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: '#735641',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default Modal;