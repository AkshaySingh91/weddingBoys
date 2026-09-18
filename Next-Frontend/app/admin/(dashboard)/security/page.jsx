'use client';

/* eslint-disable @next/next/no-img-element -- the QR is a runtime-generated
   base64 data: URI from the API; next/image cannot optimize a data URL. */

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldWarning,
  CircleNotch,
  WarningCircle,
  Copy,
  Check,
  DeviceMobile,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import { useAuth } from '@/Context/AdminAuthContext';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/admin/components/ui/Card.jsx';
import RecoveryCodesModal from './_components/RecoveryCodesModal.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

export default function SecurityPage() {
  const { user, loading } = useAuth() || {};

  // null = not started, otherwise { qrCode, secret, otpauthUrl }
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenPassword, setRegenPassword] = useState('');

  // Local mirror so the UI updates without a full context refetch.
  const [mfaEnabled, setMfaEnabled] = useState(null);
  const enabled = mfaEnabled ?? user?.mfaEnabled ?? false;

  // Plaintext backup codes — held only long enough to show them once.
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [codesWereRegenerated, setCodesWereRegenerated] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const codesLeft = remaining ?? user?.recoveryCodesRemaining ?? null;

  const startSetup = async () => {
    setError('');
    setBusy(true);
    try {
      const data = await apiJson('/api/admin/auth/mfa/setup', { method: 'POST' });
      setSetupData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your app');

    setBusy(true);
    try {
      const data = await apiJson('/api/admin/auth/mfa/verify-setup', {
        method: 'POST',
        body: { token: code },
      });
      setMfaEnabled(true);
      setRecoveryCodes(data.recoveryCodes);
      setRemaining(data.recoveryCodes?.length ?? 10);
      setSetupData(null);
      setCode('');
      fireMessage('Two-factor authentication enabled', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelSetup = () => {
    setSetupData(null);
    setCode('');
    setError('');
  };

  const disableMfa = async (e) => {
    e.preventDefault();
    setError('');
    if (!disablePassword) return setError('Password is required');

    setBusy(true);
    try {
      await apiJson('/api/admin/auth/mfa/disable', {
        method: 'POST',
        body: { password: disablePassword },
      });
      setMfaEnabled(false);
      setDisabling(false);
      setDisablePassword('');
      setRecoveryCodes(null);
      setRemaining(0);
      fireMessage('Two-factor authentication disabled', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const regenerateCodes = async (e) => {
    e.preventDefault();
    setError('');
    if (!regenPassword) return setError('Password is required to regenerate backup codes');

    setBusy(true);
    try {
      const data = await apiJson('/api/admin/auth/mfa/recovery-codes', {
        method: 'POST',
        body: { password: regenPassword },
      });
      setRecoveryCodes(data.recoveryCodes);
      setCodesWereRegenerated(true);
      setRemaining(data.recoveryCodes?.length ?? 10);
      setRegenerating(false);
      setRegenPassword('');
      fireMessage('New backup codes generated', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-stone-500 font-sans gap-2">
        <CircleNotch size={20} className="animate-spin text-stone-600" />
        <span className="text-xs">Loading account security…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans max-w-3xl">
      <PageHeader
        title="Account Security & 2FA"
        subtitle="Protect your studio administration workspace with two-factor authentication (TOTP) and offline recovery codes."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Security & 2FA' },
        ]}
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
        >
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2FA Primary Card */}
      <Card className="border-[#E5DCD3] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  enabled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {enabled ? <ShieldCheck size={22} weight="bold" /> : <ShieldWarning size={22} />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1C1917]">Two-Factor Authentication (TOTP)</h2>
                <p className="mt-0.5 text-xs text-stone-500 max-w-md">
                  Verify logins using an authenticator app such as Google Authenticator, 1Password, or Authy.
                </p>
                <div className="mt-2.5">
                  <Badge
                    variant={enabled ? 'success' : 'neutral'}
                    size="sm"
                    dot
                    dotColor={enabled ? 'bg-emerald-600' : 'bg-stone-400'}
                  >
                    {enabled ? '2FA Enabled & Active' : '2FA Not Enabled'}
                  </Badge>
                </div>
              </div>
            </div>

            {!enabled && !setupData && (
              <Button
                variant="gold"
                size="sm"
                loading={busy}
                onClick={startSetup}
                className="shrink-0"
              >
                Enable 2FA
              </Button>
            )}

            {enabled && !disabling && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisabling(true);
                  setError('');
                }}
                className="shrink-0 text-stone-700"
              >
                Disable 2FA
              </Button>
            )}
          </div>

          {/* Enrollment Setup */}
          {setupData && (
            <div className="mt-6 border-t border-stone-100 pt-6">
              <ol className="space-y-6">
                <li>
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-stone-800">
                    <DeviceMobile size={16} /> 1. Scan this QR code with your authenticator app
                  </p>
                  <div className="inline-block rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                    <img
                      src={setupData.qrCode}
                      alt="Two-factor authentication QR code"
                      width={192}
                      height={192}
                      className="h-48 w-48"
                    />
                  </div>
                </li>

                <li>
                  <p className="mb-2 text-xs font-medium text-stone-700">
                    Can&apos;t scan? Enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
                    <code className="flex-1 break-all font-mono text-xs text-stone-800">
                      {setupData.secret}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copySecret}
                      className="h-7 px-2.5 text-xs"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </li>

                <li>
                  <p className="mb-2 text-xs font-medium text-stone-700">
                    2. Enter the 6-digit code shown in your authenticator app:
                  </p>
                  <form onSubmit={confirmSetup} className="flex max-w-xs flex-col gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest text-[#1C1917] outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="gold"
                        size="sm"
                        loading={busy}
                        disabled={code.length !== 6 || busy}
                        className="flex-1"
                      >
                        Verify & Activate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelSetup}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </li>
              </ol>
            </div>
          )}

          {/* Disable Form */}
          {disabling && (
            <form onSubmit={disableMfa} className="mt-6 border-t border-stone-100 pt-6">
              <h3 className="mb-1 text-xs font-bold text-stone-900">
                Confirm your password to disable 2FA
              </h3>
              <p className="mb-4 text-xs text-stone-500">
                Disabling 2FA reduces the security of your account.
              </p>
              <div className="flex max-w-sm flex-col gap-3">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Current account password"
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/30"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="dangerSolid"
                    size="sm"
                    loading={busy}
                    disabled={!disablePassword || busy}
                  >
                    Confirm Disable
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDisabling(false);
                      setDisablePassword('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Backup Recovery Codes Card */}
      {enabled && (
        <Card className="border-[#E5DCD3] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-[#1C1917]">Backup Recovery Codes</h3>
                <p className="mt-0.5 text-xs text-stone-500 max-w-md">
                  Use single-use recovery codes to sign in if you ever lose access to your authenticator device.
                </p>
                {typeof codesLeft === 'number' && (
                  <p className="mt-2 text-xs font-medium text-stone-700 tabular-nums">
                    {codesLeft} of 10 backup codes remaining.
                  </p>
                )}
              </div>

              {!regenerating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegenerating(true);
                    setError('');
                  }}
                  icon={ArrowClockwise}
                  className="shrink-0 text-stone-700"
                >
                  Regenerate Codes
                </Button>
              )}
            </div>

            {regenerating && (
              <form onSubmit={regenerateCodes} className="mt-5 border-t border-stone-100 pt-5">
                <h4 className="mb-1 text-xs font-semibold text-stone-800">
                  Enter password to generate new codes
                </h4>
                <p className="mb-3 text-xs text-stone-500">
                  Existing backup codes will be permanently invalidated.
                </p>
                <div className="flex max-w-sm flex-col gap-3">
                  <input
                    type="password"
                    value={regenPassword}
                    onChange={(e) => setRegenPassword(e.target.value)}
                    placeholder="Current password"
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] outline-none focus:border-amber-700"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={busy}
                      disabled={!regenPassword || busy}
                    >
                      Generate New Codes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRegenerating(false);
                        setRegenPassword('');
                        setError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recovery Codes Modal */}
      {recoveryCodes && (
        <RecoveryCodesModal
          codes={recoveryCodes}
          onClose={() => setRecoveryCodes(null)}
          isRegenerated={codesWereRegenerated}
        />
      )}
    </div>
  );
}
