import React, { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2';
import BannerImage from "./BannerImage"
import TeamImage from './TeamImage';

function Team() {
    const [teamImages, setTeamImages] = useState([]);
    const [bannerImage, setBannerImage] = useState([]);

    const uploadFileInBucket = useCallback(
        async (file, presignedUrl) => {
            const response = await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (response.ok && response.status === 200) {
                console.log('File uploaded successfully!');
            } else {
                throw new Error(`Failed to upload file `)
            }
        }, []);

    const fetchTeamImage = useCallback(
        async () => {
            try {
                const res = await fetch("http://localhost:5000/api/team");
                const data = await res.json();
                if (!res.ok || !data.teamImages || !data.bannerImage) {
                    throw new Error(data.message);
                }
                setTeamImages(data.teamImages);
                setBannerImage(data.bannerImage);
            } catch (error) {
                Swal.fire({
                    title: "Error!",
                    text: error.message,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
        }, []);
        
    useEffect(() => {
        fetchTeamImage()
    }, [fetchTeamImage])
    return (
        <>
            <BannerImage
                bannerImage={bannerImage}
                fetchTeamImage={fetchTeamImage}
                uploadFileInBucket={uploadFileInBucket} />
            <TeamImage
                teamImages={teamImages}
                fetchTeamImage={fetchTeamImage}
                uploadFileInBucket={uploadFileInBucket} />
        </>
    )
}

export default Team
