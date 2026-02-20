import axios from 'axios';

describe('Novels (e2e)', () => {
  it('should return a list of novels', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novels {
              edges {
                cursor
                node {
                  id
                  name
                  state
                  author
                  category
                }
              }
              pageInfo {
                endCursor
                startCursor
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `,
    });

    expect(res.status).toBe(200);
    expect(res.data.data.novels.edges.length).toBeGreaterThan(0);
    expect(res.data.data.novels.pageInfo.endCursor).toBeString();
    expect(res.data.data.novels.pageInfo.startCursor).toBeString();
    expect(res.data.data.novels.pageInfo.hasNextPage).toBeBoolean();
    expect(
      res.data.data.novels.pageInfo.hasPreviousPage,
    ).toBeBoolean();
    expect(res.data.data.novels.edges[0].cursor).toBeString();
    expect(res.data.data.novels.edges[0].node).toHaveProperty('id');
    expect(res.data.data.novels.edges[0].node).toHaveProperty('name');
    expect(res.data.data.novels.edges[0].node).toHaveProperty(
      'state',
    );
    expect(res.data.data.novels.edges[0].node).toHaveProperty(
      'author',
    );
    expect(res.data.data.novels.edges[0].node).toHaveProperty(
      'category',
    );
  });

  it('should return first two novels', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novels(first: 2) {
              edges {
                cursor
              }
              pageInfo {
                endCursor
                startCursor
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `,
    });

    expect(res.status).toBe(200);
  });

  it('should return novels after a cursor', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novels(first: 1, after: "ZXhhbXBsZS1ub3ZlbA==") {
              edges {
                cursor
              }
              pageInfo {
                endCursor
              }
            }
          }
        `,
    });

    expect(res.status).toBe(200);
  });

  it('should filter novels by category', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novels(filters: { category: { in: ["fantasy"], nin: ["adventure"] } }) {
              edges {
                node {
                  category
                }
              }
            }
          }
        `,
    });

    expect(res.status).toBe(200);
  });
});
