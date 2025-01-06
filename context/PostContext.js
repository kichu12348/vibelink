import React, { createContext, useState, useContext } from 'react';
import { endPoint, socket } from '../constants/endpoints';
import axios from 'axios';
import { uploadFile } from '../utils/fileUpload';
import { useError } from './ErrorContext';

const PostContext = createContext();

export const usePost = () => useContext(PostContext);

//rmahadevan575
//u7fwzN5NWaUrQEl3


export const PostProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPostOpen, setIsPostOpen] = useState(false);
    const [postContent, setPostContent] = useState(null);

    const {showError}=useError();

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${endPoint}/api/posts`);
            setPosts(response.data);
        } catch (err) {
            showError(err.response?.data?.message ||err.message|| 'Error fetching posts');
        } finally {
            setLoading(false);
        }
    };

    const createPost = async (content, mediaFiles) => {
        setLoading(true);
        try {
            let uploadedFiles = [];
            
            if (mediaFiles.length > 0) {
                // Upload each file
                for (const file of mediaFiles) {
                    try {
                        const fileName = await uploadFile(file);
                        uploadedFiles.push({
                            type: 'image',
                            url: `${endPoint}/uploads/${fileName}`
                        });
                    } catch (uploadError) {
                        console.log('File upload error:', uploadError.response?.data);
                    }
                }
            }

            // Create post
            const response = await axios.post(`${endPoint}/api/posts`, {
                content,
                media: uploadedFiles
            });

            setPosts(prev => [response.data, ...prev]);
            return true;
        } catch (err) {
            showError(err.response?.data?.message || 'Error creating post');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const likePost = async (postId) => {
        try {
            const response = await axios.post(`${endPoint}/api/posts/${postId}/like`);
            setPosts(prev => prev.map(post => 
                post._id === postId ? response.data : post
            ));
            return true;
        } catch (err) {
            showError(err.response?.data?.message);
            return false;
        }
    };

    const unlikePost = async (postId) => {
        try {
            const response = await axios.post(`${endPoint}/api/posts/${postId}/unlike`);
            setPosts(prev => prev.map(post => 
                post._id === postId ? response.data : post
            ));
            return true;
        } catch (err) {
            showError(err.response?.data?.message|| err.message||'Error unliking post');
            return false;
        }
    };

    const addComment = async (postId, content) => {
        try {
            const response = await axios.post(`${endPoint}/api/posts/${postId}/comments`, {
                content
            });
            setPosts(prev => prev.map(post => 
                post._id === postId ? response.data : post
            ));
            return response.data;
        } catch (err) {
            showError(err.response?.data?.message);
            return null;
        }
    };

    const addReply = async (postId, commentId, content) => {
        try {
            const response = await axios.post(
                `${endPoint}/api/posts/${postId}/comments/${commentId}/replies`,
                { content }
            );
            setPosts(prev => prev.map(post => 
                post._id === postId ? response.data : post
            ));
            return response.data;
        } catch (err) {
            showError(err.response?.data?.message);
            return null;
        }
    };

    const getPostCommentUser =async (userid) => {
        const response = await axios.get(`${endPoint}/api/users/${userid}`);
        return response.data;
    };

   
    const deletePost = async (postId) => {
        try {
            await axios.delete(`${endPoint}/api/posts/${postId}`);
            
            setPosts(prev => prev.filter(p => {
                return p._id !== postId;
            }));
        } catch (err) {
            showError(err.response?.data?.message);
        }
    };


    async function getPost(postId){
        try{
            const response = await axios.get(`${endPoint}/api/posts/${postId}`);
            return response.data;
        } catch(err){
            console.log('Get post error:', err.response?.data?.message);
            showError(err.response?.data?.message);
            return null;
        }
    }

    React.useEffect(() => {
        socket.on("postDeleted", (postId) => {
            setPosts(prev => prev.filter(p => p._id !== postId));
        });

        // Listen for post updates
        socket.on("postUpdated", (updatedPost) => {
            setPosts(prev => prev.map(post => 
                post._id === updatedPost._id ? updatedPost : post
            ));
        });


        // Cleanup
        return () => {
            socket.off("postDeleted");
            socket.off("postUpdated");
            socket.off("postLiked");
        };
    }, []);


    return (
        <PostContext.Provider value={{
            posts,
            loading,
            error,
            fetchPosts,
            createPost,
            likePost,
            addComment,
            addReply,
            unlikePost,
            getPostCommentUser,
            deletePost,
            getPost,
            isPostOpen,
            setIsPostOpen,
            postContent,
            setPostContent
        }}>
            {children}
        </PostContext.Provider>
    );
};
