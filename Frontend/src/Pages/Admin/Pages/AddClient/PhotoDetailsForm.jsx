import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fireMessage } from '../AuthPage/Signup';
import { indianLocations } from '../../../../Utils/Data';
const api_url = process.env.REACT_APP_API_URL;


function PhotoDetailsForm({ tagsData, setTagsData, photosDetails, setPhotoDetails, setPhotoForm, photoName }) {
  const photoData = photosDetails.find(pd => pd.photo.name === photoName);
  const [locationInput, setLocationInput] = useState(photoData.location);
  const [generalPriority, setGeneralPriority] = useState(photoData.generalPriority);
  const [photoShootDate, setPhotoShootDate] = useState(photoData.shootDate);

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
    setPhotoDetails(prev => {
      const filteredPrev = prev.filter(item => item.photo !== null);
      const photoDetail = filteredPrev.find(ph => ph.photo.name === photoName);
      let isPresent = false;
      const withoutTag = photoDetail.tags.filter(tag => {
        if (tag === t) { isPresent = true; return false; }
        return true;
      });
      return filteredPrev.map(ph => ph.photo.name === photoName ? { ...ph, tags: isPresent ? withoutTag : [...withoutTag, t] } : ph);
    });
  };

  const handleLocationChange = () => {
    setPhotoDetails(prev => prev.map(ph => ph.photo.name === photoName ? { ...ph, location: locationInput } : ph));
  };

  const handleGeneralPriority = () => {
    if (isNaN(Number.parseInt(generalPriority))) return fireMessage('Invalid priority', 'error');
    setPhotoDetails(prev => prev.map(ph => ph.photo.name === photoName ? { ...ph, generalPriority } : ph));
  };

  const handlePhotoShootDate = (date) => {
    setPhotoDetails(prev => prev.map(ph => ph.photo.name === photoName ? { ...ph, shootDate: date } : ph));
  };

  // New auto-fill functionality for photos
  const handleAutoFill = () => {
    // Generate random tags from available tag categories (select one tag per category )
    const randomTags = [];

    tagsData.forEach(tagType => {
      if (tagType.tags.length > 0) {
        const randomIndex = Math.floor(Math.random() * tagType.tags.length);
        randomTags.push(tagType.tags[randomIndex]);
      }
    });

    // Random location based on sample Indian locations 
    const randomLocation = indianLocations[Math.floor(Math.random() * indianLocations.length)];
    const newLocation = { country: "India", ...randomLocation };

    // Generate random general priority (1-100)
    const newGeneralPriority = Math.floor(Math.random() * 100) + 1;

    // Generate a random shoot date within the last 5 years
    const start = new Date();
    start.setFullYear(start.getFullYear() - 5);
    const end = new Date();
    const randomTime = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const newShootDate = randomTime.toISOString().split('T')[0];

    // Update local states
    setLocationInput(newLocation);
    setGeneralPriority(newGeneralPriority);
    setPhotoShootDate(newShootDate);

    // Update photo details for this photo
    setPhotoDetails(prev => prev.map(ph => {
      if (ph.photo.name === photoName) {
        return {
          ...ph,
          tags: randomTags,
          location: newLocation,
          generalPriority: newGeneralPriority,
          shootDate: newShootDate,
        };
      }
      return ph;
    }));

    fireMessage("Auto-filled photo details with random data", "success");
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
        <h2 className="text-center font-bold text-2xl mb-6">Photo Details</h2>
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
                        className={`text-sm py-1 px-2 rounded-md ${photoData.tags.find(tg => tg === t) ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-700"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Location Section */}
          <div className="location">
            <h3 className="font-semibold text-gray-700 text-center">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={locationInput.country} onChange={(e) => setLocationInput(prev => ({ ...prev, country: e.target.value }))} onBlur={handleLocationChange} placeholder="Country" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
              <input type="text" value={locationInput.state} onChange={(e) => setLocationInput(prev => ({ ...prev, state: e.target.value }))} onBlur={handleLocationChange} placeholder="State" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
              <input type="text" value={locationInput.city} onChange={(e) => setLocationInput(prev => ({ ...prev, city: e.target.value }))} onBlur={handleLocationChange} placeholder="City" className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
            </div>
          </div>
          {/* General Priority Section */}
          <div className="general-priority">
            <h3 className="font-semibold text-gray-700 text-center">General Photo Priority</h3>
            <input type="number" value={generalPriority} onChange={(e) => setGeneralPriority(Number(e.target.value))} onBlur={handleGeneralPriority} placeholder="Priority" className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
          </div>
          {/* Photo Shoot Date Section */}
          <div className="photo-shoot-date">
            <h3 className="font-semibold text-gray-700 text-center">Photo Shoot Date</h3>
            <input type="date" value={photoShootDate} onChange={(e) => { setPhotoShootDate(e.target.value); handlePhotoShootDate(e.target.value); }} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#FF6969]" />
          </div>
          {/* Auto‑Fill Button */}
          <motion.button type='button' whileHover={{ scale: 1.05 }} onClick={handleAutoFill} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition-all">
            Auto‑Fill Details
          </motion.button>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => {
          setPhotoForm(prev => prev.map(f => f.name === photoName ? { isPhotoFormVisible: false, name: photoName } : f));
        }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-all mt-6">
          Save
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default PhotoDetailsForm;
