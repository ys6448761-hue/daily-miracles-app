'use strict';

/**
 * mockNicePay.js — Mock NicePay Approval Provider
 *
 * Simulates the PHP-side NicePay payment approval flow for E2E testing.
 * This is NOT a real NicePay integration.
 *
 * Usage:
 *   const nPay = new MockNicePay();
 *   const result = nPay.approve({ moid, amount, goodsName });
 *   const verify = nPay.verify({ tid: result.tid, moid, amount });
 */

const crypto = require('crypto');

class MockNicePay {
  constructor() {
    this._approved = new Map(); // tid -> approvalRecord
  }

  /**
   * Simulate NicePay server-side approval.
   *
   * @param {object} opts
   * @param {string} opts.moid       - Merchant Order ID (= ticket_order_id)
   * @param {number} opts.amount     - Payment amount in KRW
   * @param {string} opts.goodsName  - Product name
   * @param {boolean} [opts.fail]    - Force approval failure
   * @returns {{ success, tid, resultCode, paidAt?, amount?, moid? }}
   */
  approve({ moid, amount, goodsName, fail = false }) {
    if (fail) {
      return { success: false, resultCode: '2001', resultMsg: 'PAYMENT_DECLINED' };
    }
    if (!moid || !amount || amount <= 0) {
      return { success: false, resultCode: '9999', resultMsg: 'INVALID_PARAMS' };
    }
    const tid    = 'TID' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
    const paidAt = new Date().toISOString();
    const record = { tid, moid, amount, goodsName, resultCode: '3001', paidAt };
    this._approved.set(tid, record);
    return { success: true, resultCode: '3001', tid, moid, amount, paidAt };
  }

  /**
   * Simulate NicePay server-side verification (server-to-server).
   * PHP must call this before deciding to call ticket-book.
   *
   * @param {object} opts
   * @param {string} opts.tid     - Transaction ID from approve()
   * @param {string} opts.moid    - Must match the approved moid
   * @param {number} opts.amount  - Must match the approved amount
   * @returns {{ verified: boolean, reason? }}
   */
  verify({ tid, moid, amount }) {
    const record = this._approved.get(tid);
    if (!record)                       return { verified: false, reason: 'TID_NOT_FOUND' };
    if (record.moid   !== moid)        return { verified: false, reason: 'MOID_MISMATCH' };
    if (record.amount !== amount)      return { verified: false, reason: 'AMOUNT_MISMATCH' };
    if (record.resultCode !== '3001')  return { verified: false, reason: 'NOT_APPROVED' };
    return { verified: true, paidAt: record.paidAt };
  }

  /** Reset all state between tests */
  reset() { this._approved.clear(); }
}

module.exports = MockNicePay;
