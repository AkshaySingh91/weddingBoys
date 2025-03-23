import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();

const DBUrl = process.env.MONGO_URI;

export default async function DBconnection() {
    try {
        await mongoose.connect(DBUrl, {
            serverApi: {
                version: '1', strict: true, deprecationErrors: true
            },
            connectTimeoutMS: 30000
        }); 
    }
    catch (e) {
        console.dir(e.message);
    } 
}

const db = mongoose.connection;
db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

db.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

// Gracefully close the connection when the application exits
process.on('SIGINT', () => {
    mongoose.connection.close();
});