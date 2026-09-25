/**
 * The shared contract for every data script:
 *
 *   --dry-run            report what would change; write nothing (the default)
 *   --apply              make the change, recording every document touched
 *   --verify             read-only check that the change is complete
 *   --rollback=<runId>   undo one recorded --apply run
 *
 * Each --apply run gets a run id, printed at the start and the end, and is stored
 * in `scriptruns`, with one row per touched document in `scriptrunchanges`
 * (so a large run never meets the 16 MB document limit). A rollback reads those
 * rows back; what "undo" means for a row is up to the script, which knows its data.
 *
 * Both collections live in the database the script ran against, so a run on a
 * rehearsal copy can never be rolled back against production or the other way.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';

const runs = () => mongoose.connection.db.collection('scriptruns');
const changes = () => mongoose.connection.db.collection('scriptrunchanges');

/** Parses the mode flags. Exactly one mode; none means --dry-run. */
export function parseMode(argv = process.argv) {
    const rollback = (argv.find((a) => a.startsWith('--rollback=')) || '').slice('--rollback='.length);
    const flags = {
        dryRun: argv.includes('--dry-run'),
        apply: argv.includes('--apply'),
        verify: argv.includes('--verify'),
        rollback: Boolean(rollback),
    };
    const chosen = Object.entries(flags).filter(([, on]) => on).map(([k]) => k);
    if (chosen.length > 1) {
        console.error(`choose one of --dry-run, --apply, --verify, --rollback=<runId> (got ${chosen.join(', ')})`);
        process.exit(2);
    }
    return { mode: chosen[0] || 'dryRun', runId: rollback || null };
}

/** Starts an --apply run. `record` queues a change; `finish` writes the rest and the summary. */
export async function startRun(script, { args = process.argv.slice(2) } = {}) {
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const runId = `${script}-${stamp}-${crypto.randomBytes(2).toString('hex')}`;
    const database = mongoose.connection.db.databaseName;
    await runs().insertOne({ runId, script, database, args, status: 'running', startedAt: new Date() });
    console.log(`run ${runId} · database "${database}"`);

    let buffer = [];
    let count = 0;
    const flush = async () => {
        if (!buffer.length) return;
        await changes().insertMany(buffer, { ordered: false });
        buffer = [];
    };

    return {
        runId,
        /** `change` is script-defined, e.g. { op: 'create', docId } or { op: 'update', docId, before }. */
        async record(change) {
            buffer.push({ runId, at: new Date(), ...change });
            count += 1;
            if (buffer.length >= 500) await flush();
        },
        async finish(summary = {}) {
            await flush();
            await runs().updateOne({ runId }, { $set: { status: 'applied', finishedAt: new Date(), changeCount: count, summary } });
            console.log(`run ${runId} recorded ${count} change(s). Undo with --rollback=${runId}`);
        },
        async fail(error) {
            await flush();
            await runs().updateOne({ runId }, { $set: { status: 'failed', finishedAt: new Date(), changeCount: count, error: String(error?.message || error) } });
        },
    };
}

/**
 * Loads an --apply run for rollback. Refuses a run from another script, one that
 * is not in this database, or one already rolled back.
 */
export async function loadRun(script, runId) {
    const run = await runs().findOne({ runId });
    if (!run) throw new Error(`no run "${runId}" in database "${mongoose.connection.db.databaseName}"`);
    if (run.script !== script) throw new Error(`run "${runId}" belongs to ${run.script}, not ${script}`);
    if (run.status === 'rolled-back') throw new Error(`run "${runId}" was already rolled back at ${run.rolledBackAt.toISOString()}`);
    const rows = await changes().find({ runId }).sort({ at: 1, _id: 1 }).toArray();
    return { run, changes: rows };
}

export async function markRolledBack(runId, summary = {}) {
    await runs().updateOne({ runId }, { $set: { status: 'rolled-back', rolledBackAt: new Date(), rollbackSummary: summary } });
}
