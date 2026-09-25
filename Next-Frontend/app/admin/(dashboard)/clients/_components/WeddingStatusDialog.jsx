'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const COPY = {
    Draft: {
        title: 'Unpublish this wedding?',
        action: 'Unpublish',
        body: 'Its films and photographs leave the public site straight away. Nothing is deleted, and each item keeps its own setting: publishing the wedding again brings back exactly what is live now.',
    },
    Archived: {
        title: 'Archive this wedding?',
        action: 'Archive',
        body: 'Its films and photographs leave the public site and the wedding is marked archived. Nothing is deleted; you can publish it again later.',
    },
};

/**
 * Confirms taking a wedding off the site. Only needed in that direction:
 * publishing is shown by the header badge and the card chips turning Live.
 */
export default function WeddingStatusDialog({ target, liveCount, loading, onConfirm, onClose }) {
    const copy = COPY[target];
    return (
        <Dialog open={Boolean(copy)} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md">
                {copy && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{copy.title}</DialogTitle>
                            <DialogDescription>
                                {liveCount > 0
                                    ? `${liveCount} item${liveCount === 1 ? ' is' : 's are'} live on the site right now.`
                                    : 'Nothing from this wedding is live on the site right now.'}
                            </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-stone-600">{copy.body}</p>
                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                            <Button variant="danger" size="sm" loading={loading} onClick={() => onConfirm(target)}>{copy.action}</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
