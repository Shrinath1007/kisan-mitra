// frontend/src/services/__tests__/api.test.js

import { fetchAllVacancies } from '../api';

// Mock the global fetch function
global.fetch = jest.fn();

describe('fetchAllVacancies', () => {
  afterEach(() => {
    fetch.mockClear();
  });

  it('should return an array of vacancies when the response is ok and data is an array', async () => {
    const mockVacancies = [{ id: 1, title: 'Test Vacancy' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVacancies,
    });

    const vacancies = await fetchAllVacancies();
    expect(vacancies).toEqual(mockVacancies);
    expect(fetch).toHaveBeenCalledWith('/api/vacancies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should return vacancies from a nested object', async () => {
    const mockVacancies = [{ id: 1, title: 'Test Vacancy' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ vacancies: mockVacancies }),
    });

    const vacancies = await fetchAllVacancies();
    expect(vacancies).toEqual(mockVacancies);
  });

  it('should return an empty array if the response is not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const vacancies = await fetchAllVacancies();
    expect(vacancies).toEqual([]);
  });

  it('should return an empty array if an error is thrown', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const vacancies = await fetchAllVacancies();
    expect(vacancies).toEqual([]);
  });

  it('should return an empty array if the data is not in the expected format', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ someOtherKey: 'someValue' }),
    });

    const vacancies = await fetchAllVacancies();
    expect(vacancies).toEqual([]);
  });
});
