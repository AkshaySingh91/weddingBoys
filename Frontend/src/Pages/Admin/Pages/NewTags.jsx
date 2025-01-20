import React, { useCallback, useEffect, useState } from "react";
import { fireMessage } from "../../Admin/Pages/AuthPage/Signup";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";

const api_url = process.env.REACT_APP_API_URL;

const AddTag = () => {
    const [allTags, setAllTags] = useState([]);
    const [orignalAllTags, setOrignalAllTags] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [newTag, setNewTag] = useState([]);

    const fetchCategories = useCallback(
        async () => {
            try {
                const response = await fetch(`${api_url}/api/get-all-tags`, {
                    method: "GET",
                    credentials: "include"
                });
                const data = await response.json();
                if (response.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setAllTags(data.allTags);
                setOrignalAllTags(data.allTags);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addNewCategory = async () => {
        if (!newCategory.trim()) return;
        for (const input of newTag) {
            if (!input?.value?.trim()) return;
        }
        if (!newTag.length) {
            return Swal.fire({
                icon: 'error',
                text: "Tag required",
                title: "Error!",
                timer: 2000
            })
        }
        try {
            for (let i = 0; i < newTag.length; i++) {
                for (let j = i + 1; j < newTag.length; j++) {
                    if (newTag[i].value.toLowerCase().trim() === newTag[j].value.toLowerCase().trim()) {
                        return fireMessage('2 or more keyword should not same', 'error');
                    }
                }
            }
            const response = await fetch(`${api_url}/admin/api/tags`, {
                method: 'POST',
                body: JSON.stringify({
                    tagType: newCategory,
                    tags: newTag.map((tag) => tag.value)
                }),
                headers: {
                    'content-type': 'application/json'
                },
                credentials: "include"
            });
            const data = await response.json();
            if (response.status >= 300) {
                return fireMessage(data.message, 'error')
            } else {
                fireMessage('New Tags Added!', 'success');
            }
            fetchCategories();
            setNewCategory("");
            setNewTag([]);
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const updateAllChanges = async () => {
        try {
            // check if 2 or more keyword in same type should not same 
            allTags.forEach((tagDetail) => {
                for (let i = 0; i < tagDetail.tags.length; i++) {
                    for (let j = i + 1; j < tagDetail.tags.length; j++) {
                        if (tagDetail.tags[i].toLowerCase().trim() === tagDetail.tags[j].toLowerCase().trim()) {
                            return fireMessage('2 or more keyword should not same', 'error');
                        }
                    }
                }
            })
            // format all tags abc-xyz = Abc-Xyz
            const formatedTags = allTags.map((tagDetail) => {
                return {
                    tagType: tagDetail.tagType.charAt(0).toUpperCase() + tagDetail.tagType.slice(1),
                    tags: tagDetail.tags.map((t) => {
                        if (t.split("-").length) {
                            let upperT = t.split("-").map((t) => t.charAt(0).toUpperCase() + t.slice(1));
                            upperT = upperT.join("-");
                            return upperT
                        } else {
                            return t.charAt(0).toUpperCase() + t.slice(1);
                        }
                    })
                }
            })
            const response = await fetch(`${api_url}/admin/api/tags`, {
                method: "PUT",
                credentials: "include",
                body: JSON.stringify({
                    allTags: formatedTags,
                    isConfirmed: false
                }),
                headers: {
                    'content-type': 'application/json'
                },
            });
            const data = await response.json()
            if (response.status >= 300) {
                return fireMessage(data.message, 'error')
            } else if (response.status === 200 && data.message) {
                fireMessage('Tag Updated!', 'success');
            } else if (response.status === 200 && data.confirm) {
                const result = await Swal.fire({
                    title: data.confirm,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "green",
                    confirmButtonText: "Yes, delete it!"
                })
                if (result.isConfirmed) {
                    const res = await fetch(`${api_url}/admin/api/tags`, {
                        method: "PUT",
                        credentials: "include",
                        body: JSON.stringify({
                            allTags: formatedTags,
                            isConfirmed: true
                        }),
                        headers: {
                            'content-type': 'application/json'
                        },
                    });
                    const data = await res.json();
                    if (res.status >= 300) {
                        throw new Error(data.message)
                    }
                    Swal.fire({
                        title: data.message,
                        icon: "success",
                        confirmButtonColor: "green",
                    })
                }
            }
            fetchCategories();
        } catch (error) {
            fireMessage(error.message, 'error');
            console.error("Error updating tag:", error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
            <h1 className=" text-center text-2xl font-bold mb-4">Tag Manager</h1>
            <div className="mb-4 p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                <h2 className="text-lg mb-4">Add new category</h2>
                <input
                    type="text"
                    placeholder="Add new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="border px-4 py-2 rounded w-full mb-2"
                />
                <div className="allTags flex flex-wrap gap-2">
                    {
                        newTag.map((input) => (
                            <div key={input.id} className="flex gap-2 border  px-4 py-2 rounded-full bg-gray-300 mb-2">
                                <input
                                    className='w-32 bg-gray-200 rounded-full px-4 py-2 '
                                    onChange={(e) => {
                                        setNewTag((prev) =>
                                            prev.map((tag) => (tag.id === input.id ? { ...tag, value: e.target.value } : tag))
                                        );
                                    }}
                                    type="text" value={input.value} id={input.id} />
                                <button onClick={() => {
                                    setNewTag((prev) => prev.filter((tag) => tag.id !== input.id));
                                }} className="">
                                    <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                </button>
                            </div>

                        ))
                    }
                </div>
                <button
                    type='button'
                    onClick={() => {
                        setNewTag((prev) => [...prev, { "id": Date.now(), "value": '' }]);
                    }}
                    className="bg-blue-500 text-white px-4 mx-2 py-2 rounded hover:bg-blue-600"
                >New tags</button>
                <button
                    onClick={addNewCategory}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Save</button>
            </div>

            <div className="mb-4 p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                <h2 className="text-center text-desktopBodyLarge font-bold ">All Tags & their Type</h2>
                {allTags.map((tag, index) => (
                    <div key={`${tag.tagType}-${index}`} className=" ">
                        <div className="flex flex-col justify-between items-start mb-2">
                            <div className="flex">
                                <input
                                    id={tag.tagType}
                                    name={tag.tagType}
                                    type="text"
                                    value={tag.tagType}
                                    className="border px-4 py-2 rounded w-full"
                                    onChange={(e) => {
                                        setAllTags((prev) => {
                                            const updatedTags = [...prev];
                                            updatedTags[index].tagType = e.target.value;
                                            return updatedTags;
                                        });
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setAllTags((prev) =>
                                            prev.filter((t) => t.tagType !== tag.tagType)
                                        );
                                    }}
                                    className="bg-red-500 text-white px-2 py-1 ml-2 rounded hover:bg-red-600">
                                    Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setAllTags((prev) => {
                                            const updatedTags = [...prev];
                                            updatedTags[index].tags = [...(updatedTags[index].tags || []), ""];
                                            return updatedTags;
                                        });
                                    }}
                                    className="bg-blue-500 text-white px-2 py-1 ml-2 rounded hover:bg-blue-600">
                                    Add
                                </button>
                            </div>
                            <h3>Tags</h3>
                            <div className="allTags flex flex-wrap gap-2">
                                {(tag.tags || []).map((t, tIndex) => (
                                    <div
                                        key={`${tag.tagType}-${tIndex}`}
                                        className="flex gap-2 border px-4 py-2 rounded-full bg-gray-300 mb-2">
                                        <input
                                            name={t}
                                            value={t}
                                            type="text"
                                            className="w-32 bg-gray-200 rounded-full px-4 py-2"
                                            onChange={(e) => {
                                                setAllTags((prev) => {
                                                    const updatedTags = [...prev];
                                                    updatedTags[index].tags[tIndex] = e.target.value;
                                                    return updatedTags;
                                                });
                                            }} />
                                        <button
                                            onClick={() => {
                                                setAllTags((prev) => {
                                                    const updatedTags = [...prev];
                                                    const tagArray = updatedTags[index].tags.filter(
                                                        (tagValue, idx) => idx !== tIndex
                                                    );
                                                    if (tagArray.length === 0) {
                                                        fireMessage("At least one keyword should be present", "error");
                                                        return prev;
                                                    }
                                                    updatedTags[index].tags = tagArray;
                                                    return updatedTags;
                                                });
                                            }}
                                            className="delete-btn"
                                        >
                                            <svg
                                                className="delete w-6 h-6"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 -960 960 960"
                                                fill="black"
                                            >
                                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

            </div>
            <div className="save-changes flex justify-evenly">
                <button type="button" onClick={(e) => {
                    Swal.fire({
                        title: "Are you sure?",
                        text: "You won't be able to revert this!",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Yes, Update it!"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // actual deletion 
                            setOrignalAllTags(allTags)
                            updateAllChanges()
                        }
                    });
                }} className="text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold">Save</button>
                <button type="button" onClick={(e) => {
                    setAllTags(orignalAllTags)
                }} className="text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold">Cancle</button>
            </div>
        </div >
    );
};

export default AddTag;
