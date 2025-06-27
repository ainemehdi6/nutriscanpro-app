import { useState } from 'react';
import { Modal, TextInput, Keyboard } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Target, LogOut, Edit3, Mail, Weight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import Button from '@/components/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email cannot be empty');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'User ID is missing');
      return;
    }
    try {
      await apiService.updateProfile(user.id, {name: editName, email: editEmail });
      Alert.alert('Success', 'User info updated successfully. Please log in again.');
      setEditModalVisible(false);
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateCalories = () => {
    Keyboard.dismiss();

    if (!weight || !height || !age || !gender) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    let bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const calories = Number(bmr.toFixed(0));
    setCalculatedCalories(calories);

    const proteinCalories = calories * 0.3;
    const carbsCalories = calories * 0.4;
    const fatsCalories = calories * 0.3;

    const proteinGrams = Math.round(proteinCalories / 4);
    const carbsGrams = Math.round(carbsCalories / 4);
    const fatsGrams = Math.round(fatsCalories / 9);

    setMacros({
      protein: proteinGrams,
      carbs: carbsGrams,
      fats: fatsGrams,
    });
  };
  
  const calculateMacros = (calories: number) => {
    const protein = Math.round((calories * 0.3) / 4);
    const carbs = Math.round((calories * 0.4) / 4);
    const fats = Math.round((calories * 0.3) / 9);
    return { protein, carbs, fats };
  };

  type GoalButtonProps = {
    label: string;
    calorieMultiplier: number;
    baseCalories: number;
    onPress: () => void;
  };

  const updateUserGoals = async (calculatedCalories: number, calorieMultiplier: number) => {
    setLoading(true);
    const calories = Math.round(calculatedCalories * calorieMultiplier);
    const { protein, carbs, fats } = calculateMacros(calories);

    try {
      const goals = await apiService.updateUserGoals({
        calories,
        protein,
        carbs,
        fat: fats,
      });

      user?.goals?.push(goals);
      
      Alert.alert('Success', 'Goals updated successfully!');
      setGoalModalVisible(false);
    } catch (error) {
      console.error('Failed to load meals:', error);
      Alert.alert('Error', "Failed to load meals for selected date");
    } finally {
      setLoading(false);
    }
  };

  const GoalButton = ({ label, calorieMultiplier, baseCalories, onPress }: GoalButtonProps) => {
    const calories = Math.round(baseCalories * calorieMultiplier);
    const { protein, carbs, fats } = calculateMacros(calories);

    return (
      <TouchableOpacity style={styles.goalButtonStyle} onPress={onPress}>
        <Text>
          {label} ({calories} kcal)
        </Text>
        <Text>
          {carbs}g Carbs | {protein}g Protein | {fats}g Fats
        </Text>
      </TouchableOpacity>
    );
  };
  
  const handleEditGoals = () => {
    setGoalModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <User size={32} color="white" />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {
            setEditName(user?.name ?? '');
            setEditEmail(user?.email ?? '');
            setEditModalVisible(true);
          }}>
            <View style={styles.settingIcon}><Edit3 size={18} color="#8B5CF6" /></View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Update your personal information</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Mail size={18} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email</Text>
              <Text style={styles.settingSubtitle}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditGoals}>
            <View style={styles.settingIcon}>
              <Target size={18} color="#22C55E" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Daily Goals</Text>
              <Text style={styles.settingSubtitle}>
                {user?.goals?.[user.goals.length - 1]?.calories 
                  ? `${user.goals[user.goals.length - 1].calories} calories daily`
                  : 'Set your daily nutrition targets'
                }
              </Text>
            </View>
          </TouchableOpacity>

          {user?.goals?.[0] && (
            <View style={styles.goalsContainer}>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Calories</Text>
                <Text style={styles.goalValue}>{user.goals[user.goals.length - 1]?.calories}</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Protein</Text>
                <Text style={styles.goalValue}>{user.goals[user.goals.length - 1]?.protein}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Carbs</Text>
                <Text style={styles.goalValue}>{user.goals[user.goals.length - 1]?.carbs}g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Fat</Text>
                <Text style={styles.goalValue}>{user.goals[user.goals.length - 1]?.fat}g</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Settings size={18} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Settings</Text>
              <Text style={styles.settingSubtitle}>Notifications, preferences, and more</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={loading ? 'Signing Out...' : 'Sign Out'}
            onPress={handleLogout}
            variant="outline"
            disabled={loading}
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: '90%',
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 16,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Set Your Goals</Text>

            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setGender('male')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: gender === 'male' ? '#8B5CF6' : '#E5E7EB',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: gender === 'male' ? 'white' : '#374151', textAlign: 'center' }}>
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setGender('female')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: gender === 'female' ? '#8B5CF6' : '#E5E7EB',
                }}
              >
                <Text style={{ color: gender === 'female' ? 'white' : '#374151', textAlign: 'center' }}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          
            <TextInput
              placeholder="Weight (kg)"
              placeholderTextColor="#999"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              style={styles.inputStyle}
            />
            <TextInput
              placeholder="Height (cm)"
              placeholderTextColor="#999"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              style={styles.inputStyle}
            />
            <TextInput
              placeholder="Age"
              placeholderTextColor="#999"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              style={styles.inputStyle}
            />

            <TouchableOpacity onPress={calculateCalories} style={styles.buttonStyle}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Calculate</Text>
            </TouchableOpacity>

            {calculatedCalories && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: '600' }}>
                  Based on your inputs, your daily calorie needs are:
                </Text>
                <Text style={{ fontSize: 24, color: '#8B5CF6', fontWeight: 'bold' }}>
                  {calculatedCalories} kcal
                </Text>
                <Text style={{ marginTop: 10 }}>Choose a goal:</Text>

                <GoalButton
                  label="Lose Weight"
                  calorieMultiplier={0.85}
                  baseCalories={calculatedCalories}
                  onPress={() => updateUserGoals(calculatedCalories, 0.85)}
                />
                <GoalButton
                  label="Maintain Weight"
                  calorieMultiplier={1}
                  baseCalories={calculatedCalories}
                  onPress={() => updateUserGoals(calculatedCalories, 1)}
                />
                <GoalButton
                  label="Gain Weight"
                  calorieMultiplier={1.15}
                  baseCalories={calculatedCalories}
                  onPress={() => updateUserGoals(calculatedCalories, 1.15)}
                />
              </View>
            )}


            <TouchableOpacity
              onPress={() => setGoalModalVisible(false)}
              style={{ marginTop: 20, alignSelf: 'center' }}
            >
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              placeholder="Name" value={editName} onChangeText={setEditName}
              style={styles.inputStyle}
            />
            <TextInput
              placeholder="Email" value={editEmail} onChangeText={setEditEmail}
              keyboardType="email-address" autoCapitalize="none"
              style={styles.inputStyle}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="outline" style={styles.modalButton} onPress={() => setEditModalVisible(false)} />
              <Button title={loading ? 'Saving...' : 'Save'} style={styles.modalButton} onPress={handleEditProfile} disabled={loading} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItem: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
  inputStyle: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  buttonStyle : {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  goalButtonStyle : {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 8,
  }, 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4
  }
});