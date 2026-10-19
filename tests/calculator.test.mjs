import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, parsePrice, parseDiscount } from '../calculator.mjs';
const run = overrides => calculate({ price: '10000', discount: '20', taxRate: 10, basis: 'included', mode: 'discount', truncate: false, ...overrides });
test('initial example: gross 8,000, net 7,273, tax 727, savings 2,000', () => {
  const r = run(); assert.equal(r.gross, 8000); assert.equal(r.net, 7273); assert.equal(r.tax, 727); assert.equal(r.savings, 2000);
});
test('tax-exclusive amount rounds discounted base before tax', () => {
  const r = run({ price: '105', discount: '50', basis: 'excluded' });
  assert.equal(r.net, 53); assert.equal(r.gross, 58); assert.equal(r.tax, 5); assert.equal(r.originalGross, 116);
});
test('tax-exclusive normal example', () => { const r = run({ basis: 'excluded' }); assert.equal(r.gross, 8800); assert.equal(r.net, 8000); assert.equal(r.savings, 2200); });
test('8% included price', () => { const r = run({ price: '10800', taxRate: 8 }); assert.equal(r.gross, 8640); assert.equal(r.net, 8000); assert.equal(r.tax, 640); });
test('8% tax-only ignores discount and exclusive basis', () => { const r = run({ price: '1080', taxRate: 8, mode: 'tax', basis: 'excluded', discount: 'invalid' }); assert.equal(r.net, 1000); assert.equal(r.tax, 80); assert.equal(r.gross, 1080); });
test('10% tax-only rounds net', () => { const r = run({ price: '10000', mode: 'tax' }); assert.equal(r.net, 9091); assert.equal(r.tax, 909); });
test('truncate final gross then recompute net and include extra savings', () => { const r = run({ price: '10800', taxRate: 8, truncate: true }); assert.equal(r.grossBeforeTruncation, 8640); assert.equal(r.gross, 8000); assert.equal(r.net, 7407); assert.equal(r.tax, 593); assert.equal(r.truncation, 640); assert.equal(r.savings, 2800); });
test('exclusive truncation occurs after tax', () => { const r = run({ basis: 'excluded', truncate: true }); assert.equal(r.grossBeforeTruncation, 8800); assert.equal(r.gross, 8000); assert.equal(r.net, 7273); assert.equal(r.tax, 727); });
test('tax-only truncation and sub-1,000 boundary', () => { const r = run({ price: '999', mode: 'tax', truncate: true }); assert.equal(r.gross, 0); assert.equal(r.net, 0); assert.equal(r.tax, 0); assert.equal(r.truncation, 999); });
for (const price of ['0', '1000', '999999999']) test(`valid boundary price ${price}`, () => assert.equal(run({ price }).valid, true));
for (const price of ['', ' ', '-1', '1.5', 'abc', '1e3', '1,000', '1000000000', 'Infinity']) test(`invalid price ${JSON.stringify(price)}`, () => assert.equal(run({ price }).valid, false));
for (const discount of ['', '-1', '101', 'abc', '0.001', '1e1']) test(`invalid discount ${JSON.stringify(discount)}`, () => assert.equal(run({ discount }).valid, false));
test('0% discount preserves price', () => assert.equal(run({ discount: '0' }).gross, 10000));
test('100% discount makes all amounts zero except savings', () => { const r = run({ discount: '100' }); assert.equal(r.gross, 0); assert.equal(r.net, 0); assert.equal(r.tax, 0); assert.equal(r.savings, 10000); });
test('two decimal percentage represented without floating point errors', () => { const r = run({ price: '100000', discount: '12.34' }); assert.equal(r.gross, 87660); assert.equal(r.discountBasisPoints, 1234); });
test('decimal half-yen rounds up exactly', () => assert.equal(run({ price: '100', discount: '99.50' }).gross, 1));
test('full-width digits and decimal are normalized', () => { assert.equal(parsePrice('１０００').value, 1000); assert.equal(parseDiscount('１２．３４').value, 1234); });
test('configuration rejects invalid enum', () => assert.throws(() => run({ taxRate: 5 }), RangeError));
test('invariants over 1,152 combinations', () => {
  for (const price of ['0','1','5','99','100','999','1000','1001','10000','12345','99999999','999999999'])
  for (const discount of ['0','1','12.34','20','50','100']) for (const taxRate of [8,10])
  for (const basis of ['included','excluded']) for (const mode of ['discount','tax']) for (const truncate of [false,true]) {
    const r = run({ price, discount, taxRate, basis, mode, truncate });
    assert.equal(r.valid,true); assert.equal(r.gross,r.net+r.tax); assert.equal(r.originalGross-r.gross,r.savings);
    assert.ok(r.gross>=0 && r.net>=0 && r.tax>=0 && r.savings>=0);
    if (truncate) assert.equal(r.gross % 1000, 0);
  }
});
