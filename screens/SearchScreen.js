import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  Image,
  Modal
} from 'react-native';
import { colors, fontSizes } from '../constants/primary';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { endPoint } from '../constants/endpoints';
import ViewUserOProfile from '../utils/ViewUserOProfile';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      try {
        const { data } = await axios.get(`${endPoint}/api/users/search?keyword=${text}`);
        setSearchResults(data);
      } catch (error) {
        console.log('Search error:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => setSelectedUser(item)}
    >
      <Image 
        source={
          item.profileImage 
            ? { uri: item.profileImage }
            : require('../defaultImages/default-user.jpg')
        }
        style={styles.userImage}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        {item.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.resultsList}
      />

      <Modal
        visible={!!selectedUser}
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
        transparent={true}
      >
        {selectedUser && (
          <ViewUserOProfile
            user={selectedUser}
            close={() => setSelectedUser(null)}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  resultsList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userBio: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  }
});

export default SearchScreen;
