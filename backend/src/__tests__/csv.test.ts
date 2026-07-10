import { describe, it, expect } from 'vitest';
import { filterRowByEmailOrMobile } from '../utils/csv';

describe('filterRowByEmailOrMobile', () => {
  it('should detect email in a row', () => {
    const result = filterRowByEmailOrMobile({
      Name: 'John',
      Email: 'john@example.com',
      Phone: '',
    });
    expect(result.hasEmail).toBe(true);
    expect(result.hasMobile).toBe(false);
  });

  it('should detect mobile in a row', () => {
    const result = filterRowByEmailOrMobile({
      Name: 'John',
      Email: '',
      Phone: '+919876543210',
    });
    expect(result.hasEmail).toBe(false);
    expect(result.hasMobile).toBe(true);
  });

  it('should detect both email and mobile', () => {
    const result = filterRowByEmailOrMobile({
      Name: 'John',
      Email: 'john@example.com',
      Phone: '9876543210',
    });
    expect(result.hasEmail).toBe(true);
    expect(result.hasMobile).toBe(true);
  });

  it('should return false for empty row', () => {
    const result = filterRowByEmailOrMobile({
      Name: '',
      Email: '',
      Phone: '',
    });
    expect(result.hasEmail).toBe(false);
    expect(result.hasMobile).toBe(false);
  });

  it('should detect mobile with formatting characters', () => {
    const result = filterRowByEmailOrMobile({
      phone: '+1 (555) 123-4567',
    });
    expect(result.hasMobile).toBe(true);
  });
});
