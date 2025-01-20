import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2"
import { useNavigate } from 'react-router-dom'
const api_url = process.env.REACT_APP_API_URL;

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [id, setId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isNewAvatar, setIsNewAvatar] = useState(false);
  const [newAvatarPreview, setNewAvtarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState("");
  const [avatarMetaData, setAvatarMetaData] = useState(null);
  const navigate = useNavigate()
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const profileRef = useRef();
  const passwordRef = useRef();

  useEffect(() => {
    async function fetchAdminDetails() {
      try {
        const res = await fetch(`${api_url}/admin/api/profile`, {
          credentials: "include"
        })
        const data = await res.json();
        if (res.status >= 300 || !data.adminDetail) {
          throw new Error(data.message);
        }
        const adminDetail = data.adminDetail;
        setName(adminDetail.name);
        setEmail(adminDetail.email);
        setPhone(adminDetail.phone);
        setAvatar(adminDetail.avatar);
        setId(adminDetail._id);
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#d33"
        });
        navigate("/admin/login", { replace: true })
      }
    }
    fetchAdminDetails();
  }, [navigate]);
  
  const handleEditDetail = () => {
    setIsEditing(true);
  }
  const handleSaveDetails = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "green",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!"
    })
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${api_url}/admin/api/profile/verify`, {
          credentials: "include",
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            admin: { name, email, phone, id },
            isAvatarUpdated: false
          })
        })
        const data = await res.json();
        if (res.status >= 300) {
          throw new Error(data.message);
        } else {
          Swal.fire({
            title: "Detail updated!",
            text: data.message,
            icon: "success",
            confirmButtonColor: "blue"
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#d33"
        });
      }
    }
  }
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setNewAvtarPreview(preview);
      setAvatarMetaData({
        name: file.name, size: file.size, type: file.type
      })
      setAvatarFile(file);
      setIsNewAvatar(true);
      return () => {
        URL.revokeObjectURL(preview);
      }
    }
  }
  const handleCancelNewAvatar = () => {
    setIsNewAvatar(false);
  }
  const handleSaveNewAvatar = async () => {
    const uploadFileInBucket = async (file, presignedUrl) => {
      try {
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (response.ok && response.status === 200) {
          return { isValid: true }
        } else {
          throw new Error(`Failed to upload file ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        return { isValid: false, message: error.message }
      }
    }
    try {
      const res = await fetch(`${api_url}/admin/api/profile/verify`, {
        credentials: "include",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          admin: { name, email, phone, id, avatarMetaData },
          isAvatarUpdated: true
        })
      })
      const data = await res.json();
      if (res.status >= 300 || !data.putUrl || !data.key) {
        throw new Error(data.message);
      } else {
        const { putUrl, key } = data;
        let response = await uploadFileInBucket(avatarFile, putUrl);
        if (response.isValid) {
          const res = await fetch(`${api_url}/admin/api/profile/save`, {
            credentials: "include",
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              admin: { name, email, phone, id, key },
              isAvatarUpdated: true
            })
          })
          const data = await res.json();
          if (res.status >= 300) {
            throw new Error(data.message);
          }
          setIsNewAvatar(false);
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33"
      });
    }
  }
  const handleChangePassword = async () => {
    if (profileRef.current) {
      const profile = profileRef.current;
      profile.style.transform = `translateX(-100%)`
      const delay = (time) => {
        return new Promise((res, rej) => { setTimeout(() => { return res() }, time) })
      }
      await delay(200);
      profile.style.display = `none`
      setIsChangingPassword(true);
    }
  }
  const handleCancelChangingPassword = async () => {
    if (passwordRef.current && profileRef.current) {
      const password = passwordRef.current;
      const profile = profileRef.current;
      password.style.display = `none`
      const delay = (time) => {
        return new Promise((res, rej) => { setTimeout(() => { return res() }, time) })
      }
      profile.style.display = `block`
      await delay(50);
      profile.style.transform = `translateX(0%)`
      setIsChangingPassword(false);
    }
  }
  const changePassword = async () => {
    try {
      if (currentPassword && newPassword && confirmPassword && currentPassword.trim() && newPassword.trim() && confirmPassword.trim()) {
        const res = await fetch(`${api_url}/admin/api/profile/change-password`, {
          credentials: 'include',
          method: "POST",
          body: JSON.stringify({
            currentPassword, newPassword, confirmPassword
          }),
          headers: { "Content-type": "application/json" }
        })
        const data = await res.json();
        if (res.status >= 300) {
          throw new Error(data.message);
        }
        Swal.fire({
          title: "success",
          text: data.message,
          icon: "success",
          confirmButtonColor: "green"
        });
      } else {
        throw new Error("INCOMPLETE FIELD");
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33"
      });
    }
  }


  return (
    <div className="flex md:flex-row sm:flex-col justify-center gap-6 p-6 min-h-screen">
      {/* Profile Card */}
      <div className="max-w-96 min-w-fit lg:w-1/4 bg-[#f5f0e7] shadow-[0_8px_32px_0_rgba( 31, 38, 135, 0.37)] backdrop-blur-md border-[1px] border-[rgba( 255, 255, 255, 0.18 )] sm:mx-auto  rounded-2xl p-4 lg:h-96 sm:h-fit">
        <div className="flex flex-col lg:gap-3 items-center text-center">
          {
            isNewAvatar ?
              <img
                src={newAvatarPreview}
                alt="Profile"
                className="lg:w-32 lg:h-32 sm:w-28 sm:h-28 rounded-full object-cover bg-center" />
              : <img
                src={avatar}
                alt="Profile"
                className="lg:w-32 lg:h-32 sm:w-28 sm:h-28 rounded-full object-cover bg-center" />
          }
          <div className="text-center">
            <input id="avatarFile" onChange={handleAvatarChange} type="file" accept="image/*" className="hidden" />
            {
              !isNewAvatar ?
                <label htmlFor="avatarFile" type="button" className="flex gap-2 items-center tracking-wider px-4 py-2 sm:my-3 text-white bg-tertiary hover:bg-tertiary_on rounded-md shadow-sm">
                  Edit
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                </label> :

                <div className="mt-6 text-center gap-4 flex justify-evenly">
                  <button type="button" className={`px-6 py-2 border-[1px] border-black text-black bg-slate-100 hover:bg-slate-200 rounded-md shadow-sm`}
                    onClick={handleCancelNewAvatar}>Cancel</button>
                  <button type="button" className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm"
                    onClick={handleSaveNewAvatar}>Save</button>
                </div>
            }

          </div>
          <div className="details flex flex-col space-y-1">
            <h2 className="text-xl font-semibold ">{name}</h2>
            <p className="text-gray-500  tracking-widest text-lg">{phone}</p>
            <p className="text-gray-500  tracking-widest text-lg">{email}</p>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="overflow-x-hidden relative w-full lg:w-2/3 rounded-2xl sm:bg-[#f5f0e7] shadow-md p-4" >
        <form ref={profileRef} className="p-6 space-y-6 transition-transform duration-200" >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 " />
          <div className='text-desktopBodyLarge flex flex-col gap-2'>
            <label htmlFor="name" className=" block text-sm font-medium text-gray-700">Name</label>
            <input value={name} disabled={!isEditing} type="text" id="name" placeholder="Enter name"
              className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className='text-desktopBodyLarge'>
            <label htmlFor="emial" className=" block text-sm font-medium text-gray-700">Email</label>
            <input value={email} disabled={!isEditing} type="email" id="emial" placeholder="Enter email"
              className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
              onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className='text-desktopBodyLarge'>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input value={phone} disabled={!isEditing} type="tel" id="phone" placeholder="Enter phone "
                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 text-center gap-4 flex justify-evenly">
            <button type="button" className={`px-6 py-2 text-white bg-${isEditing ? "green" : "blue"}-500 hover:bg-${isEditing ? "green" : "blue"}-600 rounded-md shadow-sm`}
              onClick={isEditing ? handleSaveDetails : handleEditDetail}>
              {isEditing ? "Save" : "Edit"}
            </button>
            <button type="button" className="px-6 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm"
              onClick={handleChangePassword}
            >Change password</button>
          </div>
        </form>
        {
          isChangingPassword &&
          <form ref={passwordRef} className="p-6 space-y-6 transition-transform duration-200 " >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 " />
            <div className='text-desktopBodyLarge flex flex-col gap-2'>
              <label htmlFor="Current-password" className=" block text-sm font-medium text-gray-700">Current password</label>
              <div className="wrapper relative">
                <input type={isPasswordVisible ? "text" : "password"} id="Current-password" placeholder="Enter current password"
                  className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                  onChange={(e) => setCurrentPassword(e.target.value)} />
                <button className="absolute right-5 top-3" type="button" onClick={() => setIsPasswordVisible(prev => !prev)}>
                  {isPasswordVisible ?
                    <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                    : <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>}
                </button>
              </div>
            </div>
            <div className='text-desktopBodyLarge'>
              <label htmlFor="new-password" className=" block text-sm font-medium text-gray-700">New password</label>
              <input type="password" id="new-password" placeholder="Enter new password"
                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                onChange={(e) => setNewPassword(e.target.value)} />
            </div>

            <div className='text-desktopBodyLarge'>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm password</label>
              <input type="password" id="confirm-password" placeholder="Confirm password "
                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <div className="mt-6 text-center gap-4 flex justify-evenly">
              <button type="button" className={`px-6 py-2 text-white bg-red-400 hover:bg-red-500 border-[1px] border-red-600 rounded-md shadow-sm`}
                onClick={handleCancelChangingPassword}>
                Cancel
              </button>
              <button type="button" className="px-6 py-2 text-black border-[1px] border-black bg-slate-100 hover:bg-slate-300 rounded-md shadow-sm"
                onClick={changePassword}
              >Change password</button>
            </div>
          </form>
        }
      </div >
    </div>
  );
};

export default Index;
