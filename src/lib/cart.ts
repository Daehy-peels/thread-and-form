export const FREE_SHIPPING_THRESHOLD = 50;
export const FLAT_SHIPPING_RATE = 5;

export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}
