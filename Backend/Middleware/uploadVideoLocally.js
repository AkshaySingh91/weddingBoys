import multer from "multer"
import path from 'path'
import { nanoid } from "nanoid"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.split('/')[0] === 'video') {
            cb(null, path.join(__dirname, '../Public', 'Videos'))
        } else if (file.mimetype.split('/')[0] === 'image') {
            cb(null, path.join(__dirname, '../Public', 'Images'))
        } else {
            cb(new Error('Unsupported file type'), false)
        }
    },
    filename: (req, file, cb) => {
        const fileExt = file.mimetype.split('/')[1];
        let newFileName = ''
        if (file.mimetype.split('/')[0] === 'video') {
            newFileName = `video_${nanoid(21)}.${fileExt}`;
        } else if (file.mimetype.split('/')[0] === 'image') {
            newFileName = `img_${nanoid(21)}.${fileExt}`;
        } else {
            cb(new Error('Unsupported file type'), false)
        }
        cb(null, newFileName);
    }
})
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
}
export default multer({ fileFilter, storage });