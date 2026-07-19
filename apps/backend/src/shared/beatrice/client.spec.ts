import axios from 'axios';

import { runOperation } from './client';

vi.mock('axios');

describe(runOperation.name, () => {
  it('should return the data payload when the request is successful', async () => {
    const mockDocument = {
      toString: () => 'mock query',
    } as any;
    const mockVariables = { foo: 'bar' };
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        data: {
          someField: 'someValue',
        },
      },
    });

    const result = await runOperation(mockDocument, mockVariables, {
      url: 'http://mock-url',
      timeoutMs: 1000,
    });

    expect(result).toEqual({
      someField: 'someValue',
    });
  });

  it('should throw BeatriceRequestError when the request returns errors', async () => {
    const mockDocument = {
      toString: () => 'mock query',
    } as any;
    const mockVariables = { foo: 'bar' };
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        errors: [{ message: 'Error 1' }, { message: 'Error 2' }],
      },
    });

    await expect(
      runOperation(mockDocument, mockVariables, {
        url: 'http://mock-url',
        timeoutMs: 1000,
      }),
    ).rejects.toThrow('Error 1; Error 2');
  });
});
