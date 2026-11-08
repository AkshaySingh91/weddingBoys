'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PhoneCall,
  CalendarBlank,
  Trash,
  Eye,
  Heart,
  PaperPlaneTilt,
  Clock,
  Compass,
  Sparkle,
  CheckCircle,
  UserCheck,
} from '@phosphor-icons/react';
import { apiFetch } from '@/lib/apiClient.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Card, CardContent } from '@/app/admin/components/ui/Card.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { DataTable } from '@/app/admin/components/ui/DataTable.jsx';
import PageHeader from '@/app/admin/components/ui/PageHeader.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { cn } from '@/lib/utils.js';

export default function ClientEnquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'reviewed'

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/get-clients-enquiry', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.allInquiries)) {
        setInquiries(data.allInquiries);
      } else {
        fireMessage(data.message || 'Failed to fetch inquiries', 'error');
      }
    } catch (error) {
      fireMessage(error.message || 'Network error fetching inquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInquiries();
  }, [fetchInquiries]);

  const markViewed = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/enquires/mark-viewed/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isViewed: true } : item))
        );
      }
    } catch (err) {
      console.error('Mark viewed error:', err);
    }
  };

  const handleOpenDetails = (inq) => {
    setSelectedInquiry(inq);
    if (!inq.isViewed) {
      markViewed(inq._id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/enquires/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fireMessage('Inquiry deleted successfully', 'success');
        setInquiries((prev) => prev.filter((item) => item._id !== id));
        setDeleteConfirmId(null);
        if (selectedInquiry?._id === id) setSelectedInquiry(null);
      } else {
        fireMessage('Unable to delete inquiry', 'error');
      }
    } catch (err) {
      fireMessage(err.message || 'Network error deleting inquiry', 'error');
    }
  };

  // Pipeline metrics
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const newLeads = inquiries.filter((i) => !i.isViewed).length;
    const reviewed = inquiries.filter((i) => i.isViewed).length;
    return { total, newLeads, reviewed };
  }, [inquiries]);

  // Filter based on status
  const displayedInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter === 'new') return !inq.isViewed;
      if (statusFilter === 'reviewed') return inq.isViewed;
      return true;
    });
  }, [inquiries, statusFilter]);

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const formatDateRange = (dateObj) => {
    if (!dateObj?.start) return 'Date TBD';
    const start = dateObj.start;
    const end = dateObj.end;
    if (end && end !== start) {
      return `${start} → ${end}`;
    }
    return start;
  };

  const columns = [
    {
      key: 'couple',
      label: 'Couple & Story',
      width: '28%',
      render: (row) => {
        const brideInitial = row.Bride ? row.Bride.charAt(0).toUpperCase() : 'B';
        const groomInitial = row.Groom ? row.Groom.charAt(0).toUpperCase() : 'G';

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ground-sunk border border-edge-subtle flex items-center justify-center text-ink font-semibold text-xs shrink-0 tabular-nums">
              {brideInitial}&{groomInitial}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-ink text-xs block truncate">
                {row.Bride || 'Bride'} & {row.Groom || 'Groom'}
              </span>
              <span className="text-[11px] text-ink-muted font-sans flex items-center gap-1 mt-0.5 truncate">
                <Compass size={12} className="text-ink-muted shrink-0" />
                <span className="truncate">{row.Reach || 'Website Direct'}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'Contact',
      label: 'Direct Contact',
      width: '26%',
      render: (row) => {
        const raw = row.Contact || '';
        const digits = cleanPhone(raw);
        const isEmail = raw.includes('@');

        return (
          <div className="space-y-0.5">
            <span className="font-medium text-ink text-xs block truncate tabular-nums">
              {raw || 'Not provided'}
            </span>
            {digits && !isEmail && (
              <a
                href={`https://wa.me/${digits.replace(/^\+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors whitespace-nowrap"
              >
                <PaperPlaneTilt size={11} weight="bold" />
                WhatsApp Direct
              </a>
            )}
          </div>
        );
      },
    },
    {
      key: 'Date',
      label: 'Wedding Dates',
      width: '22%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-ink-secondary whitespace-nowrap">
          <CalendarBlank size={14} className="text-ink-muted shrink-0" />
          <span className="font-medium text-xs tabular-nums whitespace-nowrap">
            {formatDateRange(row.Date)}
          </span>
        </div>
      ),
    },
    {
      key: 'Status',
      label: 'CRM Status',
      width: '12%',
      render: (row) => (
        <Badge
          variant={row.isViewed ? 'neutral' : 'warning'}
          size="sm"
          dot
          dotColor={row.isViewed ? 'bg-stone-400' : 'bg-amber-600'}
        >
          {row.isViewed ? 'Reviewed' : 'New Lead'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '12%',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDetails(row)}
            icon={Eye}
            className="text-ink-secondary hover:text-ink px-2.5 h-7 text-xs"
          >
            Review
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            className="text-ink-muted hover:text-rose-600 hover:bg-rose-50 h-7 w-7"
            onClick={() => setDeleteConfirmId(row._id)}
            title="Delete Inquiry"
          >
            <Trash size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Studio Header & Filter Switcher */}
      <PageHeader
        title="Client Inquiries & Booking Pipeline"
        subtitle="Operational CRM for couple inquiries, wedding dates, and outreach coordination."
        actions={
          <div className="flex items-center gap-1 bg-ground-sunk p-1 rounded-xl border border-edge-subtle shadow-inner">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                statusFilter === 'all'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              )}
            >
              All Leads ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                statusFilter === 'new'
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              New ({metrics.newLeads})
            </button>
            <button
              onClick={() => setStatusFilter('reviewed')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
                statusFilter === 'reviewed'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              )}
            >
              Reviewed ({metrics.reviewed})
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-edge-subtle bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Total Inquiries
              </p>
              <h3 className="text-2xl font-bold text-ink mt-0.5 tabular-nums">
                {metrics.total}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-ground-sunk border border-edge-subtle flex items-center justify-center text-ink-secondary">
              <Heart size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-edge-subtle bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                New Actionable Leads
              </p>
              <h3 className="text-2xl font-bold text-amber-950 mt-0.5 tabular-nums">
                {metrics.newLeads}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-edge-subtle bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Reviewed & In Dialogue
              </p>
              <h3 className="text-2xl font-bold text-ink mt-0.5 tabular-nums">
                {metrics.reviewed}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-ground-sunk border border-edge-subtle flex items-center justify-center text-ink-secondary">
              <UserCheck size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main CRM Data Table */}
      <DataTable
        columns={columns}
        data={displayedInquiries}
        keyField="_id"
        searchPlaceholder="Search by couple, contact, date, or referral channel..."
        searchKeys={['Bride', 'Groom', 'Contact', 'Date.start', 'Reach']}
        pageSize={10}
        emptyMessage="No Inquiries Found in this View"
        emptySubMessage="Couples who submit the booking form on the public site will appear here."
        renderMobileCard={(row) => (
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-accent-ink" />
                <h4 className="text-xs font-bold text-ink">
                  {row.Bride || 'Bride'} & {row.Groom || 'Groom'}
                </h4>
              </div>
              <Badge variant={row.isViewed ? 'neutral' : 'warning'} size="sm">
                {row.isViewed ? 'Reviewed' : 'New'}
              </Badge>
            </div>

            <div className="text-xs text-ink-secondary space-y-1">
              <div className="flex items-center gap-2">
                <PhoneCall size={13} className="text-ink-muted" />
                <span className="tabular-nums">{row.Contact || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarBlank size={13} className="text-ink-muted" />
                <span className="tabular-nums whitespace-nowrap">{formatDateRange(row.Date)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge-subtle">
              <Button variant="outline" size="sm" onClick={() => handleOpenDetails(row)} icon={Eye}>
                View Details
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                className="text-ink-muted hover:text-rose-600"
                onClick={() => setDeleteConfirmId(row._id)}
              >
                <Trash size={14} />
              </Button>
            </div>
          </div>
        )}
      />

      {/* Couple Details Modal Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <div className="flex items-center gap-1.5 text-accent-ink mb-1">
              <Sparkle size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Wedding Booking Request
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-ink font-sans">
              {selectedInquiry?.Bride || 'Bride'} & {selectedInquiry?.Groom || 'Groom'}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted font-sans">
              Direct booking inquiry from the studio marketing portal.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-3 py-2 text-xs font-sans">
              {/* Couple Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-ground border border-edge-subtle">
                <div>
                  <span className="text-ink-muted font-medium text-[11px] uppercase tracking-wider">
                    Bride
                  </span>
                  <p className="text-xs font-bold text-ink mt-0.5">
                    {selectedInquiry.Bride || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted font-medium text-[11px] uppercase tracking-wider">
                    Groom
                  </span>
                  <p className="text-xs font-bold text-ink mt-0.5">
                    {selectedInquiry.Groom || '—'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-edge-subtle">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <PhoneCall size={14} className="text-ink-muted" />
                    Contact:
                  </span>
                  <a
                    href={`tel:${selectedInquiry.Contact}`}
                    className="font-semibold text-ink hover:text-accent-ink tabular-nums"
                  >
                    {selectedInquiry.Contact || '—'}
                  </a>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-edge-subtle">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <CalendarBlank size={14} className="text-ink-muted" />
                    Wedding Dates:
                  </span>
                  <span className="font-semibold text-ink tabular-nums whitespace-nowrap">
                    {formatDateRange(selectedInquiry.Date)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-edge-subtle">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <Compass size={14} className="text-ink-muted" />
                    Referral Channel:
                  </span>
                  <span className="font-medium text-ink">
                    {selectedInquiry.Reach || 'Website Direct'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-edge-subtle">
                  <span className="text-ink-secondary font-medium flex items-center gap-1.5">
                    <Clock size={14} className="text-ink-muted" />
                    Submitted:
                  </span>
                  <span className="text-ink-secondary tabular-nums">
                    {selectedInquiry.SubmittedTime || 'Recent submission'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(null)}>
              Close
            </Button>
            {selectedInquiry?.Contact && (
              <a
                href={`https://wa.me/${cleanPhone(selectedInquiry.Contact).replace(/^\+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="gold" size="sm" icon={PaperPlaneTilt}>
                  Chat on WhatsApp
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-ink">
              Permanently Remove Inquiry
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Are you sure you want to remove this client inquiry? This record will be permanently deleted from the CRM pipeline.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="dangerSolid"
              size="sm"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
