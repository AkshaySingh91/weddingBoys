/**
 * The starting values of the visibility fields for data that predates them.
 * Shared by migrateVisibility.js and backfillPortfolioItems.js so an item
 * created by either gets the same answer.
 *
 * The aim is "nothing a visitor can see changes": everything production shows
 * today stays visible, and nothing hidden appears.
 */
import { hasRender } from '../../Services/portfolioVisibility.js';

const hasEmbeddedWork = (c) => (c?.videos?.length || 0) + (c?.photos?.length || 0) > 0;

/**
 * A wedding without a status predates the field. If it has embedded films or
 * photos, production shows it today, so it is Published; otherwise Draft.
 */
export const baselineClientStatus = (client) => client?.status || (hasEmbeddedWork(client) ? 'Published' : 'Draft');

/**
 * Ready when processed and there is something to show. One exception: a
 * backfilled (legacy) item whose Media record was archived while its files are
 * still served. Production shows those today, so they stay; cutoverReport.js
 * lists them for the admin to hide deliberately.
 */
export function baselineMediaReady(item, mediaStatus) {
    if (!hasRender(item.kind, item.render)) return false;
    if (mediaStatus === 'Ready') return true;
    return mediaStatus === 'Archived' && Boolean(item.legacy?.subdocId);
}

/**
 * Item intent. Before this change, uploading into a wedding forced Draft while
 * the file processed, so every Add Wedding upload is Draft whatever the admin
 * meant. In a draft wedding the intended rule is "goes live with the wedding",
 * so those become Published — the wedding's own Draft still keeps them off the
 * site. Items in a live wedding keep their status: there Draft may mean hidden.
 */
export function baselineItemStatus(item, clientStatus) {
    if (item.status === 'Draft' && !item.legacy?.subdocId && clientStatus === 'Draft') return 'Published';
    return item.status;
}
