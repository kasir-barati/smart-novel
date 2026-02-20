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
  }, 20000);
});
