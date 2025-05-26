import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {typography} from '../utils/typography';

interface TaskProgressItemProps {
  title: string;
  current: number;
  total: number;
  color: string;
  completed?: boolean;
}

const TaskProgressItem: React.FC<TaskProgressItemProps> = ({
  title,
  current,
  total,
  color,
  completed,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleLongPress = () => {
    setShowModal(true);
  };

  const handleOptionPress = (option: string) => {
    setShowModal(false);
    // Handle the selected option here
    Alert.alert('Selected', `You chose: ${option}`);
  };

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>

            {completed ? (
              <View style={styles.completedBadge}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            ) : (
              <View style={styles.emptyCircle} />
            )}
          </View>

          <View
            style={[
              styles.progressSection,
              {flexDirection: 'row', alignItems: 'center', marginTop: 0},
            ]}>
            <Text
              style={[styles.progressText, {marginBottom: 0, marginRight: 13}]}>
              {current}/{total}
            </Text>

            <View style={[styles.progressBarContainer, {flex: 1}]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${(current / total) * 100}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Prayer Options Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}>
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalTitle}>Prayer Status</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress('No')}>
              <Text style={styles.optionText}>No</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress('Pray Jammath')}>
              <Text style={styles.optionText}>Pray Jammath</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleOptionPress('Pray at Home')}>
              <Text style={styles.optionText}>Pray at Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    paddingVertical: 14,
    marginVertical: 6,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    minHeight: 30,
  },
  title: {
    ...typography.taskTitle,
    color: '#3C4A9B',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  progressSection: {
    marginTop: 4,
  },
  progressText: {
    ...typography.prayerCard,
    fontSize: 14,
    color: '#3C4A9B',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 11, // Increased from 6 to 8
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 11, // Increased from 6 to 8
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCircle: {
    borderColor: '#CBCBCB',
    borderWidth: 1,
    borderRadius: 100,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h3,
    color: '#3C4A9B',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionText: {
    ...typography.bodyMedium,
    color: '#3C4A9B',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  cancelText: {
    ...typography.bodyMedium,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TaskProgressItem;
