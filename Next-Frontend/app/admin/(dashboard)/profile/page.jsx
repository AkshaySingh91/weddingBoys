"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient.js';
import {
  User, Camera, FloppyDisk, LockKey, Eye, EyeSlash, ShieldCheck, Check, X, CircleNotch, Phone, EnvelopeSimple
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import Button from '@/app/admin/components/ui/Button.jsx';
import Badge from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [id, setId] = useState("");

  // Avatar upload
  const [isNewAvatar, setIsNewAvatar] = useState(false);
  const [newAvatarPreview, setNewAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarMetaData, setAvatarMetaData] = useState(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchAdminDetails() {
      try {
        const res = await apiFetch(`/api/admin/profile`, {
          credentials: "include"
        });
        const data = await res.json();
        if (res.status >= 300 || !data.adminDetail) {
          throw new Error(data.message || 'Failed to load profile');
        }
        const adminDetail = data.adminDetail;
        setName(adminDetail.name || '');
        setEmail(adminDetail.email || '');
        setSavedEmail(adminDetail.email || '');
        setMfaEnabled(Boolean(adminDetail.mfaEnabled));
        setPhone(adminDetail.phone || '');
        setAvatar(adminDetail.avatar || '');
        setId(adminDetail._id || '');
      } catch (error) {
        fireMessage(error.message, 'error');
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    fetchAdminDetails();
  }, [router]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setNewAvatarPreview(preview);
      setAvatarMetaData({
        name: file.name,
        size: file.size,
        type: file.type
      });
      setAvatarFile(file);
      setIsNewAvatar(true);
    }
  };

  const handleCancelNewAvatar = () => {
    if (newAvatarPreview) {
      URL.revokeObjectURL(newAvatarPreview);
    }
    setIsNewAvatar(false);
    setNewAvatarPreview("");
    setAvatarFile(null);
    setAvatarMetaData(null);
  };

  const handleSaveNewAvatar = async () => {
    if (!avatarFile || !avatarMetaData) return;

    const uploadFileInBucket = async (file, presignedUrl) => {
      try {
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (response.ok && response.status === 200) {
          return { isValid: true };
        }
        throw new Error(`Failed to upload file: ${response.statusText}`);
      } catch (error) {
        return { isValid: false, message: error.message };
      }
    };

    setSavingAvatar(true);
    try {
      const res = await apiFetch(`/api/admin/profile/verify`, {
        credentials: "include",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          admin: { name, email, phone, id, avatarMetaData },
          isAvatarUpdated: true, currentPassword: emailPassword
        })
      });
      const data = await res.json();
      if (res.status >= 300 || !data.putUrl || !data.key) {
        throw new Error(data.message || 'Presigned URL generation failed');
      }

      const { putUrl, key } = data;
      const uploadRes = await uploadFileInBucket(avatarFile, putUrl);
      if (!uploadRes.isValid) {
        throw new Error(uploadRes.message);
      }

      const saveRes = await apiFetch(`/api/admin/profile/save`, {
        credentials: "include",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          admin: { name, email, phone, id, key },
          isAvatarUpdated: true, currentPassword: emailPassword
        })
      });
      const saveData = await saveRes.json();
      if (saveRes.status >= 300) {
        throw new Error(saveData.message || 'Failed to save avatar');
      }

      if (saveData.requiresLogin) { router.replace('/admin/login'); return; }
      setAvatar(newAvatarPreview);
      setIsNewAvatar(false);
      fireMessage('Profile avatar updated successfully', 'success');
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e?.preventDefault();
    setSavingDetails(true);
    try {
      const res = await apiFetch(`/api/admin/profile/verify`, {
        credentials: "include",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          admin: { name, email, phone, id },
          isAvatarUpdated: false, currentPassword: emailPassword
        })
      });
      const data = await res.json();
      if (res.status >= 300) {
        throw new Error(data.message || 'Failed to update profile');
      }
      setIsEditing(false);
      setSavedEmail(email);
      setEmailPassword('');
      if (data.requiresLogin) { router.replace('/admin/login'); return; }
      fireMessage('Profile details saved successfully', 'success');
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return fireMessage('Please complete all password fields', 'error');
    }
    if (newPassword !== confirmPassword) {
      return fireMessage('New password and confirm password do not match', 'error');
    }
    if (newPassword.length < 8) {
      return fireMessage('Password must be at least 8 characters long', 'error');
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch(`/api/admin/profile/change-password`, {
        credentials: 'include',
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        headers: { "Content-type": "application/json" }
      });
      const data = await res.json();
      if (res.status >= 300) {
        throw new Error(data.message || 'Password update failed');
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fireMessage('Password updated. Please sign in again.', 'success');
      router.replace('/admin/login');
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-sm font-sans text-ink-muted">
        <CircleNotch size={24} weight="bold" className="animate-spin text-gold-strong mr-2.5" />
        Loading account details…
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your administrator profile details, avatar photograph, and account authentication credentials."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'My Profile' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Avatar & Summary */}
        <div className="rounded-xl border border-edge-subtle bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-edge-subtle bg-ground shadow-sm">
              {isNewAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newAvatarPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-ink text-3xl font-sans text-gold-strong">
                  {name ? name[0].toUpperCase() : 'A'}
                </div>
              )}
            </div>

            <label
              htmlFor="avatarFile"
              className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow-md transition hover:bg-gold"
              title="Change Profile Photo"
            >
              <Camera size={16} weight="bold" />
              <input
                id="avatarFile"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {isNewAvatar && (
            <div className="mb-4 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelNewAvatar}
                disabled={savingAvatar}
                icon={<X size={14} weight="bold" />}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={handleSaveNewAvatar}
                loading={savingAvatar}
                icon={<FloppyDisk size={14} weight="bold" />}
              >
                Save Photo
              </Button>
            </div>
          )}

          <h2 className="text-lg font-sans font-semibold text-ink">{name || 'Administrator'}</h2>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge variant="gold">SuperAdmin</Badge>
            <Badge variant="success" dot>Active</Badge>
          </div>

          <div className="mt-6 w-full space-y-3 border-t border-edge-subtle pt-5 text-left text-xs font-sans text-ink-muted">
            <div className="flex items-center gap-2.5">
              <EnvelopeSimple size={16} weight="bold" className="text-ink-muted shrink-0" />
              <span className="truncate text-ink">{email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2.5">
                <Phone size={16} weight="bold" className="text-ink-muted shrink-0" />
                <span className="text-ink">{phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} weight="bold" className="text-emerald-600 shrink-0" />
              <span className="text-emerald-700 font-medium">{mfaEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication not enabled'}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Tabs & Details Form */}
        <div className="lg:col-span-2 rounded-xl border border-edge-subtle bg-white shadow-sm overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex border-b border-edge-subtle bg-ground px-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 border-b-2 py-4 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === 'details'
                  ? 'border-gold text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <User size={16} weight={activeTab === 'details' ? 'bold' : 'regular'} />
              Personal Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`ml-6 flex items-center gap-2 border-b-2 py-4 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === 'security'
                  ? 'border-gold text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <LockKey size={16} weight={activeTab === 'security' ? 'bold' : 'regular'} />
              Password &amp; Security
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <form onSubmit={handleSaveDetails} className="space-y-5">
                <div>
                  <label htmlFor="admin-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Full Name
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 px-3.5 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:bg-ground disabled:text-ink-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Email Address
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      disabled={!isEditing}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 px-3.5 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:bg-ground disabled:text-ink-muted"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Phone Number
                    </label>
                    <input
                      id="admin-phone"
                      type="tel"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 px-3.5 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:bg-ground disabled:text-ink-muted"
                    />
                  </div>
                </div>

                {isEditing && email.trim().toLowerCase() !== savedEmail && (
                  <div>
                    <label htmlFor="email-password" className="mb-1.5 block text-sm">Current password to change email</label>
                    <input id="email-password" type="password" autoComplete="current-password" required
                      value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                      className="w-full rounded-xl border border-edge-subtle px-3 py-2 text-sm" />
                    <p className="mt-2 text-xs text-ink-secondary">Changing your email signs out your other sessions.</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-edge-subtle">
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={savingDetails}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="gold"
                        loading={savingDetails}
                        icon={<Check size={16} weight="bold" />}
                      >
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label htmlFor="current-pw" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-pw"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-3.5 pr-10 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
                    >
                      {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-pw" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-pw"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-3.5 pr-10 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
                      >
                        {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-pw" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-pw"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-3.5 pr-10 text-sm font-sans text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
                      >
                        {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-edge-subtle">
                  <Button
                    type="submit"
                    variant="gold"
                    loading={changingPassword}
                    icon={<LockKey size={16} weight="bold" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
