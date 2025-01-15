import React, { createContext, useState, useContext } from 'react';
import { endPoint, socket } from '../constants/endpoints';
import axios from 'axios';
import { uploadFile } from '../utils/fileUpload';
import { useError } from './ErrorContext';

const StoryContext = createContext();

export const useStory = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showError } = useError();

    const fetchStories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${endPoint}/api/stories`);
            setStories(response.data);
        } catch (err) {
            showError(err.response?.data?.message || 'Error fetching stories');
        } finally {
            setLoading(false);
        }
    };

    const createStory = async (mediaFile) => {
        setLoading(true);
        try {
            const fileName = await uploadFile(mediaFile);
            const response = await axios.post(`${endPoint}/api/stories`, {
                image: fileName
            });
            setStories(prev =>{
                //check if story already exists
                const checkIndex = prev.findIndex(s => s._id === response.data._id);
                if(checkIndex !== -1){
                    prev[checkIndex] = response.data;
                    return [...prev];
                }
                return [response.data, ...prev];
            });
            return true;
        } catch (err) {
            showError(err.response?.data?.message || 'Error creating story');
            return false;
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        socket.on("newStory", (story) => {
            setStories(prev =>{
                //check if story already exists
                const checkIndex = prev.findIndex(s => s._id === story._id);
                if(checkIndex !== -1){
                    prev[checkIndex] = story;
                    return [...prev];
                }
                return [story, ...prev];
            });
        });

        socket.on("storyDeleted", (storyId) => {
            setStories(prev => prev.filter(s => s._id !== storyId));
        });

        return () => {
            socket.off("newStory");
            socket.off("storyDeleted");
        };
    }, []);

    return (
        <StoryContext.Provider value={{
            stories,
            loading,
            fetchStories,
            createStory
        }}>
            {children}
        </StoryContext.Provider>
    );
};
