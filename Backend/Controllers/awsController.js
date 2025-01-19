import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// config nodejs client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

async function getObjectUrl(key, expiresIn = 3600) {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        })
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url
    } catch (error) { 
        throw new Error('Error on Getting media url');
    }
}

async function putObjectUrl(key, type, expiresIn = 60 * 5) {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: type,
        });
        const url = await getSignedUrl(s3Client, command, {
            Expires: expiresIn
        })
        return url;
    } catch (error) { 
        throw new Error('Error generating presigned URLs');
    }
}
async function deleteObject(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command); 
    } catch (error) { 
        throw new Error('File deletion failed');
    }
}



export { getObjectUrl, putObjectUrl, deleteObject }