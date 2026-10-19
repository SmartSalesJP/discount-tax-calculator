/** All monetary arithmetic is non-negative integer yen, rounded half up. */
export const MAX_PRICE = 999999999;
const normalized = value => String(value ?? '').normalize('NFKC').trim();
export function parsePrice(value) {
  const text = normalized(value);
  if (!text) return { error: '金額を入力してください。' };
  if (!/^\d+$/.test(text)) return { error: '金額は0以上の整数で入力してください。' };
  const amount = Number(text);
  if (amount > MAX_PRICE) return { error: '金額は999,999,999円以下で入力してください。' };
  return { value: amount };
}
export function parseDiscount(value) {
  const text = normalized(value);
  if (!text) return { error: '割引率を入力してください。' };
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return { error: '割引率は小数点以下2桁までの数値で入力してください。' };
  const [whole, decimal = ''] = text.split('.');
  const points = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (points > 10000) return { error: '割引率は0〜100%で入力してください。' };
  return { value: points };
}
const roundRatio = (numerator, denominator) => (numerator * 2n + denominator) / (denominator * 2n);
export function calculate({ price, discount = '0', taxRate = 10, basis = 'included', mode = 'discount', truncate = false }) {
  if (![8, 10].includes(taxRate) || !['included', 'excluded'].includes(basis) || !['discount', 'tax'].includes(mode)) throw new RangeError('Invalid calculation configuration');
  const parsedPrice = parsePrice(price);
  const parsedDiscount = mode === 'tax' ? { value: 0 } : parseDiscount(discount);
  const errors = { price: parsedPrice.error, discount: parsedDiscount.error };
  if (errors.price || errors.discount) return { valid: false, errors };
  const amount = BigInt(parsedPrice.value);
  const taxFactor = BigInt(100 + taxRate);
  const included = mode === 'tax' || basis === 'included';
  const originalGross = included ? amount : roundRatio(amount * taxFactor, 100n);
  const discounted = roundRatio(amount * BigInt(10000 - parsedDiscount.value), 10000n);
  const grossBeforeTruncation = included ? discounted : roundRatio(discounted * taxFactor, 100n);
  const gross = truncate ? grossBeforeTruncation / 1000n * 1000n : grossBeforeTruncation;
  const net = included || truncate ? roundRatio(gross * 100n, taxFactor) : discounted;
  return {
    valid: true,
    originalGross: Number(originalGross),
    grossBeforeTruncation: Number(grossBeforeTruncation),
    gross: Number(gross), net: Number(net), tax: Number(gross - net),
    savings: Number(originalGross - gross), truncation: Number(grossBeforeTruncation - gross),
    discountBasisPoints: parsedDiscount.value,
  };
}
