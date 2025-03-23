import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2';
const api_url = process.env.REACT_APP_API_URL;

function TeamImage({ teamImages, uploadFileInBucket, fetchTeamImage }) {
  const [isEditing, setIsEditing] = useState(false)
  const [imagePreview, setImagePreview] = useState([]);
  const [imageMeta, setImageMeta] = useState([]);
  const [files, setFiles] = useState([]);
  const [editableImage, setEditableImage] = useState([])
  const [isImageEditing, setIsImageEditing] = useState([]);

  useEffect(() => {
    if (teamImages && teamImages.length) {
      setEditableImage(teamImages)
      const editableImage = teamImages.map((t) => ({ "id": t._id, "isEditing": false }));
      setIsImageEditing(editableImage)
    }
  }, [teamImages]);

  const uploadMedia = async (imageMetaData) => {
    try {
      const uploadedImage = [];
      for (const img of imageMetaData) {
        const file = files.find((f) => f.name === img.fileMeta.name);
        if (file && img.putUrl) {
          await uploadFileInBucket(file, img.putUrl)
          uploadedImage.push({ ...img })
        }
      }
      return { isUploaded: true, uploadedImage }
    } catch (error) {
      console.log(error)
      return { isUploaded: false, message: error.message }
    }
  }
  const saveClientDetails = async (uploadedImage) => {
    try {
      const res = await fetch(`${api_url}/api/admin/team`, {
        method: "POST",
        body: JSON.stringify({
          uploadedImage
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message)
      }
      return { isSave: true }
    }
    catch (error) {
      return { isSave: false, message: error.message }
    }
  }
  const addNewTeamImage = async () => {
    try {
      const res = await fetch(`${api_url}/api/admin/team/get-put-url`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          imageMeta
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json()
      if (!res.ok || !(data.imageMetaData && data.imageMetaData.length)) {
        throw new Error(data.message)
      } else {
        const result = await Swal.fire({
          title: "Are you sure?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "green",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, upload it!"
        })
        if (result.isConfirmed) {
          Swal.fire({
            title: "Uploading...",
            text: "Please wait while your files are being uploaded.",
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            }
          });
          let response = await uploadMedia(data.imageMetaData);
          if (response.isUploaded) {
            // save file detail in DB
            response = await saveClientDetails(response.uploadedImage);
            if (response.isSave) {
              Swal.fire({
                title: "Success!",
                text: response.message,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
              });
              fetchTeamImage()
            } else {
              throw new Error(response.message);
            }
          } else {
            throw new Error(response.message);
          }
        }
      };
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33"
      });
    }
  }
  const handleInputChange = (index, field, value) => {
    setImageMeta(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };
  const handleFileChange = (e) => {
    let files = Array.from(e.target.files);
    // Rename files to avoid name conflict
    files = files.map((file) => {
      let newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`;
      let blob = file.slice(0, file.size);
      return new File([blob], newName, { type: file.type });
    });
    // File metadata with name & designation fields
    const fileMeta = files.map((f) => ({
      fileMeta: { name: f.name, size: f.size, type: f.type },
      name: "",
      designation: ""
    }));

    const prevUrl = files.map((img) => ({
      name: img.name,
      url: URL.createObjectURL(img)
    }));

    setImageMeta(prev => [...prev, ...fileMeta]);
    setFiles(prev => [...prev, ...files]);
    setImagePreview(prev => [...prev, ...prevUrl]);
    setIsEditing(true);
  };
  useEffect(() => {
    return () => {
      imagePreview.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [imagePreview]);
  const cancleAddingNewImage = () => {
    setImageMeta([])
    setFiles([])
    setImagePreview([])
    setIsEditing(false);
  }
  const changeDesignation = (id, e) => {
    if (id && id.trim()) {
      setEditableImage((prev) => {
        const details = prev.map((img) => {
          if (img._id === id) {
            return { ...img, about: { ...img.about, designation: e.target.value } }
          } return img
        })
        return details;
      })
    }
  }
  const changeName = (id, e) => {
    if (id && id.trim()) {
      setEditableImage((prev) => {
        const details = prev.map((img) => {
          if (img._id === id) {
            return { ...img, about: { ...img.about, name: e.target.value } }
          } return img
        })
        return details;
      })
    }
  }
  const deleteTeamMember = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure ? ",
        icon: "warning",
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: "Yes delete!",
        cancelButtonText: "Don't delete!",
        cancelButtonColor: "#d33",
        confirmButtonColor: "green",
      })
      if (result.isConfirmed) {
        const res = await fetch(`${api_url}/api/admin/team`, {
          method: "DELETE",
          body: JSON.stringify({ id }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message)
        }
        Swal.fire({
          text: "Image card deleted!",
          icon: "success",
          title: "success",
          timer: 2000,
          showCloseButton: true
        })
        fetchTeamImage()
      }
    } catch (error) {
      Swal.fire({
        text: error.message,
        icon: "error",
        title: "ERROR!",
        timer: 2000,
        showCloseButton: true
      })
    }
  }
  const editImage = (id) => {
    if (id && id.trim()) {
      setIsImageEditing((img) => {
        const details = img.map((i) => {
          if (i.id === id) {
            return { ...i, "isEditing": true }
          } return i
        })
        return details;
      })
    }
  }
  const cancleImageEdit = (id) => {
    if (id && id.trim()) {
      setIsImageEditing((img) => {
        const details = img.map((i) => {
          if (i.id === id) {
            return { ...i, "isEditing": false }
          } return i
        })
        return details;
      })
      // 
      setEditableImage(prev => {
        const details = prev.map((i) => {
          if (i._id === id) {
            const orignalDetails = teamImages.find((img) => img.id === id);
            if (orignalDetails) {
              return { ...orignalDetails }
            } return i
          } return i
        })
        return details
      })
    }
  }
  const saveImageEdit = async (id) => {
    if (id && id.trim()) {
      try {
        const details = editableImage.find((img) => img._id === id);
        if (details && details.about.name && details.about.name.trim() && details.about.designation && details.about.designation.trim()) {
          const res = await fetch(`${api_url}/api/admin/team`, {
            method: "PUT",
            body: JSON.stringify({ details }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message)
          }
          Swal.fire({
            text: "Image card updated!",
            icon: "success",
            title: "success",
            timer: 2000,
            showCloseButton: true
          })
          fetchTeamImage()
        }
      } catch (error) {
        Swal.fire({
          text: error.message,
          icon: "error",
          title: "ERROR!",
          timer: 2000,
          showCloseButton: true
        })
      }
    }
  }
  return (
    <>
      <div className="hero-banner w-auto  relative rounded-2xl lg:my-4 sm:my-6">
        <div className="edit flex justify-end mb-4">
          {!isEditing ? (
            <div className="add-new-member" >
              <input
                id='teamImages'
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="teamImages">
                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                Add</label>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type='button'
                onClick={addNewTeamImage}
                className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600"
              >Save</button>
              <button type='button'
                onClick={cancleAddingNewImage}
                className="bg-gray-500 text-white font-semibold py-2 px-4 rounded hover:bg-gray-600"
              >Cancel</button>
            </div>
          )}
        </div>
        {
          imageMeta.length ?
            <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
              {imageMeta.map((img, index) => (
                <div key={img.fileMeta.name} className="team-detail-card my-4 px-4 relative">
                  <div className="image h-40">
                    <img src={imagePreview.find(i => i.name === img.fileMeta.name)?.url} alt="preview-image" />
                  </div>
                  <div className="input flex flex-col gap-2 items-center">
                    <div className="flex flex-col gap-2 items-start">
                      <label htmlFor={`name-${index}`}>Enter Full Name</label>
                      <input
                        id={`name-${index}`}
                        placeholder="Name Surname"
                        type="text"
                        value={img.name}
                        onChange={(e) => handleInputChange(index, "name", e.target.value)}
                        className="px-3 py-1 focus:outline-[1px] focus:outline-red-400 rounded-md border-[1px] border-slate-300"
                      />
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                      <label htmlFor={`designation-${index}`}>Enter Designation</label>
                      <input
                        id={`designation-${index}`}
                        placeholder="e.g., Editor"
                        type="text"
                        value={img.designation}
                        onChange={(e) => handleInputChange(index, "designation", e.target.value)}
                        className="px-3 py-1 focus:outline-[1px] focus:outline-red-400 rounded-md border-[1px] border-slate-300"
                      />
                    </div>
                  </div>
                  {/* Delete Button */}
                  <button
                    type="button"
                    className="absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg"
                    onClick={() => {
                      setImagePreview(prev => prev.filter(file => file.name !== img.fileMeta.name));
                      setFiles(prev => prev.filter(file => file.name !== img.fileMeta.name));
                      setImageMeta(prev => prev.filter(file => file.fileMeta.name !== img.fileMeta.name));
                    }}>
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black">
                      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            : null
        }
        {editableImage.length ?
          <div className="team-member grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2  gap-x-5 gap-y-6 px-2 py-4">
            {editableImage.filter((i) => !i.isHero).map((img) => {
              return <div key={img._id} className="w-auto lg:h-72 sm:h-60 relative lg:rounded-2xl  sm:rounded-xl overflow-hidden flex flex-col bg-slate-200 px-2 py-3 space-y-2">
                <div className="h-60 w-auto">
                  <img src={img.url} alt="team-member-name" className="w-full h-full object-cover bg-center lg:rounded-2xl sm:rounded-xl " />
                </div>
                <div className="member-name text-nowrap w-full text-black">
                  <div className="inputs flex w-full flex-col">
                    <input className="lgtracking-wider text-lg sm:tracking-tighter" type="text"
                      disabled={!isImageEditing.find((i) => i.id === img._id)?.isEditing} value={img.about.name}
                      onChange={(e) => changeName(img._id, e)} />
                    <input className="lgtracking-wider text-lg sm:tracking-tighter" type="text"
                      disabled={!isImageEditing.find((i) => i.id === img._id)?.isEditing} value={img.about.designation}
                      onChange={(e) => changeDesignation(img._id, e)} />
                  </div>
                </div>
                <button className="delete-team-member absolute top-4 right-4"
                  onClick={() => deleteTeamMember(img._id)}>
                  <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                </button>
                <div className="edit">
                  {
                    !isImageEditing.find(i => i.id === img._id)?.isEditing ?
                      <button className="edit-team-member text-sm absolute top-4 left-4 bg-blue-500 rounded-md px-2 py-1 text-white"
                        onClick={() => editImage(img._id)}>
                        Edit</button > :

                      <div className="flex gap-2 absolute top-4 left-4 text-sm">
                        <button type='button'
                          onClick={() => saveImageEdit(img._id)}
                          className="bg-green-500 text-white font-semibold py-1 px-2 rounded hover:bg-green-600"
                        >Save</button>
                        <button type='button'
                          onClick={() => cancleImageEdit(img._id)}
                          className="bg-gray-500 text-white font-semibold py-1 px-2 rounded hover:bg-gray-600"
                        >Cancel</button>
                      </div>
                  }
                </div>
              </div>
            })}
          </div> :
          <div className="text-center font-bold text-xl tracking-widest">No available team images</div>
        }
      </div >
    </>
  )
}

export default TeamImage
