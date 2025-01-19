import React from 'react'

function Loader() {
    return (
        <>
            <div className="min-h-screen flex justify-center items-center bg-transparent ">
                <div className="loader bg-white p-5 rounded-full flex space-x-3 border-2 border-black">
                    <div className="w-5 h-5 bg-gray-800 rounded-full animate-bounce delay-1000 ease-in-out"></div>
                    <div className="w-5 h-5 bg-gray-800 rounded-full animate-bounce delay-500 ease-in-out"></div>
                    <div className="w-5 h-5 bg-gray-800 rounded-full animate-bounce delay-200 ease-in-out"></div>
                </div>
            </div> :
        </>
    )
}
export default Loader
