import axios from 'axios';

import { AuthorizationFixture } from '../../support';

const NOVEL_QUERY = `#graphql
  query GetNovel($id: ID!) {
    novel(id: $id) {
      id
      allowedActions
    }
  }
`;

describe('Novel allowedActions (e2e)', () => {
  const NOVEL_ID = 'c1d31ec2-f478-4648-b90b-d1e53de2a829';

  it('should return MANAGE_TTS for the novel owner (writer)', async () => {
    const authorization =
      await AuthorizationFixture.getWriterAuthorizationHeader();

    const { data } = await axios.post(
      '/graphql',
      {
        query: NOVEL_QUERY,
        variables: { id: NOVEL_ID },
      },
      { headers: { Authorization: authorization } },
    );

    expect(data.data.novel.allowedActions).toEqual(['MANAGE_TTS']);
  });

  it('should return MANAGE_TTS for an admin', async () => {
    const authorization =
      await AuthorizationFixture.getAdminAuthorizationHeader();

    const { data } = await axios.post(
      '/graphql',
      {
        query: NOVEL_QUERY,
        variables: { id: NOVEL_ID },
      },
      { headers: { Authorization: authorization } },
    );

    expect(data.data.novel.allowedActions).toEqual(['MANAGE_TTS']);
  });

  it('should return an empty array for a regular user', async () => {
    const authorization =
      await AuthorizationFixture.getUserAuthorizationHeader();

    const { data } = await axios.post(
      '/graphql',
      {
        query: NOVEL_QUERY,
        variables: { id: NOVEL_ID },
      },
      { headers: { Authorization: authorization } },
    );

    expect(data.data.novel.allowedActions).toEqual([]);
  });

  it('should return an empty array for an unauthenticated request', async () => {
    const { data } = await axios.post('/graphql', {
      query: NOVEL_QUERY,
      variables: { id: NOVEL_ID },
    });

    expect(data.data.novel.allowedActions).toEqual([]);
  });
});
