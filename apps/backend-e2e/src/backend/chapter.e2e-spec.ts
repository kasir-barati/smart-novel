import axios from 'axios';

describe('Chapter (e2e)', () => {
  it('should return the selected chapter', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novel(id: "example-novel") {
              chapter(id: "chapter1.md") {
                id
                title
                content
                createdAt
                updatedAt
              }
            }
          }
        `,
    });

    expect(res.data.data.novel.chapter).toStrictEqual(
      expect.objectContaining({
        id: 'chapter1.md',
        title: 'The Beginning',
        content:
          "\n# Chapter 1: The Beginning\n\nIn a small village nestled between rolling hills and ancient forests, a young adventurer named Elena discovered an old map hidden in her grandmother's attic. The map was yellowed with age, its edges frayed, but the intricate markings and mysterious symbols captured her imagination immediately.\n\nShe scrutinized the men's faces carefully, trying to work out who was lying about the treasure's location. The village elders had always spoken of a legendary artifact, but none had dared to seek it.\n\nAs dawn broke over the horizon, Elena made her decision. She would embark on this journey, following the map's cryptic directions into the unknown. Little did she know that this choice would change her life forever.\n\nThe path ahead was uncertain, filled with both danger and wonder. But Elena was ready. Her adventure was just beginning.\n",
      }),
    );
    expect(res.data.data.novel.chapter.createdAt).toBeDateString();
    expect(res.data.data.novel.chapter.updatedAt).toBeDateString();
  });

  it('should return next chapter', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novel(id: "example-novel") {
              chapter(id: "chapter1.md") {
                next {
                  id
                }
              }
            }
          }
        `,
    });

    expect(res.data.data.novel.chapter.next.id).toBe('chapter2.md');
  });

  it('should return previous chapter', async () => {
    const res = await axios.post('/graphql', {
      query: `#graphql
          query {
            novel(id: "example-novel") {
              chapter(id: "chapter2.md") {
                previous {
                  id
                }
              }
            }
          }
        `,
    });

    expect(res.data.data.novel.chapter.previous.id).toBe(
      'chapter1.md',
    );
  });
});
