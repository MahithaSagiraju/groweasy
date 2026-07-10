import { describe, it, expect } from 'vitest';
import { AppError } from '../middleware/errorHandler';

describe('AppError', () => {
  it('should create an error with status code and message', () => {
    const error = new AppError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.name).toBe('AppError');
  });

  it('should include optional details', () => {
    const details = { field: 'email' };
    const error = new AppError(400, 'Validation failed', details);
    expect(error.details).toEqual(details);
  });
});
