import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

export default function ConfirmModal({ onConfirm }: { onConfirm: () => void }) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(true)}>
        <Text>Open Capsule</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent>
        <View>
          <Text>Open this time capsule?</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => { onConfirm(); setVisible(false); }}>
            <Text>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}