/**
 * 测试环境的公共配置
 * 目的：让测试脚本在 Windows 本机、macOS、GitHub Actions（Linux）上都能跑，
 * 不把浏览器路径写死成某台机器的绝对路径。
 */

import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(HERE, '..');
export const CACHE = path.join(HERE, '.cache');
export const BASE = process.env.BASE_URL || 'http://localhost:8899';

mkdirSync(CACHE, { recursive: true });

const CANDIDATES = [
  process.env.CHROME_PATH,
  // Windows
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Linux / CI
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

export const CHROME = CANDIDATES.find(p => p && existsSync(p));

if (!CHROME) {
  console.error('找不到 Chrome。请通过环境变量 CHROME_PATH 指定浏览器可执行文件路径。');
  process.exit(1);
}

export const LAUNCH = {
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars', '--no-sandbox', '--disable-dev-shm-usage'],
};

export const log = (...a) => console.log(...a);
export const ok = (cond, msg) => log(`  ${cond ? '✓' : '✗'} ${msg}`);
