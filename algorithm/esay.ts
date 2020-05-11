// boss 直聘看到的
// 给一个数字n 写一个方法计算该数字计算为1需要几步 数字为偶数时直接n/2 为奇数时 n * 3 / 2

function odd(num: number): boolean {
  return num % 2 === 0;
}

function to1Step(n: number, step = 0): number {
  if (n === 1) return step;
  return to1Step((odd(n) ? n : 3 * n + 1) / 2, step + 1);
}
