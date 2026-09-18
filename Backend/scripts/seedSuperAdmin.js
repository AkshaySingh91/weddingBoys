/**
 * Bootstrap the very first SuperAdmin.
 *
 *   node scripts/seedSuperAdmin.js --email you@example.com --password 'Str0ngPass!' --name "Akshay Singh"
 *
 * Safe to re-run: if the email already exists it is promoted to SuperAdmin/Active
 * (and the password is updated only when --password is supplied).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../Models/adminSchema.js';
import { ROLES } from '../constants.js';

const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : undefined;
};

async function main() {
    const email = (arg('--email') || process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
    const password = arg('--password') || process.env.SEED_ADMIN_PASSWORD;
    const name = arg('--name') || process.env.SEED_ADMIN_NAME || 'Super Admin';

    if (!email) {
        console.error('✖ --email is required (or set SEED_ADMIN_EMAIL)');
        process.exit(1);
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('✖ No Mongo connection string found (MONGODB_URI / MONGO_URI / DB_URL)');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');

    let admin = await Admin.findOne({ email });

    if (admin) {
        admin.role = ROLES.SUPER_ADMIN;
        admin.status = 'Active';
        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = null;
        if (password) {
            admin.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
            console.log('· Password updated');
        }
        await admin.save();
        console.log(`✓ Promoted existing account to SuperAdmin: ${email}`);
    } else {
        if (!password) {
            console.error('✖ --password is required when creating a new account');
            await mongoose.disconnect();
            process.exit(1);
        }
        admin = await Admin.create({
            name,
            email,
            password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
            role: ROLES.SUPER_ADMIN,
            status: 'Active',
        });
        console.log(`✓ Created SuperAdmin: ${email}`);
    }

    console.log(`  id=${admin._id}  userId=${admin.userId}  role=${admin.role}`);
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(async (err) => {
    console.error('✖ Seed failed:', err.message);
    try { await mongoose.disconnect(); } catch { /* already closed */ }
    process.exit(1);
});
