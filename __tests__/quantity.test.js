import { formatProductQuantity } from '../src/utils/quantity';

describe('formatProductQuantity Utility', () => {
  it('formats products with package info in name (e.g., Pure Desi Ghee 500ml) into human readable units', () => {
    expect(formatProductQuantity({
      product_name: 'Pure Desi Ghee 500ml',
      quantity: 1,
    })).toBe('1 Unit (500ml)');

    expect(formatProductQuantity({
      product_name: 'Pure Desi Ghee 500ml',
      quantity: '2.00',
    })).toBe('2 Units (500ml)');
  });

  it('formats grams and milliliters correctly', () => {
    expect(formatProductQuantity({
      product_name: 'Amul Butter',
      quantity: 200,
      product_unit: 'gram',
    })).toBe('200 g');

    expect(formatProductQuantity({
      product_name: 'Fresh Cream',
      quantity: 250,
      product_unit: 'ml',
    })).toBe('250 ml');
  });

  it('formats litre milk products cleanly without displaying 1.00 L for ghee', () => {
    expect(formatProductQuantity({
      product_name: 'Cow Milk',
      quantity: '1.00',
      product_unit: 'litre',
    })).toBe('1 L');

    expect(formatProductQuantity({
      product_name: 'Buffalo Milk',
      quantity: 1.5,
      product_unit: 'Litre',
    })).toBe('1.5 L');
  });

  it('formats pieces or packs', () => {
    expect(formatProductQuantity({
      product_name: 'Paneer Pack',
      quantity: 1,
      product_unit: 'piece',
    })).toBe('1 Pack');

    expect(formatProductQuantity({
      product_name: 'Paneer Pack',
      quantity: 3,
      product_unit: 'piece',
    })).toBe('3 Packs');
  });

  it('falls back gracefully to Unit when no unit is specified and name is generic', () => {
    expect(formatProductQuantity({
      product_name: 'Custom Dairy Item',
      quantity: 1,
    })).toBe('1 Unit');
  });
});
