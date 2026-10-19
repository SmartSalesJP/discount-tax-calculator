import { calculate } from './calculator.mjs';
const $ = id => document.getElementById(id);
const format = value => new Intl.NumberFormat('ja-JP').format(value);
const state = { mode: 'discount', basis: 'included', taxRate: 10 };
const controls = { price: $('price'), discount: $('discount'), truncate: $('truncate') };
const output = name => $('result-' + name);
const pressed = (attribute, value) => document.querySelectorAll(`[data-${attribute}]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === String(value))));
function render() {
  const isTax = state.mode === 'tax';
  $('discount-fields').hidden = isTax;
  $('basis-switch').hidden = isTax;
  $('tax-basis-label').hidden = !isTax;
  $('price-label').textContent = isTax ? '税込の金額' : '元の金額';
  output('title').textContent = isTax ? '税込金額と内税の内訳' : '割引後のお支払い';
  output('tax-rate').textContent = state.taxRate + '%';
  pressed('discount', controls.discount.value);
  const result = calculate({ ...state, price: controls.price.value, discount: controls.discount.value, truncate: controls.truncate.checked });
  for (const name of ['price', 'discount']) {
    const message = result.errors?.[name];
    controls[name].setAttribute('aria-invalid', String(Boolean(message)));
    $(name + '-error').hidden = !message;
    $(name + '-error').textContent = message || '';
  }
  for (const name of ['gross', 'net', 'tax', 'savings']) output(name).textContent = result.valid ? format(result[name]) : '—';
  document.querySelector('.total').classList.toggle('long', result.valid && result.gross >= 10000000);
  $('savings-box').hidden = isTax || !result.valid;
  output('invalid').hidden = result.valid;
  output('invalid').textContent = controls.price.value.trim() ? '入力内容を確認してください。' : '金額を入力すると、ここに結果が表示されます。';
  output('context').textContent = result.valid ? (isTax ? `消費税${state.taxRate}%を含む金額` : `${format(result.originalGross)}円から${result.discountBasisPoints / 100}% OFF`) : '入力をお待ちしています';
  $('truncation-note').hidden = !controls.truncate.checked || !result.valid;
  if (result.valid && controls.truncate.checked) $('truncation-note').textContent = `${format(result.grossBeforeTruncation)}円 → ${format(result.gross)}円（${format(result.truncation)}円切り捨て）。この税込額で税の内訳を再計算しています。`;
}
for (const attribute of ['mode', 'basis', 'tax']) {
  document.querySelectorAll(`[data-${attribute}]`).forEach(button => button.addEventListener('click', () => {
    const value = button.dataset[attribute];
    state[attribute === 'tax' ? 'taxRate' : attribute] = attribute === 'tax' ? Number(value) : value;
    pressed(attribute, value);
    render();
  }));
}
document.querySelectorAll('[data-discount]').forEach(button => button.addEventListener('click', () => { controls.discount.value = button.dataset.discount; render(); }));
Object.values(controls).forEach(control => control.addEventListener('input', render));
$('calculator-form').addEventListener('submit', event => { event.preventDefault(); document.activeElement?.blur(); });
$('reset-button').addEventListener('click', () => { controls.price.value = ''; controls.discount.value = '0'; controls.truncate.checked = false; render(); controls.price.focus(); });
let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
$('install-button').addEventListener('click', async () => {
  if (installPrompt) { const prompt = installPrompt; installPrompt = undefined; await prompt.prompt(); }
  else $('install-dialog').showModal();
});
window.addEventListener('appinstalled', () => { installPrompt = undefined; $('install-button').hidden = true; });
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) $('install-button').hidden = true;
let offlineReady = false;
function updateStatus() {
  const status = !navigator.onLine ? (offlineReady ? 'オフラインで利用中' : 'ネットワーク未接続') : offlineReady ? 'オフラインでも使えます' : 'オフライン準備中';
  $('connection-status').lastChild.textContent = status;
}
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(async () => {
    await navigator.serviceWorker.ready;
    offlineReady = true;
    updateStatus();
  }).catch(() => { $('connection-status').lastChild.textContent = 'オンラインで利用できます'; });
} else $('connection-status').lastChild.textContent = 'オンラインで利用できます';
render();
