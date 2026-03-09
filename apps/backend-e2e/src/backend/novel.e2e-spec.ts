import axios from 'axios';
import { isString } from 'class-validator';

describe('Novel (e2e)', () => {
  const NOVEL_ID = 'c1d31ec2-f478-4648-b90b-d1e53de2a829'; // example-novel from seed data

  it('should find a novel by ID', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
        query GetNovel($id: ID!) {
          novel(id: $id) {
            id
            name
            description
            state
            author
            category
            chapters
            lastChapterPublishedAt
            lastPublishedChapter {
              id
            }
            firstChapter {
              id
            }
          }
        }
      `,
      variables: {
        id: NOVEL_ID,
      },
    });

    expect(res.data.data.novel).toStrictEqual(
      expect.objectContaining({
        id: 'c1d31ec2-f478-4648-b90b-d1e53de2a829',
        name: 'The Journey Begins',
        description:
          'A young hero leaves home to uncover an ancient mystery and shape the fate of the realm.',
        state: 'ONGOING',
        author: 'Jane Doe',
        category: expect.arrayContaining(['fantasy', 'adventure']),
        chapters: expect.arrayContaining([
          '4dd92f16-4743-47b9-960c-6529678e9bc5',
          '4769a024-6267-4abc-a412-5ab0241a8d0e',
          'a3987a2f-eaa5-4a05-8714-34a110511cba',
        ]),
        lastPublishedChapter: {
          id: 'a3987a2f-eaa5-4a05-8714-34a110511cba',
        },
        firstChapter: { id: '4dd92f16-4743-47b9-960c-6529678e9bc5' },
      }),
    );
    expect(
      res.data.data.novel.lastChapterPublishedAt,
    ).toBeDateString();
  });

  it('should download the cover image', async () => {
    const { data } = await axios.post('/graphql', {
      query: `#graphql
        query GetNovel($id: ID!) {
          novel(id: $id) {
            coverUrl
          }
        }
      `,
      variables: {
        id: NOVEL_ID,
      },
    });

    const res = await axios.get(data.data.novel.coverUrl);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('should return all categories', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
        query {
          categories
        }
      `,
    });

    expect(res.data.data.categories).toBeArray();
    expect(res.data.data.categories).toSatisfyAll(isString);
  });
});
