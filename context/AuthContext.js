import React, { createContext, useState, useContext,useEffect} from 'react';
import { endPoint, socket } from '../constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);


    const checkUser = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const localUser = JSON.parse(await AsyncStorage.getItem('user'));

            if (localUser?._id) {
                try {
                    const { data } = await axios.get(`${endPoint}/api/users/profile/${localUser._id}`);
                    // If server data differs from localUser, update state & AsyncStorage
                    if (
                        localUser.username !== data.username ||
                        localUser.bio !== data.bio ||
                        localUser.profileImage !== data.profileImage ||
                        localUser.followers.length !== data.followers.length ||
                        localUser.following.length !== data.following.length
                    ) {
                        setCurrentUser(data);
                        await AsyncStorage.setItem('user', JSON.stringify(data));
                    } else {
                        setCurrentUser(localUser);
                    }
                    setToken(token);
                } catch (err) {
                    console.log('Error fetching user details:', err.message);
                }
            }
        }
    };


    useEffect(() => {
        checkUser();

        // Socket listeners for user updates
        socket.on("userUpdated", async (data) => {
            if (currentUser && data.userId === currentUser._id) {
                setCurrentUser(prev => ({
                    ...prev,
                    username: data.username,
                    profileImage: data.profileImage,
                    bio: data.bio
                }));
                const user = JSON.parse(await AsyncStorage.getItem('user'));
                const updatedUser = {
                    ...user,
                    username: data.username,
                    profileImage: data.profileImage,
                    bio: data.bio
                };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
        });

        socket.on("userFollowed", async ({ followerId, followedId }) => {
            if (currentUser) {
                if (currentUser._id === followerId) {
                    setCurrentUser(prev => ({
                        ...prev,
                        following: [...prev.following, followedId]
                    }));
                } else if (currentUser._id === followedId) {
                    setCurrentUser(prev => ({
                        ...prev,
                        followers: [...prev.followers, followerId]
                    }));
                }
                await AsyncStorage.setItem('user', JSON.stringify(currentUser));
            }
        });

        socket.on("userUnfollowed", async ({ userId, unfollowedId }) => {
            if (currentUser) {
                if (currentUser._id === userId) {
                    setCurrentUser(prev => ({
                        ...prev,
                        following: prev.following.filter(id => id !== unfollowedId)
                    }));
                } else if (currentUser._id === unfollowedId) {
                    setCurrentUser(prev => ({
                        ...prev,
                        followers: prev.followers.filter(id => id !== userId)
                    }));
                }
                await AsyncStorage.setItem('user', JSON.stringify(currentUser));
            }
        });

        // Cleanup
        return () => {
            socket.off("userUpdated");
            socket.off("userFollowed");
            socket.off("userUnfollowed");
        };
    }, [currentUser]);

    const signIn = async ({ email, password }) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(`${endPoint}/api/users/login`, {
                email,
                password
            });
            
            const { token, ...user } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);
            setToken(token);
            
            // Configure axios defaults for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async ({ email, password, username }) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(`${endPoint}/api/users/register`, {
                email,
                password,
                username
            });
            
            const { token, ...user } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);
            setToken(token);
            
            // Configure axios defaults for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setCurrentUser(null);
            setToken(null);
        } catch (err) {
            setError('Error signing out');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            loading,
            error,
            signIn,
            signUp,
            signOut,
            token,
            setCurrentUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

