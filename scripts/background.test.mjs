import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../background.js', import.meta.url), 'utf8');
function setup(useWorker) {
  const sent = [], timers = [], draws = [];
  let reads = 0, image, workerCode;
  const context2d = { imageSmoothingEnabled: false, clearRect() {}, fillRect() {}, drawImage(...args) { draws.push(args); }, getImageData() { reads++; return { data: new Uint8ClampedArray(65 * 141 * 4) }; } };
  const canvas = { dataset: {}, getContext: () => context2d, transferControlToOffscreen: () => ({}), replaceWith() {}, cloneNode() { return { ...this, dataset: {} }; } };
  const window = { innerWidth: 390, innerHeight: 844, PORTFOLIO: { background: { src: '/mountains.png' } }, matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} };
  const context = vm.createContext({ window, document: { hidden: false, getElementById: () => canvas, createElement: () => ({ getContext: () => context2d }), addEventListener() {} },
    Image: class { constructor() { image = this; } },
    Worker: useWorker ? class { constructor() { this.sent = sent; } postMessage(message) { sent.push(message); } terminate() {} } : undefined,
    OffscreenCanvas: useWorker ? class {} : undefined,
    createImageBitmap: async () => ({ close() {} }),
    Blob: class { constructor(parts) { workerCode = parts.join(''); } },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    performance: { now: () => 0 },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}
  });
  vm.runInContext(source, context);
  return { sent, image, workerCode, reads: () => reads, draws, context2d };
}
test('worker path transfers decoded mountains and performs sampling away from the main thread', async () => {
  const app = setup(true);
  assert.equal(app.reads(), 0);
  await app.image.onload();
  assert.equal(app.reads(), 0);
  const resize = app.sent.find(item => item.type === 'resize');
  assert.equal(resize.width, 390);
  assert.ok(app.sent.some(item => item.type === 'image'));
  let workerReads = 0;
  const worker = vm.createContext({ self: { postMessage() {} }, performance: { now: () => 0 }, setTimeout: () => 1, clearTimeout() {},
    OffscreenCanvas: class { getContext() { return { ...app.context2d, getImageData(_, __, width, height) { workerReads++; return { data: new Uint8ClampedArray(width * height * 4) }; } }; } }
  });
  vm.runInContext(app.workerCode, worker);
  for (const message of app.sent) {
    if (message.type === 'init') message.canvas = { getContext: () => app.context2d };
    worker.self.onmessage({ data: message });
  }
  assert.ok(workerReads >= 1);
  assert.equal(app.draws.at(-1)[2], resize.rows - Math.round(resize.rows * .76));
});
test('browsers without worker support retain the image-sampling fallback', async () => {
  const app = setup(false);
  assert.ok(app.reads() >= 1);
  await app.image.onload();
  assert.ok(app.draws.length >= 1);
});
