import axios from 'axios';

describe('Health check (e2e)', () => {
  it("should return 'OK'", async () => {
    const res = await axios.post(`http://localhost:3000/graphql`, {
      query: `#graphql
        query {
          health
        }
      `,
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ data: { health: 'OK' } });
  });
});
