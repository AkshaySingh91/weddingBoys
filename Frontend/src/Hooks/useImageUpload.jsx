import { useState } from 'react';

const useImageUpload = () => {
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const uploadFiles = async (files) => {
        setUploadStatus('loading');

        try {
            // Get presigned URLs from server
            const response = await fetch('/api/admin/blogs/presigned-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: files.map(file => ({
                        fileName: file.name,
                        fileType: file.type,
                        folder: file.isFeatured ? 'featured' : 'gallery'
                    }))
                })
            });

            const urlsData = await response.json();

            // Upload files to S3
            const uploadPromises = urlsData.map(async (urlData, index) => {
                const file = files[index];

                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(prev => ({
                                ...prev,
                                [urlData.key]: progress
                            }));
                        }
                    });

                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({
                                key: urlData.key,
                                publicUrl: urlData.publicUrl,
                                isFeatured: file.isFeatured,
                                caption: file.caption || ''
                            });
                        } else {
                            reject(new Error(`Upload failed for ${file.name}`));
                        }
                    });

                    xhr.addEventListener('error', () => {
                        reject(new Error(`Upload failed for ${file.name}`));
                    });

                    xhr.open('PUT', urlData.presignedUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                });
            });

            const results = await Promise.all(uploadPromises);
            setUploadedFiles(results);
            setUploadStatus('success');
            return results;
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            throw error;
        }
    };

    const resetUpload = () => {
        setUploadProgress({});
        setUploadStatus('idle');
        setUploadedFiles([]);
    };

    return {
        uploadProgress,
        uploadStatus,
        uploadedFiles,
        uploadFiles,
        resetUpload
    };
};

export default useImageUpload;