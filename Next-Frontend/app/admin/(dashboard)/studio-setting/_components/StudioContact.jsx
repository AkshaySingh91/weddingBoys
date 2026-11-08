'use client';

import { useState, useEffect } from 'react';
import {
  PencilSimple,
  FloppyDisk,
  X,
  Camera,
  Envelope,
  Phone,
  MapPin,
  InstagramLogo,
  YoutubeLogo,
  FacebookLogo,
  TwitterLogo,
  Building,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Card, CardContent } from '@/app/admin/components/ui/Card.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function StudioContact() {
  const [studioName, setStudioName] = useState('');
  const [studioLogo, setStudioLogo] = useState('');
  const [studioAddress, setStudioAddress] = useState('');
  const [studioContact, setStudioContact] = useState(['', '']);
  const [studioEmail, setStudioEmail] = useState('');
  const [studioSocials, setStudioSocials] = useState({
    instagram: '',
    youtube: '',
    x: '',
    facebook: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isNewStudioLogo, setIsNewStudioLogo] = useState(false);
  const [studioLogoFile, setStudioLogoFile] = useState(null);
  const [studioLogoMetaData, setStudioLogoMetaData] = useState(null);
  const [newStudioLogoPreview, setNewStudioLogoPreview] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  const getStudioDetails = async () => {
    try {
      const res = await fetch(`${api_url}/api/studio/details`, {
        method: 'GET',
      });
      const data = await res.json();
      if (res.status === 200 && data.studioDetails) {
        const d = data.studioDetails;
        setStudioName(d.name || '');
        setStudioLogo(d.logo || '');
        setStudioAddress(d.address || '');
        setStudioContact(d.contact || ['', '']);
        setStudioEmail(d.email || '');
        setStudioSocials(d.socials || { instagram: '', youtube: '', x: '', facebook: '' });
      } else {
        fireMessage(data.message || 'Failed to fetch studio details', 'error');
      }
    } catch (error) {
      fireMessage(error.message || 'Error loading studio contact', 'error');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getStudioDetails();
  }, []);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setNewStudioLogoPreview(preview);
      setStudioLogoMetaData({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setStudioLogoFile(file);
      setIsNewStudioLogo(true);
    }
  };

  const handleCancelNewLogo = () => {
    setIsNewStudioLogo(false);
    setNewStudioLogoPreview('');
    setStudioLogoFile(null);
    setStudioLogoMetaData(null);
  };

  async function handleSaveNewLogo() {
    setSavingLogo(true);
    try {
      const res = await fetch(`${api_url}/api/admin/studio-setting/contact/get-logo-put-url`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          studioLogoMetaData,
          isLogoUpdated: true,
        }),
      });
      const data = await res.json();
      if (res.status >= 300 || !data.putUrl || !data.key) {
        throw new Error(data.message || 'Failed to get upload signature');
      }

      // Upload file directly to S3 / R2 presigned URL
      const uploadRes = await fetch(data.putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': studioLogoFile.type },
        body: studioLogoFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Direct asset upload to bucket failed');
      }

      // Save key in studio contact doc
      const saveRes = await fetch(`${api_url}/api/admin/studio-setting/contact/save`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          key: data.key,
          isLogoUpdated: true,
        }),
      });
      const saveData = await saveRes.json();
      if (saveRes.status >= 300) {
        throw new Error(saveData.message || 'Failed to commit logo');
      }

      fireMessage('Studio brand mark updated successfully', 'success');
      setIsNewStudioLogo(false);
      getStudioDetails();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleSaveDetails(e) {
    if (e) e.preventDefault();
    setSavingDetails(true);
    try {
      const res = await fetch(`${api_url}/api/admin/studio-setting/contact/save`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          studioDetail: {
            studioName,
            studioContact,
            studioEmail,
            studioAddress,
            studioSocials,
          },
          isLogoUpdated: false,
        }),
      });
      const data = await res.json();
      if (res.status >= 300) throw new Error(data.message || 'Save failed');
      fireMessage('Studio contact details saved successfully', 'success');
      setIsEditing(false);
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <div className="space-y-6 pb-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brand Logo Card */}
        <Card className="border-edge-subtle bg-white shadow-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-ground border border-edge-subtle p-2 flex items-center justify-center shadow-sm">
              {isNewStudioLogo || studioLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={isNewStudioLogo ? newStudioLogoPreview : studioLogo}
                  alt="Studio Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-ink to-ink text-amber-200 flex flex-col items-center justify-center">
                  <span className="font-sans text-2xl font-bold tracking-wider">WB</span>
                  <span className="text-[9px] uppercase tracking-widest text-ink-muted font-sans mt-0.5">Studio</span>
                </div>
              )}
            </div>

            <h3 className="mt-4 text-sm font-bold text-ink">{studioName || 'Studio'}</h3>
            <p className="text-xs text-ink-muted tabular-nums mt-0.5">{studioEmail || 'admin@weddingboys.in'}</p>

            <div className="mt-5 w-full">
              <input
                id="studioLogoFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />

              {!isNewStudioLogo ? (
                <label htmlFor="studioLogoFile" className="block w-full cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Camera}
                    className="w-full pointer-events-none"
                  >
                    Change Brand Logo
                  </Button>
                </label>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button
                    variant="gold"
                    size="sm"
                    loading={savingLogo}
                    onClick={handleSaveNewLogo}
                    className="flex-1"
                  >
                    Save Logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingLogo}
                    onClick={handleCancelNewLogo}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right 2 Columns: Contact & Socials Information Form */}
        <div className="lg:col-span-2">
          <Card className="border-edge-subtle bg-white shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-edge-subtle pb-4">
                <div>
                  <h3 className="text-sm font-bold text-ink">Studio Profile & Inquiries Contact</h3>
                  <p className="text-xs text-ink-muted">
                    Business contact info displayed in marketing footers and confirmation emails.
                  </p>
                </div>

                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={PencilSimple}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Info
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="gold"
                      size="sm"
                      icon={FloppyDisk}
                      loading={savingDetails}
                      onClick={handleSaveDetails}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        getStudioDetails();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Studio Brand Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3.5 py-2 text-xs text-ink outline-none focus:border-amber-700 focus:bg-white transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Public Studio Email
                  </label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={studioEmail}
                    onChange={(e) => setStudioEmail(e.target.value)}
                    className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3.5 py-2 text-xs text-ink outline-none focus:border-amber-700 focus:bg-white transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Primary Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={studioContact[0] || ''}
                    onChange={(e) => setStudioContact([e.target.value, studioContact[1] || ''])}
                    className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3.5 py-2 text-xs text-ink outline-none focus:border-amber-700 focus:bg-white transition-all font-sans tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Secondary Office Phone
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={studioContact[1] || ''}
                    onChange={(e) => setStudioContact([studioContact[0] || '', e.target.value])}
                    className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3.5 py-2 text-xs text-ink outline-none focus:border-amber-700 focus:bg-white transition-all font-sans tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Studio Headquarters Address
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isEditing}
                    value={studioAddress}
                    onChange={(e) => setStudioAddress(e.target.value)}
                    className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3.5 py-2 text-xs text-ink outline-none focus:border-amber-700 focus:bg-white transition-all font-sans resize-none"
                  />
                </div>
              </div>

              {/* Social Channels Sub-section */}
              <div className="border-t border-edge-subtle pt-4">
                <h4 className="text-xs font-bold text-ink mb-3">Social Handles & Channels</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <InstagramLogo size={16} className="text-ink-muted shrink-0" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Instagram URL"
                      value={studioSocials?.instagram || ''}
                      onChange={(e) =>
                        setStudioSocials({ ...studioSocials, instagram: e.target.value })
                      }
                      className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3 py-1.5 text-xs text-ink outline-none focus:border-amber-700 font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <YoutubeLogo size={16} className="text-ink-muted shrink-0" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="YouTube URL"
                      value={studioSocials?.youtube || ''}
                      onChange={(e) =>
                        setStudioSocials({ ...studioSocials, youtube: e.target.value })
                      }
                      className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3 py-1.5 text-xs text-ink outline-none focus:border-amber-700 font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <FacebookLogo size={16} className="text-ink-muted shrink-0" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Facebook URL"
                      value={studioSocials?.facebook || ''}
                      onChange={(e) =>
                        setStudioSocials({ ...studioSocials, facebook: e.target.value })
                      }
                      className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3 py-1.5 text-xs text-ink outline-none focus:border-amber-700 font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <TwitterLogo size={16} className="text-ink-muted shrink-0" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="X (Twitter) URL"
                      value={studioSocials?.x || ''}
                      onChange={(e) => setStudioSocials({ ...studioSocials, x: e.target.value })}
                      className="w-full rounded-xl border border-edge-subtle bg-ground disabled:bg-ground-sunk/60 px-3 py-1.5 text-xs text-ink outline-none focus:border-amber-700 font-sans"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
