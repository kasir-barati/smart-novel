import axios from 'axios';

describe('Novel (e2e)', () => {
  it('should find a novel by ID', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novel(id: "example-novel") {
              id
              name
              description
              state
              author
              category
              chapters
            }
          }
        `,
    });

    expect(res.data.data.novel).toStrictEqual({
      id: 'example-novel',
      name: 'The Journey Begins',
      description:
        'A young hero leaves home to uncover an ancient mystery and shape the fate of the realm.',
      state: 'ONGOING',
      author: 'Jane Doe',
      category: expect.arrayContaining(['fantasy', 'adventure']),
      chapters: expect.arrayContaining([
        'chapter1.md',
        'chapter2.md',
      ]),
    });
  });

  it('should download the cover image', async () => {
    const { data } = await axios.post('/graphql', {
      query: `#graphql
        query {
          novel(id: "example-novel") {
            coverUrl
          }
        }
      `,
    });

    const res = await axios.get(data.data.novel.coverUrl);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });
});
