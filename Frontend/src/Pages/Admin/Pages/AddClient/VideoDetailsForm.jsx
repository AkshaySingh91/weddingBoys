import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fireMessage } from '../AuthPage/Signup';
import { indianLocations } from '../../../../Utils/Data';
const api_url = process.env.REACT_APP_API_URL;


function VideoDetailsForm({ videoFiles, setVideoFiles, tagsData, setTagsData, videoDetails, setVideosDetails, setVideoForm, videoName }) {
  const videoData = videoDetails.find(vd => vd.video.name === videoName);
  const [locationInput, setLocationInput] = useState(videoData.location);
  const [isHero, setIsHero] = useState(videoData.isHeroVideo);
  const [heroVideoPriority, setHeroVideoPriority] = useState(videoData.heroPriority);
  const [generalPriority, setGeneralPriority] = useState(videoData.generalPriority);
  const [videoShootDate, setVideoShootDate] = useState(videoData.shootDate);
  const [btsAssignments, setBtsAssignments] = useState(videoData.btsInfo || []);
  const [thumbnail, setThumbnail] = useState(videoFiles.find(vObj => vObj.video.name === videoName).thumbnail);
  const [previewThumbnail, setPreviewThumbnail] = useState("");
  const [btsRoles, setBtsRoles] = useState([]);

  // Fetch BTS roles for team assignments
  useEffect(() => {
    const fetchBtsRoles = async () => {
      try {
        const res = await fetch(`${api_url}/api/bts-schema/`, { method: 'GET', credentials: "include" });
        const data = await res.json();
        if (res.status >= 300) return fireMessage(data.message, 'error');
        setBtsRoles(data.schema);
      } catch (error) {
        console.error("Error fetching BTS roles:", error);
      }
    };
    fetchBtsRoles();
  }, []);

  // Fetch available tags
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${api_url}/api/get-all-tags`, { method: "GET", credentials: "include" });
        const data = await response.json();
        if (response.status >= 300) return fireMessage(data.message, 'error');
        setTagsData(data.allTags);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [setTagsData]);

  const [collapsed, setCollapsed] = useState({ tags: false });
  const toogleCollapse = (section) => setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));

  const handleTags = (t) => {
    setVideosDetails(prev => {
      const filteredPrev = prev.filter(item => item.video !== null);
      const videoItem = filteredPrev.find(vd => vd.video.name === videoName);
      let isPresent = false;
      const withoutTag = videoItem.tags.filter(tag => {
        if (tag === t) { isPresent = true; return false; }
        return true;
      });
      return filteredPrev.map(vd => vd.video.name === videoName ? { ...vd, tags: isPresent ? withoutTag : [...withoutTag, t] } : vd);
    });
  };

  const handleLocationChange = () => {
    setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, location: { ...locationInput } } : vd));
  };

  const handleSetHeroVideoPriority = () => {
    if (isNaN(Number.parseInt(heroVideoPriority))) return fireMessage('Invalid priority', 'error');
    setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, heroPriority: heroVideoPriority } : vd));
  };

  const handleGeneralPriority = () => {
    if (isNaN(Number.parseInt(generalPriority))) return fireMessage('Invalid priority', 'error');
    setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, generalPriority } : vd));
  };

  const handleVideoShootDate = (date) => {
    setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, shootDate: date } : vd));
  };

  useEffect(() => {
    if (thumbnail && typeof thumbnail === 'object') {
      const url = URL.createObjectURL(thumbnail);
      setPreviewThumbnail(url);
    }
  }, [thumbnail]);

  const handleFileUpload = (e) => {
    if (e.target.files[0]) {
      const f = e.target.files[0];
      let newName = `${f.name.split('.')[0]}_${Date.now()}.${f.type.split('/')[1]}`;
      let blob = f.slice(0, f.size);
      const file = new File([blob], newName, { type: f.type });
      const previewUrl = URL.createObjectURL(file);
      setPreviewThumbnail(previewUrl);
      setVideoFiles(prev => {
        const videoObj = prev.find(v => v.video.name === videoName);
        if (videoObj) videoObj.thumbnail = file;
        return prev.map(v => v.video.name === videoName ? videoObj : v);
      });
      setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, thumbnail: { name: file.name, type: file.type, size: file.size } } : vd));
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  // New auto-fill functionality for quickly generating realistic random details
  const handleAutoFill = () => {
    // Generate random tags from available tag categories (select one tag per category with a 50% chance)
    const randomTags = [];
    tagsData.forEach(tagType => {
      if (tagType.tags.length > 0 && Math.random() > 0.5) {
        const randomIndex = Math.floor(Math.random() * tagType.tags.length);
        randomTags.push(tagType.tags[randomIndex]);
      }
    });

    // Random location based on a few sample locations in India
    const randomLocation = indianLocations[Math.floor(Math.random() * indianLocations.length)];
    const newLocation = { country: "India", ...randomLocation };

    // Generate random general priority (1-100)
    const newGeneralPriority = Math.floor(Math.random() * 100) + 1;

    // Randomly decide if the video is a hero video and if so, assign a hero priority (1-10)
    const newIsHero = Math.random() > 0.5;
    const newHeroPriority = newIsHero ? Math.floor(Math.random() * 10) + 1 : null;

    // Generate a random shoot date within the last 5 years
    const start = new Date();
    start.setFullYear(start.getFullYear() - 5);
    const end = new Date();
    const randomTime = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const newShootDate = randomTime.toISOString().split('T')[0];

    // Randomly select a BTS assignment (if roles are available)
    // const newBtsAssignments = btsRoles.length > 0 ? [btsRoles[Math.floor(Math.random() * btsRoles.length)]] : [];
    // Select random BTS roles, up to number of team members (no duplicates)
    function getRandomBtsRoles(allRoles, numOfMembers) {
      const shuffled = [...allRoles].sort(() => 0.5 - Math.random());
      const maxToPick = Math.min(numOfMembers, shuffled.length);
      const count = Math.floor(Math.random() * maxToPick) + 1; // at least 1
      return shuffled.slice(0, count);
    }

    const teamCount = btsRoles.length; // however you're tracking selected members
    const newBtsAssignments = getRandomBtsRoles(btsRoles, teamCount);

    // Update local states
    setLocationInput(newLocation);
    setGeneralPriority(newGeneralPriority);
    setIsHero(newIsHero);
    setHeroVideoPriority(newHeroPriority);
    setVideoShootDate(newShootDate);
    setBtsAssignments(newBtsAssignments);

    // Update video details for this video
    setVideosDetails(prev => prev.map(vd => {
      if (vd.video.name === videoName) {
        return {
          ...vd,
          tags: randomTags,
          location: newLocation,
          generalPriority: newGeneralPriority,
          isHeroVideo: newIsHero,
          heroPriority: newHeroPriority,
          shootDate: newShootDate,
          btsInfo: newBtsAssignments.map(role => ({ key: role.key, value: role.title }))
        };
      }
      return vd;
    }));

    fireMessage("Auto-filled video details with random data", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 inset-0 flex items-center justify-center overflow-y-auto"
    >
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl p-8 max-h-screen overflow-y-auto w-full sm:w-96"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <h2 className="text-center font-bold text-2xl mb-6">Video Details</h2>
        <div className="space-y-6">
          {/* Tags Section */}
          <div className="tags">
            <h3 className="font-semibold text-gray-700 text-center">Tags</h3>
            <motion.div whileHover={{ scale: 1.02 }} onClick={() => toogleCollapse('tags')}
              className="cursor-pointer text-center text-sm h-10 w-full border border-gray-300 rounded-md bg-gray-100 flex items-center justify-center">
              Select related keywords
            </motion.div>
            <div className={`mt-2 overflow-y-auto ${collapsed.tags ? "max-h-52" : "max-h-0"} transition-all duration-300`}>
              {tagsData.map(tagType => (
                <div key={tagType.tagType}>
                  <h4 className="text-center font-bold">{tagType.tagType}</h4>
                  <div className="flex flex-wrap gap-2 p-2">
                    {tagType.tags.map(t => (
                      <button key={t} type="button" onClick={() => handleTags(t)}
                        className={`text-sm py-1 px-2 rounded-md ${videoData.tags.find(tg => tg === t) ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Thumbnail Section */}
          <div className="thumbnail">
            <h3 className="font-semibold text-center text-gray-700">Add Thumbnail</h3>
            <div className="flex items-center justify-between">
              <input id="thumbnail" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <label htmlFor="thumbnail" className="cursor-pointer flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-md transition-colors">
                Upload Thumbnail
              </label>
              <button type="button" onClick={() => {
                setThumbnail(null);
                setPreviewThumbnail(null);
                setVideoFiles(prev => prev.map(vObj => vObj.video.name === videoName ? { ...vObj, thumbnail: null } : vObj));
                setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, thumbnail: null } : vd));
              }} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md transition-colors">
                Clear
              </button>
            </div>
            {previewThumbnail && <img src={previewThumbnail} alt="Thumbnail Preview" className="w-full h-48 object-cover rounded-md mt-3" />}
          </div>
          {/* Location Section */}
          <div className="location">
            <h3 className="font-semibold text-center text-gray-700">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={locationInput.country} onChange={(e) => setLocationInput(prev => ({ ...prev, country: e.target.value }))} onBlur={handleLocationChange} placeholder="Country" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
              <input type="text" value={locationInput.state} onChange={(e) => setLocationInput(prev => ({ ...prev, state: e.target.value }))} onBlur={handleLocationChange} placeholder="State" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
              <input type="text" value={locationInput.city} onChange={(e) => setLocationInput(prev => ({ ...prev, city: e.target.value }))} onBlur={handleLocationChange} placeholder="City" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
            </div>
          </div>
          {/* Hero Video Toggle */}
          <div className="isHero">
            <h3 className="font-semibold text-center text-gray-700">Hero Video</h3>
            <div className="flex justify-around">
              <label className="flex items-center gap-2">
                <input type="radio" name="isHeroVideo" value="yes" onChange={() => setIsHero(true)} className="accent-[#FF6969]" />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="isHeroVideo" value="no" defaultChecked onChange={() => setIsHero(false)} className="accent-[#FF6969]" />
                <span>No</span>
              </label>
            </div>
            {isHero && (
              <div className="mt-3">
                <input type="number" value={heroVideoPriority} onChange={(e) => setHeroVideoPriority(Number(e.target.value))} onBlur={handleSetHeroVideoPriority} placeholder="Hero Priority" className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
              </div>
            )}
          </div>
          {/* General Priority Section */}
          <div className="general-priority">
            <h3 className="font-semibold text-center text-gray-700">General Priority</h3>
            <input type="number" value={generalPriority} onChange={(e) => setGeneralPriority(Number(e.target.value))} onBlur={handleGeneralPriority} placeholder="General Priority" className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
          </div>
          {/* Video Shoot Date */}
          <div className="video-shoot-date">
            <h3 className="font-semibold text-center text-gray-700">Video Shoot Date</h3>
            <input type="date" value={videoShootDate} onChange={(e) => { setVideoShootDate(e.target.value); handleVideoShootDate(e.target.value); }} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
          </div>
          {/* BTS Assignments */}
          <div className="bts-details">
            <h3 className="font-semibold text-center text-gray-700">BTS Assignments</h3>
            {btsRoles.length > 0 ? (
              btsRoles.map(role => {
                const isSelected = btsAssignments.find(item => item.key === role.key);
                return (
                  <div key={role._id} className="flex items-center gap-3 my-1">
                    <input type="checkbox" checked={!!isSelected} onChange={(e) => {
                      let newAssignments = e.target.checked ? [...btsAssignments, { key: role.key, value: role.title }] : btsAssignments.filter(item => item.key !== role.key);
                      setBtsAssignments(newAssignments);
                      setVideosDetails(prev => prev.map(vd => vd.video.name === videoName ? { ...vd, btsInfo: newAssignments } : vd));
                    }} className="form-checkbox accent-[#FF6969]" />
                    <label>{role.title}</label>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500">Loading BTS roles...</p>
            )}
          </div>
          {/* Auto-Fill Button */}
          <motion.button type='button' whileHover={{ scale: 1.05 }} onClick={handleAutoFill} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition-all">
            Auto‑Fill Details
          </motion.button>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => {
          setVideoForm(prev => prev.map(f => f.name === videoName ? { isVideoFormVisible: false, name: videoName } : f));
        }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-all mt-6">
          Save
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default VideoDetailsForm;
