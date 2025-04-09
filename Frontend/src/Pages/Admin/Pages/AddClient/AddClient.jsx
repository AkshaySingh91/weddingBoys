import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoDetailsForm from './VideoDetailsForm';
import PhotoDetailsForm from './PhotoDetailsForm';
import { fireMessage } from '../AuthPage/Signup';
import Swal from 'sweetalert2';
const api_url = process.env.REACT_APP_API_URL;

const AddClient = () => {
  // States
  const [brideName, setBrideName] = useState('Bride');
  const [groomName, setGroomName] = useState('Groom');
  const [tagsData, setTagsData] = useState([]);
  const [videoDetails, setVideosDetails] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photosDetails, setPhotosDetails] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [videoForm, setVideoForm] = useState([]);
  const [photoForm, setPhotoForm] = useState([]);
  const [isInMap, setIsInMap] = useState(false);
  const [coordinate, setCoordinate] = useState({ latitude: 32.455, longitute: -23.45 });

  const handleFileChange = (e, type) => {
    let files = Array.from(e.target.files);
    // Add date to file name to avoid conflict
    files = files.map((file) => {
      let newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`;
      let blob = file.slice(0, file.size);
      return new File([blob], newName, { type: file.type });
    });
    if (type === 'video') {
      const videoUrl = files.map(video => ({
        name: video.name,
        url: URL.createObjectURL(video)
      }));
      setVideoFiles(prev => ([...prev, ...files.map(f => ({ video: f, thumbnail: null }))]));
      setPreviewVideos(prev => [...prev, ...videoUrl]);
      setVideosDetails(prev => {
        const filteredPrev = prev.filter(item => item.video !== null);
        return [
          ...filteredPrev,
          ...files.map(video => ({
            video: {
              name: video.name,
              type: video.type,
              size: video.size,
            },
            thumbnail: null,
            tags: [],
            location: { country: '', state: '', city: '' },
            isHeroVideo: false,
            heroPriority: null,
            generalPriority: null,
            btsInfo: [],
            shootDate: null,
          }))
        ];
      });
      const form = files.map(video => ({ isVideoFormVisible: false, name: video.name }));
      setVideoForm(prev => [...prev, ...form]);
    } else {
      const photoUrl = files.map(photo => ({
        name: photo.name,
        url: URL.createObjectURL(photo)
      }));
      setPhotoFiles(prev => [...prev, ...files]);
      setPhotosDetails(prev => {
        const filteredPrev = prev.filter(item => item.photo !== null);
        return [
          ...filteredPrev,
          ...files.map(photo => ({
            photo: {
              name: photo.name,
              type: photo.type,
              size: photo.size,
            },
            tags: [],
            location: { country: '', state: '', city: '' },
            generalPriority: null,
            shootDate: null,
          }))
        ];
      });
      setPreviewPhotos(prev => [...prev, ...photoUrl]);
      const form = files.map(photo => ({ isPhotoFormVisible: false, name: photo.name }));
      setPhotoForm(prev => [...prev, ...form]);
    }
  };

  useEffect(() => console.log(videoDetails), [videoDetails]);

  const uploadFileInBucket = async (file, presignedUrl) => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (response.ok && response.status === 200) {
        console.log('File uploaded successfully!');
      } else {
        throw new Error(`Failed to upload file ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      fireMessage(error.message, 'error');
      console.error('Error uploading file:', error);
    }
  };

  const copyVideoDetailsToAll = () => {
    if (videoDetails.length === 0) return fireMessage("No video details available to copy", "error");
    const base = videoDetails[0];
    setVideosDetails(prev => prev.map((detail, idx) => idx === 0 ? detail : { ...base, video: detail.video, thumbnail: detail.thumbnail }));
    fireMessage("Copied first video details to all videos", "success");
  };

  const copyPhotoDetailsToAll = () => {
    if (photosDetails.length === 0) return fireMessage("No photo details available to copy", "error");
    const base = photosDetails[0];
    setPhotosDetails(prev => prev.map((detail, idx) => idx === 0 ? detail : { ...base, photo: detail.photo }));
    fireMessage("Copied first photo details to all photos", "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const saveClientDetails = async (urls) => {
      try {
        let i = -1;
        let videosMetaData = [], photoMetaData = [];
        if (urls.videosUrl?.length) {
          videosMetaData = videoDetails.map(v => {
            i++;
            return { ...v, video: { key: urls.videosUrl[i].videoKey }, thumbnail: { key: urls.videosUrl[i].thumbnailKey } };
          });
        }
        i = -1;
        if (urls.photosUrl?.length) {
          photoMetaData = photosDetails.map(p => {
            i++;
            return { ...p, photo: { key: urls.photosUrl[i].photoKey } };
          });
        }
        const res = await fetch(`${api_url}/api/admin/add-client/save-details`, {
          method: "POST",
          body: JSON.stringify({
            clientDetails: {
              bride: brideName,
              groom: groomName,
              isInMap: isInMap.toString(),
              coordinate,
              videoDetails: videosMetaData,
              photosDetails: photoMetaData,
            }
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.status >= 300) {
          console.log(data, res.status);
          return fireMessage(data.message, 'error');
        }
      } catch (error) {
        console.log(error);
        return fireMessage(error.message, 'error');
      }
    };

    const uploadMedia = async (urls) => {
      try {
        const { videosUrl, photosUrl } = urls;
        let i = 0;
        for (const videoObj of videosUrl) {
          await uploadFileInBucket(videoFiles[i].video, videoObj.videoPutUrl);
          await uploadFileInBucket(videoFiles[i].thumbnail, videoObj.thumbnailPutUrl);
          i++;
        }
        let j = 0;
        for (const photoObj of photosUrl) {
          await uploadFileInBucket(photoFiles[j], photoObj.photoPutUrl);
          j++;
        }
        return { isUploaded: true, message: "Client details have been added." };
      } catch (error) {
        console.log(error);
        fireMessage(error.message, 'error');
      }
    };

    const verifyDetails = async () => {
      try {
        const res = await fetch(`${api_url}/api/admin/add-client/validate-details`, {
          method: "POST",
          body: JSON.stringify({
            bride: brideName,
            groom: groomName,
            isInMap: isInMap.toString(),
            coordinate,
            videoDetails,
            photosDetails,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.status >= 300) {
          console.log(data, res.status);
          return fireMessage(data.message, 'error');
        } else {
          Swal.fire({
            title: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#22c55e",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, upload it!"
          }).then(async (result) => {
            if (result.isConfirmed) {
              Swal.fire({
                title: "Uploading...",
                text: "Please wait while your files are being uploaded.",
                allowEscapeKey: false,
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => { Swal.showLoading(); }
              });
              try {
                const { isUploaded, message } = await uploadMedia(data.urls);
                if (isUploaded) {
                  await saveClientDetails(data.urls);
                  Swal.fire({
                    title: "Success!",
                    text: message || "All files have been uploaded successfully.",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                  });
                } else {
                  throw new Error(message || "Failed to upload files.");
                }
              } catch (error) {
                Swal.fire({
                  title: "Error!",
                  text: error.message || "Something went wrong during upload.",
                  icon: "error",
                  confirmButtonColor: "#d33"
                });
              }
            }
          });
        }
      } catch (error) {
        console.log(error);
        fireMessage(error.message, 'error');
      }
    };
    verifyDetails();
  };

  // Lock scroll when any details form is open
  useEffect(() => {
    const isAnyFormVisible = videoForm.some(form => form.isVideoFormVisible) || photoForm.some(form => form.isPhotoFormVisible);
    if (isAnyFormVisible) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
  }, [videoForm, photoForm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative max-w-7xl mx-auto p-8 rounded-3xl bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] overflow-hidden shadow-2xl"
    >
      {/* Floating Decorative Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
            initial={{
              opacity: 0,
              scale: 0,
              x: Math.random() * 100,
              y: Math.random() * 100,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Add Wedding Client Details</h1>
      <form className="space-y-8" onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Client Info & Map Coordinates */}
        <div className="p-6 bg-white bg-opacity-80 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-4">Client Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Bride's Name</label>
              <input type="text" value={brideName} onChange={(e) => setBrideName(e.target.value)} placeholder="Enter Bride's Name" required className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Groom's Name</label>
              <input type="text" value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="Enter Groom's Name" required className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-center text-gray-600">Display on Map?</p>
            <div className="flex justify-center gap-8 mt-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="isInMap" value="true" onChange={() => setIsInMap(true)} className="accent-[#FF6969]" />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="isInMap" value="false" onChange={() => setIsInMap(false)} className="accent-[#FF6969]" />
                <span>No</span>
              </label>
            </div>
            {isInMap && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Latitude</label>
                  <input type="number" value={coordinate.latitude} onChange={(e) => setCoordinate(prev => ({ ...prev, latitude: e.target.value }))} placeholder="32.455" className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Longitude</label>
                  <input type="number" value={coordinate.longitute} onChange={(e) => setCoordinate(prev => ({ ...prev, longitute: e.target.value }))} placeholder="-23.45" className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Videos Section */}
        <div className="p-6 bg-white bg-opacity-80 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-4">Client Videos</h2>
          <div className="flex items-center justify-between">
            <input id="videos" type="file" accept="video/mp4" multiple onChange={(e) => handleFileChange(e, 'video')} className="hidden" />
            <label htmlFor="videos" className="cursor-pointer flex items-center gap-2 bg-[#FFDCCC] hover:bg-[#FF6969] text-gray-800 font-semibold py-3 px-6 rounded-md transition-colors">
              Add Videos
            </label>
            <button type="button" onClick={() => { setPreviewVideos([]); setVideosDetails([]); setVideoFiles([]); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-md transition-colors">
              Clear All
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {previewVideos.map(video => (
              <div key={video.name} className="relative group">
                <video controls className="w-full h-48 object-cover rounded-lg shadow-md" src={video.url} />
                <button type="button" onClick={() => {
                  setPreviewVideos(prev => prev.filter(v => v.name !== video.name));
                  setVideosDetails(prev => prev.filter(vd => vd.video.name !== video.name));
                }} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-red-200 transition-colors">
                  <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#00000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                </button>
                <button type="button" onClick={() => {
                  setVideoForm(videoForm.map(form => form.name === video.name ? { isVideoFormVisible: true, name: video.name } : form));
                }} className="mt-3 w-full bg-[#FF6969] hover:bg-[#FF4D4D] text-white font-semibold py-3 px-4 rounded-md transition-colors">
                  Add Details
                </button>
                {videoForm.find(form => form.name === video.name)?.isVideoFormVisible &&
                  <VideoDetailsForm
                    videoFiles={videoFiles}
                    setVideoFiles={setVideoFiles}
                    tagsData={tagsData}
                    setTagsData={setTagsData}
                    videoDetails={videoDetails}
                    setVideosDetails={setVideosDetails}
                    setVideoForm={setVideoForm}
                    videoName={video.name}
                  />
                }
              </div>
            ))}
          </div>
          <button type="button" onClick={copyVideoDetailsToAll} className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-colors">
            Copy First Video Details to All
          </button>
        </div>

        {/* Photos Section */}
        <div className="p-6 bg-white bg-opacity-80 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-4">Client Photos</h2>
          <div className="flex items-center justify-between">
            <input id="photos" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
            <label htmlFor="photos" className="cursor-pointer flex items-center gap-2 bg-[#FFDCCC] hover:bg-[#FF6969] text-gray-800 font-semibold py-3 px-6 rounded-md transition-colors">
              Add Photos
            </label>
            <button type="button" onClick={() => { setPreviewPhotos([]); setPhotosDetails([]); setPhotoFiles([]); }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-md transition-colors">
              Clear All
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {previewPhotos.map(photo => (
              <div key={photo.name} className="relative group">
                <img alt="client-photo" src={photo.url} className="w-full h-48 object-cover rounded-lg shadow-md" />
                <button type="button" onClick={() => {
                  setPreviewPhotos(prev => prev.filter(p => p.name !== photo.name));
                  setPhotosDetails(prev => prev.filter(ph => ph.photo.name !== photo.name));
                }} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-red-200 transition-colors">
                  <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#00000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                </button>
                <button type="button" onClick={() => {
                  setPhotoForm(photoForm.map(form => form.name === photo.name ? { isPhotoFormVisible: true, name: photo.name } : form));
                }} className="mt-3 w-full bg-[#FF6969] hover:bg-[#FF4D4D] text-white font-semibold py-3 px-4 rounded-md transition-colors">
                  Add Details
                </button>
                {photoForm.find(form => form.name === photo.name)?.isPhotoFormVisible &&
                  <PhotoDetailsForm
                    tagsData={tagsData}
                    setTagsData={setTagsData}
                    photosDetails={photosDetails}
                    setPhotoDetails={setPhotosDetails}
                    setPhotoForm={setPhotoForm}
                    photoName={photo.name}  
                  />
                }
              </div>
            ))}
          </div>
          <button type="button" onClick={copyPhotoDetailsToAll} className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-colors">
            Copy First Photo Details to All
          </button>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-all">
          Submit
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddClient;
