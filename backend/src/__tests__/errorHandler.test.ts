import { describe, it, expect } from 'vitest';
import { HttpError } from '../utils/helpers';

describe('HttpError', () => {
  it('should create an error with status and message', () => {
    const err = new HttpError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('HttpError');
  });

  it('should include optional details', () => {
    const details = { field: 'email' };
    const err = new HttpError(400, 'fail', details);
    expect(err.details).toEqual(details);
  });
});
