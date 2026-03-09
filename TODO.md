e2e tests in prepush should be executed in sequence (NOT parallel)

Auto gen a simple API client for the backend and use it in the frontend app (so I don't have to create and maintain some dumb interfaces which are essentially the same object type, and input types I have in the backend).

Move the dummy data to `prisma/seed` dir or somewhere next it.

Upgrade nx deps

Add a new field to the new `generateChapterAudio` mutation to force our way (just in case we fixed a bug in how we convert markdown to text for better TTS results, or when we change the voice of TTS).

I now have a new service which takes an string as input and converts it to mp3 (`POST /speak` with `{ "text": "..." }` as request body and it returns a stream). Add a new mutation called `generateChapterAudio` accept the ID of a chapter and then stream back the generated audio file back to the client. We have to do two things simultaneously:

1. Stream back the stream we get from TTS service to the client.
   - If client cancels the request we should still keep consuming the stream we get back from the TTS service, this is because we do not want to go over the already processed part of a chapter again later. This means that we will be storing the result in Minio (S3) regardless of client consuming the stream.
2. Forward the stream we get from the TTS service to the Minio (S3).
   - Update the chapter with a direct link to that file so UI can play it directly later.

Notes:

- We need a new optional field in chapters table (`narrationUrl`). It should be similar to `coverUrl` of novels.
- Create a new directory in smart-novel bucket, named `narrations`. This is where the narration should be uploaded to.
  - Make this directory also publicly accessible, similar to what we are doing for covers dir.
- Before sending a request to TTS service we need to make sure that `narrationUrl` is not present.
- When we received the last chunk and closed the stream we should update the chapter in DB to contain a direct link to the file stored in Minio.
- What can we do if two different user with 10 seconds time difference request to generate the chapter's TTS? How can we prevent sending a second request to the TTS server since:
  - This is expensive operation.
  - And we might update the same DB record twice.

# TODOs

I added a text to speech service, now what I need from you is to add a section in each chapter for users to click on it and then it should read that chapter for the user. Note that then we need a new optional field in the chapter model which should be the URL to the mp3 file of that chapter. If it is empty frontend should send a mutation

- **Future improvements**: Actually now that I think about it, we might also need to enable client to download the mp3 file partially when playing it (so we are not loading the entire file in-memory when users open a chapter in our app). This means that e.g. if the click on foirward or backward in the player we should check and if we have not downloaded that part we should send a request to the bacend to download the next part. Also this means that we should take into account when user clicks or the forward or backward multiple times in order to download the correct part.
- Cleanup memory in ReactJS when we jump from chapter to chapter (except for the words we have explained).
- Add soft delete support!
- Add Piper TTS: https://hub.docker.com/r/9109679196/piper-tts-rest-api/
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
