'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeSlash,
  ArrowClockwise,
  Key,
  Copy,
  Check,
  Question,
  CaretDown,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Card, CardContent } from '@/app/admin/components/ui/Card.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function AdminInviteCode() {
  const [inviteCode, setInviteCode] = useState(null);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  async function fetchInviteCode() {
    try {
      const res = await fetch(`${api_url}/api/admin/studio-setting/invite-code`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status >= 300 || !data.inviteCode) {
        return fireMessage(data.message || 'Failed to fetch invite code', 'error');
      }
      setInviteCode(data.inviteCode);
    } catch (error) {
      fireMessage(error.message || 'Network error fetching invite code', 'error');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInviteCode();
  }, []);

  const regenerateCode = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`${api_url}/api/admin/studio-setting/invite-code/regenerate`, {
        credentials: 'include',
        method: 'GET',
      });
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message || 'Failed to regenerate invite code', 'error');
      }
      fireMessage('New admin invite code generated', 'success');
      await fetchInviteCode();
    } catch (error) {
      fireMessage(error.message || 'Error regenerating code', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const copyCode = async () => {
    if (!inviteCode?.code) return;
    try {
      await navigator.clipboard.writeText(inviteCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      fireMessage('Invite code copied to clipboard', 'success');
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="font-sans max-w-xl">
      <Card className="border-edge-subtle bg-white shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-edge-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ground-sunk border border-edge-subtle flex items-center justify-center text-ink-secondary">
                <Key size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink">Team Admin Invite Code</h3>
                <p className="text-[11px] text-ink-muted">
                  Required when new studio administrators register on the system.
                </p>
              </div>
            </div>

            <Badge
              variant={inviteCode?.isValid ? 'success' : 'danger'}
              size="sm"
              dot
              dotColor={inviteCode?.isValid ? 'bg-emerald-600' : 'bg-rose-600'}
            >
              {inviteCode?.isValid ? 'Code Active' : 'Invalid / Expired'}
            </Badge>
          </div>

          {/* Code display box */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-ground border border-edge-subtle">
            <div className="font-mono text-sm tracking-wider font-semibold text-ink tabular-nums">
              {isCodeVisible ? inviteCode?.code || '—' : '••••••••••••'}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsCodeVisible((prev) => !prev)}
                title={isCodeVisible ? 'Hide code' : 'Reveal code'}
              >
                {isCodeVisible ? <EyeSlash size={15} /> : <Eye size={15} />}
              </Button>

              <Button
                variant="ghost"
                size="iconSm"
                onClick={copyCode}
                title="Copy code"
                disabled={!inviteCode?.code}
              >
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </Button>
            </div>
          </div>

          {/* Details metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-ink-muted font-medium text-[11px]">Expires At</span>
              <p className="font-semibold text-ink tabular-nums mt-0.5">
                {inviteCode?.date || 'Never / Standard'}
              </p>
            </div>
            <div>
              <span className="text-ink-muted font-medium text-[11px]">Issued By</span>
              <p className="font-semibold text-ink truncate mt-0.5">
                {inviteCode?.createdBy || 'System Administrator'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ArrowClockwise}
              loading={regenerating}
              onClick={regenerateCode}
            >
              Regenerate Code
            </Button>
          </div>

          {/* Explanatory FAQ accordian */}
          <div className="border-t border-edge-subtle pt-3">
            <button
              onClick={() => setFaqOpen((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Question size={14} className="text-ink-muted" />
                How do Admin Invite Codes work?
              </span>
              <CaretDown
                size={14}
                className={`text-ink-muted transition-transform duration-150 ${
                  faqOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {faqOpen && (
              <p className="mt-2 text-xs text-ink-muted leading-relaxed bg-ground p-3 rounded-xl border border-edge-subtle">
                This single-purpose invite code grants trusted crew members permission to register an admin account for The Wedding Vachan. Regenerating invalidates previous codes immediately.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
