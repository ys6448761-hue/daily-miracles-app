/**
 * dreamtownFlow.js — DreamTown 전체 흐름 SSOT
 *
 * 규칙:
 * - 이 파일이 단일 진실 공급원 (Single Source of Truth)
 * - 방향 키(north/east/west/south)가 모든 시스템의 공통 키
 * - 이 파일을 수정하면 모든 화면에 자동 반영됨
 */

// Intro 이미지 순서 (5단계)
export const INTRO_IMAGES = [
  'intro-01-look.jpg',
  'intro-02-write.jpg',
  'intro-03-transform.jpg',
  'intro-04-choice.jpg',
  'intro-05-result.jpg',
];

// Galaxy 선택지 — direction 키 = 전체 시스템의 공통 키
export const GALAXY_OPTIONS = [
  { key: 'north', label: '나아가기',  semantic: 'courage'  },
  { key: 'east',  label: '정리하기',  semantic: 'clarity'  },
  { key: 'west',  label: '가라앉기',  semantic: 'calm'     },
  { key: 'south', label: '놓아보기',  semantic: 'release'  },
];

// Day 감정 선택지 — direction별 options는 galaxyLogCopy.js 참조
// 아래는 방향 무관 공통 fallback (direction null 시 사용)
export const DAY_FEELINGS = [
  { key: 'relief',  label: '좀 편해졌어요' },
  { key: 'rest',    label: '조금 쉬고 싶어졌어요' },
  { key: 'quiet',   label: '마음이 잔잔해졌어요' },
];

export const DAY_CHANGES = [
  { key: 'lighter',  label: '조금 가벼워졌어요' },
  { key: 'let_go',   label: '조금 놓아줄 수 있었어요' },
  { key: 'settled',  label: '마음이 조금 잔잔해졌어요' },
];

// Postcard fallback 메시지 (direction null 시)
export const POSTCARD_FALLBACK_MESSAGE = '오늘은 천천히 빛나도 괜찮습니다';
