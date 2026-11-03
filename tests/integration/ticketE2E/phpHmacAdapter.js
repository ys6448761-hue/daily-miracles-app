'use strict';

/**
 * phpHmacAdapter.js — PHP 서버 HMAC 서명 시뮬레이터
 *
 * PHP ticket.6117.co.kr이 구현해야 할 HMAC 서명 로직을 JavaScript로 재현.
 * PHP 담당자에게 전달할 참조 구현이자 cross-language HMAC 검증 도구.
 *
 * E2E 테스트에서 이 adapter가 생성한 서명이 Node ticketAuthService에서
 * 검증에 성공하면 "PHP ↔ Node HMAC 계약 일치"로 판정.
 *
 * PHP 대응 코드 참조: docs/knowledge/COMMERCE-TICKET-005-PHP-SPEC-V0_1.md §2
 */

const crypto = require('crypto');

class PhpHmacAdapter {
  /**
   * @param {string} secret - FLOW_TICKET_SECRET (테스트 전용)
   */
  constructor(secret) {
    if (!secret || secret.length < 16) {
      throw new Error('PhpHmacAdapter: secret must be at least 16 chars');
    }
    this._secret = secret;
  }

  /**
   * PHP 쪽에서 생성할 Canonical String.
   * ticketAuthService.js buildCanonical()과 완전히 동일해야 한다.
   *
   * @param {string} timestamp   - Unix epoch ms (string)
   * @param {string} nonce
   * @param {string} method      - HTTP method (uppercase)
   * @param {string} path        - /ticket-hold or /ticket-book
   * @param {object} body        - JSON body fields
   */
  buildCanonical(timestamp, nonce, method, path, body) {
    const sorted = Object.keys(body || {})
      .sort()
      .map(k => `${k}=${body[k]}`)
      .join('&');
    return [timestamp, nonce, method.toUpperCase(), path, sorted].join('\n');
  }

  /**
   * Sign a request (PHP sends this signature in X-Ticket-Signature).
   *
   * @returns {{ timestamp, nonce, signature }}
   */
  sign(method, path, body) {
    const timestamp = String(Date.now());
    const nonce     = crypto.randomBytes(16).toString('hex');
    const canonical = this.buildCanonical(timestamp, nonce, method, path, body);
    const signature = crypto.createHmac('sha256', this._secret)
      .update(canonical)
      .digest('hex');
    return { timestamp, nonce, signature };
  }

  /**
   * Build HTTP headers for a signed request.
   *
   * @returns {object} headers ready to pass to supertest/axios
   */
  buildHeaders(method, path, body) {
    const { timestamp, nonce, signature } = this.sign(method, path, body);
    return {
      'Content-Type':       'application/json',
      'X-Ticket-Timestamp': timestamp,
      'X-Ticket-Nonce':     nonce,
      'X-Ticket-Signature': signature,
    };
  }

  /**
   * Verify that a known (timestamp, nonce, body) produces the expected signature.
   * Used for test vector validation.
   */
  verifyVector({ timestamp, nonce, method, path, body, expectedSignature }) {
    const canonical = this.buildCanonical(timestamp, nonce, method, path, body);
    const actual    = crypto.createHmac('sha256', this._secret)
      .update(canonical)
      .digest('hex');
    return {
      match:    actual === expectedSignature,
      actual,
      expected: expectedSignature,
      canonical,
    };
  }
}

module.exports = PhpHmacAdapter;
