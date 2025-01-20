import React, { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2';
import FilteredFilms from './FilteredFilms';
const api_url = process.env.REACT_APP_API_URL;
 
function AllFilms() {
    const [isLoading, setIsLoading] = useState(false);
    const [allTags, setAllTags] = useState([]);
    const [filters, setFilters] = useState({});
    const [videos, setVideos] = useState([]);
    const [hasMoreVideos, setHasMoreVideos] = useState(true);
    const limit = useRef(10);
    const page = useRef(1);

    async function fetchAllTags() {
        try {
            const res = await fetch(`${api_url}/api/get-all-tags`);
            const data = await res.json()
            if (!res.ok || !data.allTags) {
                throw new Error(data.message);
            }
            const filterTypes = {};
            for (const t of data.allTags) {
                filterTypes[t.tagType] = ""
            }
            setFilters(filterTypes);
            setAllTags(data.allTags);
        } catch (error) {
            Swal.fire({
                icon: "error",
                text: error.message,
                title: "Error on fetching tags",
                timer: 2000
            })
        }
    }
    // Fetch videos based on filters
    const fetchVideos = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = "";
            const p = Number.isInteger(page.current) ? page.current : 1;
            const l = Number.isInteger(limit.current) ? limit.current : 1;
            for (const key in filters) {
                if (filters[key].trim()) {
                    query = query + `${filters[key].trim()},`
                }
            }
            const res = await fetch(`${api_url}/api/videos?tag=${query}&page=${p}&limit=${l}`);
            const data = await res.json();
            if (!res.ok || !data.client) throw new Error(data.message);
            setHasMoreVideos(data.client.length === l);
            setVideos(prev => [...prev, ...data.client]);
            // change page 
            page.current = p + 1
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error fetching videos", text: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => {
        fetchAllTags()
    }, [])
    const handleFilterChange = (filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
    };

    useEffect(() => {
        if (Object.values(filters).length) {
            page.current = 1
            setVideos([])
            fetchVideos();
        }
    }, [filters, fetchVideos]);
    return (
        <>
            <h1 className="text-2xl mx-auto text-nowrap font-semibold mb-6 w-fit">Search Films
                <hr className="mx-auto w-1/2 border-[1px] border-slate-300 my-2" />
            </h1>
            <div className="w-full flex flex-wrap items-center justify-center gap-4 mb-8">
                {allTags.map((filterType) => (
                    <div key={filterType.tagType}>
                        <select
                            value={filters[filterType.tagType]}
                            onChange={(e) => handleFilterChange(filterType.tagType, e.target.value)}
                            className="w-full p-2 border rounded shadow">
                            <option value="" >Select {filterType.tagType}</option>
                            {filterType.tags.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            <FilteredFilms
                loading={isLoading}
                clientVideos={videos}
                fetchMoreVideos={fetchVideos}
                hasMoreVideos={hasMoreVideos}
            />

        </>
    )
}

export default AllFilms
