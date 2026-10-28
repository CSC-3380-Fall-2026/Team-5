import { View, Text, Button, StyleSheet, ScrollView} from 'react-native';

/* Will all needed to be connected to backend */

function ProfileScreen({ navigation }: any) {
      /* Pull initials from name */
      const firstName = 'test';
      const lastName = 'account';

      const initials =
      firstName.charAt(0).toUpperCase() +
      lastName.charAt(0).toUpperCase();
  return (
    <ScrollView style={styles.container}> 
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileSection}>
        <View style={styles.profileImage}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

        <Text style={styles.name}>
          {firstName} {lastName}
        </Text>
        <Text style={styles.email}>test@gmail.com</Text>
        <Text style={styles.username}>@testacc</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>reese@gmail.com</Text>

        <Text style={styles.infoLabel}>Username</Text>
        <Text style={styles.infoValue}>@reese</Text>
      </View>

      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    },
    title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },

  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  profileImage: {
  width: 120,
  height: 120,
  borderRadius: 60,
  marginBottom: 16,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
},

  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  email: {
    fontSize: 16,
    marginBottom: 12,
  },

  username: {
  fontSize: 16,
  marginBottom: 12,
},
  initials: {
  fontSize: 36,
  fontWeight: '700',
},

infoSection: {
  marginBottom: 30,
},

infoLabel: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 12,
},

infoValue: {
  fontSize: 16,
  marginTop: 4,
},
});
export default ProfileScreen;
