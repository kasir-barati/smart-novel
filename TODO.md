# TODOs

- Cleanup memory in ReactJS when we jump from chapter to chapter (except for the words we have explained).
- Add soft delete support!
- Add Piper TTS: https://hub.docker.com/repository/docker/9109679196/piper-tts-rest-api/general
  - Auto gen the TTS each time we change the content of a chapter.
    - Can we do something about prolonged interjections like "ahhh~" (used in manga and novels), or its other form "ahhh...", or "ahhhhhhhh"? I think right now the auto generated voice would be like "ahhh tilde".
  - Store the mp3 file in Minio.
  - Add a play button in the UI.
- Write unit test for the frontend: https://github.com/kasir-barati/rmc/tree/main/projects/rmc-frontend/src/pages/reduction-measures

## Marking Novel as Finished

Run LLM on the entire novel and check if:

- There is inconsistency in naming characters (e.g. changing Alice to Elice), cities.
- Typos.
- Spells.
- Check for missing punctuations, and white spaces (e.g. instead of "she said" it is written "shesaid").
- Interjection are spelled correctly.

## Create Chapter

You are a senior software engineer, implement a new mutation API to create a new chapter.

- Auto gen the TTS.
- Ask LLM to check for typos, grammar issues, and things like missing white space between two words.
  - Use LLM on the fly before they hit the save button to check these.
- Ask LLM to check for consistency issues:
  - It happens a lot that when translating chinese/japanese novels to English they use wrong pronouns in the same chapter or across chapters.
  - Or they change the names of the characters, e.g. from Alice to Elice which is dumb and we should stick to whatever we started with.
  - Or they change the translation of a word, e.g. in the previous chapters they were using the term "house of azures" and now they switch to "house of blue".
    - I would prefer to stick to the same thing or enable user to update the previous chapters.
- Sanitize interjections to a form that Piper TTS works best with, IDK maybe:
  - Instead of all capitalized letter we should convert them to all lower case.
  - Or convert ~ to the repetition of the last letter of the word (in most cases it is an interjection).
