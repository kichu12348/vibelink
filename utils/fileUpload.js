import axios from 'axios';
import { endPoint } from '../constants/endpoints';

export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            type: 'image/jpeg',
            name: 'photo.jpg'
        });

        const response = await axios.post(`${endPoint}/api/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.fileName;
    } catch (error) {
        console.log('Upload error:', error.response?.data || error.message);
        throw error;
    }
};
