import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

const uploadOnCloudinary = async (filepath, folder) => {
    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        folder,
        resource_type: "auto"
    };
    try {
        const result = await cloudinary.uploader.upload(filepath, options);
        fs.unlink(filepath, (err) => {
            if (err) {
                throw new Error("Unable to delete local file.")
            }
        });
        return result;
    } catch (error) {
        console.error('Error on uploding file ', error);
    }
}
const deleteFromCloudinary = async (publicId) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
            console.error("Error deleting the image:", error);
            throw new Error("Error deleting the image:", error.message);
        } else {
            console.log("Image deleted successfully:", result);
            return true;
        }
    });
}
export { uploadOnCloudinary, deleteFromCloudinary };