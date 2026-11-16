// Функція повертає факторіал невід’ємного цілого числа n.
// Для нецілого n кидає TypeError, для від’ємного n кидає RangeError.
function factorial(n) {
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new TypeError('Аргумент n має бути цілим числом');
  }
  if (n < 0) {
    throw new RangeError('Факторіал визначений лише для невід’ємних чисел (n >= 0)');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

console.log(factorial(5));
