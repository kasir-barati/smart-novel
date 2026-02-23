import axios from 'axios';

describe('Explain (e2e)', () => {
  it("should explain the word 'scrutinize', in the context of 'The detective scrutinized the crime scene for clues.'", async () => {
    const res = await axios.post(`/graphql`, {
      query: `#graphql
        mutation {
          explain(
            word: "scrutinize",
            context: "The detective scrutinized the crime scene for clues."
          ) {
            meaning
            cacheKey
            antonyms
            synonyms
            simplifiedExplanation
          }
        }
      `,
    });

    expect(res.status).toBe(200);
    expect(res.data.data.explain.meaning).toBeString();
    expect(res.data.data.explain.antonyms).toBeArray();
    expect(res.data.data.explain.synonyms).toBeArray();
    expect(res.data.data.explain.simplifiedExplanation).toBeString();
    expect(res.data.data.explain.cacheKey).toBe(
      'explain:scrutinize:44983f115f931a846573b791066de4184e2f8374876d29c55abdb318512a7ee9',
    );
  }, 20000);
});
