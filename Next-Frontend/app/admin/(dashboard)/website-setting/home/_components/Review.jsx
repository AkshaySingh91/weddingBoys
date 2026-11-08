'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';
import ReviewEdit from './ReviewEdit.jsx';
import WeddingSelect from './WeddingSelect.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Input } from '@/app/admin/components/ui/Input.jsx';
import { Textarea } from '@/app/admin/components/ui/Textarea.jsx';
import { Select } from '@/app/admin/components/ui/Select.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import {
  Plus,
  PencilSimple,
  Trash,
  CaretLeft,
  CaretRight,
  UploadSimple,
  Quotes,
  Heart,
  CircleNotch,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function Review() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newReview, setNewReview] = useState({
    photo: null,
    reviewText: '',
    person: { name: '', gender: 'Bride' },
    client: null,
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const totalReviews = reviews.length;

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/reviews`);
      const data = await res.json();
      if (res.status !== 200) throw new Error(data.message);
      if (data.reviews && data.reviews.length) {
        setReviews(data.reviews);
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? Math.max(0, totalReviews - 1) : prev - 1));
  }, [totalReviews]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (totalReviews > 0 ? (prev + 1) % totalReviews : 0));
  }, [totalReviews]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(() => {
    const changeInPosition = touchEndX.current - touchStartX.current;
    if (changeInPosition > 50) {
      handlePrev();
    } else if (changeInPosition < -50) {
      handleNext();
    }
  }, [handlePrev, handleNext]);

  useEffect(() => {
    if (slide.current) {
      slide.current.style.transform = `translateX(${-currentSlide * 100}%)`;
    }
  }, [currentSlide]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      const name = `${f.name.split('.')[0]}_${Date.now()}.${f.type.split('/')[1] || 'jpg'}`;
      const blob = f.slice(0, f.size);
      const newF = new File([blob], name, { type: f.type });
      setFilePreview(URL.createObjectURL(newF));
      setFile(newF);
      setNewReview((prev) => ({
        ...prev,
        photo: { name, size: newF.size, type: newF.type },
      }));
    }
  };

  const handleCancelAdd = () => {
    setFilePreview(null);
    setFile(null);
    setNewReview({
      photo: null,
      reviewText: '',
      person: { name: '', gender: 'Bride' },
      client: null,
    });
    setIsAdding(false);
  };

  const handleSaveNew = async (e) => {
    e?.preventDefault();
    if (!file || !newReview.reviewText?.trim() || !newReview.person?.name?.trim()) {
      return fireMessage('Please provide client photo, testimonial text, and name.', 'error');
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${api_url}/api/admin/review/get-put-url`, {
        method: 'POST',
        body: JSON.stringify({ newReview }),
        headers: { 'Content-type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status >= 300 || !data.urls) {
        throw new Error(data.message || 'Failed to get upload authorization.');
      }

      // Upload file directly to S3 / Cloudflare R2
      const putRes = await fetch(data.urls.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('Failed to upload couple photo to storage.');
      }

      // Save review document
      const saveRes = await fetch(`${api_url}/api/admin/review/save-details`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newReview, key: data.urls.key }),
      });
      const saveData = await saveRes.json();
      if (saveRes.status >= 300) {
        throw new Error(saveData.message || 'Failed to save review details.');
      }

      fireMessage('Couple testimonial published successfully.', 'success');
      handleCancelAdd();
      fetchReviews();
    } catch (error) {
      fireMessage(error.message || 'Something went wrong during upload.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (key) => {
    const detail = reviews.find((r) => r.photo?.key === key);
    if (!detail) {
      return fireMessage('Review not found.', 'error');
    }
    setEditingReview(detail);
    setIsEditing(true);
  };

  const handleDeleteReview = async () => {
    if (!deleteConfirmKey) return;
    const reviewDetails = reviews.find((r) => r.photo?.key === deleteConfirmKey);
    if (!reviewDetails) {
      setDeleteConfirmKey(null);
      return fireMessage('Review not found.', 'error');
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${api_url}/api/admin/reviews`, {
        method: 'DELETE',
        body: JSON.stringify({ reviewDetials: reviewDetails }),
        headers: { 'Content-type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status >= 300) {
        throw new Error(data.message || 'Failed to delete review.');
      }
      setReviews((prev) => prev.filter((r) => r.photo?.key !== deleteConfirmKey));
      fireMessage('Couple testimonial removed.', 'success');
      setDeleteConfirmKey(null);
    } catch (error) {
      fireMessage(error.message || 'Error deleting review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-edge-subtle pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-sans text-ink">
            <Heart size={20} weight="fill" className="text-accent-ink" />
            Couple Testimonials
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Featured quotes, portraits, and love notes from couples appearing on the homepage.
          </p>
        </div>

        <Button
          variant="terracotta"
          size="sm"
          icon={Plus}
          onClick={() => setIsAdding(true)}
        >
          Add New Review
        </Button>
      </div>

      {/* Add Review Dialog */}
      <Dialog open={isAdding} onOpenChange={(open) => { if (!open) handleCancelAdd(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Couple Testimonial</DialogTitle>
            <DialogDescription>
              Upload a couple photo and write their love note for the homepage carousel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Portrait Photo Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                Couple Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-edge-subtle bg-ground-sunk flex items-center justify-center">
                  {filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UploadSimple size={24} className="text-ink-muted" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    id="new-review-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="new-review-photo"
                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-edge-subtle bg-white px-3 py-1.5 text-xs font-medium text-ink-secondary shadow-sm transition hover:border-accent hover:bg-ground"
                  >
                    <UploadSimple size={14} />
                    <span>Upload Photo</span>
                  </label>
                  {filePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilePreview(null);
                        setFile(null);
                        setNewReview((prev) => ({ ...prev, photo: null }));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 transition"
                    >
                      <Trash size={12} />
                      <span>Clear Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Testimonial Text */}
            <Textarea
              label="Love Note / Review"
              rows={4}
              value={newReview.reviewText}
              onChange={(e) =>
                setNewReview({ ...newReview, reviewText: e.target.value })
              }
              placeholder="e.g. The Wedding Vachan captured the soul of our wedding day in Udaipur with sheer poetry..."
              maxLength={500}
            />

            {/* Couple Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Couple / Client Name"
                placeholder="e.g. Rhea & Dev"
                value={newReview.person.name}
                onChange={(e) =>
                  setNewReview({
                    ...newReview,
                    person: { ...newReview.person, name: e.target.value },
                  })
                }
              />

              <Select
                label="Role / Title"
                value={newReview.person.gender}
                onChange={(e) =>
                  setNewReview({
                    ...newReview,
                    person: { ...newReview.person, gender: e.target.value },
                  })
                }
                options={[
                  { value: 'Bride', label: 'Bride' },
                  { value: 'Groom', label: 'Groom' },
                  { value: 'Couple', label: 'Couple' },
                  { value: 'Family', label: 'Family' },
                ]}
              />
            </div>

            <WeddingSelect
              value={newReview.client}
              onChange={(client) => setNewReview({ ...newReview, client })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAdd} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="terracotta"
              onClick={handleSaveNew}
              loading={isSubmitting}
            >
              Publish Testimonial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmKey} onOpenChange={(open) => { if (!open) setDeleteConfirmKey(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Testimonial?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this couple testimonial from the homepage? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmKey(null)} disabled={isSubmitting}>
              Keep
            </Button>
            <Button variant="danger" onClick={handleDeleteReview} loading={isSubmitting}>
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-muted">
          <CircleNotch size={24} className="animate-spin text-accent-ink" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge-subtle bg-white p-12 text-center">
          <Quotes size={32} className="mx-auto text-ink-muted mb-2" />
          <h3 className="font-sans text-base text-ink">No Reviews Yet</h3>
          <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
            Add testimonials from past couples to establish social proof on the public homepage.
          </p>
          <Button
            variant="terracotta"
            size="sm"
            icon={Plus}
            className="mt-4"
            onClick={() => setIsAdding(true)}
          >
            Add First Review
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Carousel Preview Card */}
          <div className="relative overflow-hidden rounded-xl border border-edge-subtle bg-ground p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-accent-ink">
                Live Homepage Preview
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-edge-subtle bg-white text-ink-secondary hover:bg-ground transition shadow-sm"
                  aria-label="Previous review"
                >
                  <CaretLeft size={14} />
                </button>
                <span className="text-xs font-semibold tabular-nums text-ink-muted px-1">
                  {currentSlide + 1} / {totalReviews}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-edge-subtle bg-white text-ink-secondary hover:bg-ground transition shadow-sm"
                  aria-label="Next review"
                >
                  <CaretRight size={14} />
                </button>
              </div>
            </div>

            <div
              className="overflow-hidden relative min-h-[220px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex transition-transform duration-500" ref={slide}>
                {reviews.map((rev) => (
                  <div key={rev.photo?.key || rev._id} className="w-full shrink-0">
                    <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                      <div className="relative h-44 w-44 md:h-52 md:w-52 shrink-0 overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rev.url}
                          alt={rev.person?.name || 'Couple'}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 text-center md:text-left space-y-3">
                        <Quotes size={24} className="text-accent-ink opacity-60 hidden md:block" />
                        <p className="font-sans italic text-ink text-sm sm:text-base leading-relaxed max-w-xl">
                          &ldquo;{rev.reviewText}&rdquo;
                        </p>
                        <div>
                          <p className="font-sans font-semibold text-ink text-base">
                            {rev.person?.name}
                          </p>
                          <p className="text-xs text-accent-ink uppercase tracking-wider font-medium">
                            {rev.person?.gender || 'Client'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roster Table of all Reviews */}
          <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              All Testimonials ({reviews.length})
            </h3>

            <div className="divide-y divide-edge-subtle">
              {reviews.map((rev, idx) => (
                <div
                  key={rev.photo?.key || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-edge-subtle bg-ground-sunk">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rev.url}
                        alt={rev.person?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">
                        {rev.person?.name}
                        <span className="ml-2 text-[10px] text-ink-muted font-normal">
                          ({rev.person?.gender})
                        </span>
                      </p>
                      <p className="text-xs text-ink-muted line-clamp-1 max-w-md font-sans italic">
                        &ldquo;{rev.reviewText}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={PencilSimple}
                      onClick={() => handleEditReview(rev.photo?.key)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => setDeleteConfirmKey(rev.photo?.key)}
                      aria-label="Delete review"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {isEditing && editingReview && (
        <ReviewEdit
          setIsEditing={setIsEditing}
          setEditingReview={setEditingReview}
          editingReview={editingReview}
        />
      )}
    </div>
  );
}
