import { getInitials } from './get-initials';

describe('getInitials', () => {
  it.each([
    {
      name: 'John Doe',
      preferredUsername: undefined,
      email: undefined,
      expected: 'JD',
    },
    {
      name: 'Alice Marie Johnson',
      preferredUsername: undefined,
      email: undefined,
      expected: 'AJ',
    },
    {
      name: undefined,
      preferredUsername: 'jane.smith',
      email: undefined,
      expected: 'JA',
    },
    {
      name: undefined,
      preferredUsername: undefined,
      email: 'bob@example.com',
      expected: 'BO',
    },
    {
      name: undefined,
      preferredUsername: undefined,
      email: undefined,
      expected: '?',
    },
    {
      name: '  Ali   Reza  ',
      preferredUsername: undefined,
      email: undefined,
      expected: 'AR',
    },
    {
      name: 'X',
      preferredUsername: undefined,
      email: undefined,
      expected: 'X',
    },
  ])(
    'should return "$expected" when name=$name, preferredUsername=$preferredUsername, email=$email',
    ({ name, preferredUsername, email, expected }) => {
      const result = getInitials(name, preferredUsername, email);

      expect(result).toBe(expected);
    },
  );
});
