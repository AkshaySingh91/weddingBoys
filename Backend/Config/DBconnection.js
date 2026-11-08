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
        announceEnvironment();
    }
    catch (e) {
        throw new Error('Database connection failed', { cause: e });
    }
}

/**
 * Say which database and which storage mode this process is using, every time.
 *
 * Development used to point at the production database without anyone knowing:
 * every local admin action was a live write. This line makes that impossible to
 * miss, and the warnings catch the two inconsistent combinations.
 */
function announceEnvironment() {
    const name = mongoose.connection?.db?.databaseName;
    const prefix = (process.env.STORAGE_KEY_PREFIX || '').trim();
    const storage = prefix ? `guarded (${prefix}/)` : 'UNGUARDED (production mode)';
    console.log(`[env] database "${name}" · storage ${storage}`);
    if (name === 'test' && prefix) {
        console.warn('[env] WARNING: storage guard is on but this is the PRODUCTION database "test".');
    }
    if (name !== 'test' && !prefix) {
        console.warn(`[env] WARNING: non-production database "${name}" with an UNGUARDED storage bucket — `
            + 'deletes here can remove production files. Set STORAGE_KEY_PREFIX.');
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
