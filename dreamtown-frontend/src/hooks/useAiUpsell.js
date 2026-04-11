/**
 * useAiUpsell.js — AI 업셀 상태 관리 훅
 *
 * - /api/dt/ai-unlock/status 폴링
 * - upsell 조건 충족 시 showModal = true
 * - 하루 1회 이상 동일 스테이지 노출 방지 (localStorage 쿨다운)
 */

import { useState, useEffect, useCallback } from 'react';
import { getAiStatus } from '../api/dreamtown.js';

const COOLDOWN_KEY = (userId, stage) => `dt_upsell_shown_${userId}_${stage}`;
const COOLDOWN_MS  = 24 * 60 * 60 * 1000; // 24시간

function isCooldown(userId, stage) {
  try {
    const ts = localStorage.getItem(COOLDOWN_KEY(userId, stage));
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < COOLDOWN_MS;
  } catch { return false; }
}

function setCooldown(userId, stage) {
  try {
    localStorage.setItem(COOLDOWN_KEY(userId, stage), String(Date.now()));
  } catch {}
}

export function useAiUpsell({ userId, daysActive = 0, enabled = true }) {
  const [aiData,    setAiData]    = useState(null);   // /status 응답 전체
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!userId || !enabled) return;
    try {
      const data = await getAiStatus({ userId, daysActive });
      if (!data?.ok) return;
      setAiData(data);

      // 업셀 조건 + 쿨다운 체크
      const stage = data.upsell?.stage;
      if (stage && !dismissed && !isCooldown(userId, stage)) {
        setShowModal(true);
      }
    } catch {}
  }, [userId, daysActive, enabled, dismissed]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClose = useCallback(() => {
    const stage = aiData?.upsell?.stage;
    if (stage) setCooldown(userId, stage);
    setShowModal(false);
    setDismissed(true);
  }, [aiData, userId]);

  const handlePurchase = useCallback(async () => {
    // 구매 완료 후 상태 갱신
    const data = await getAiStatus({ userId, daysActive });
    if (data?.ok) setAiData(data);
    setShowModal(false);
  }, [userId, daysActive]);

  return {
    aiData,
    aiStatus:   aiData?.ai_status ?? null,
    upsell:     aiData?.upsell ?? null,
    experiment: aiData?.experiment ?? null,
    products:   aiData?.products ?? [],
    showModal,
    handleClose,
    handlePurchase,
    refetch: fetchStatus,
  };
}
