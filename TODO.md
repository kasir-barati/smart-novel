- Add OTel
- Add pipe operator
- Instead of a background job for TTS use RabbitMQ and quorum queues.
  - Change your piper image to also accept listen to a routing key.
  - Add retry and quorum queue.
  - Add DLQ to this app too.
- Is it easier to swap with passport or is it better to stick to my current implementation?
- I'd like to create an admin user whenever I am deploying this app in production, I guess this would be a separate thing though. I also like to keep it separate so I can easily use the same thing in my local machine and on the server.
- Add OpenTofu for deploying to the cloud.

Auto gen a simple API client for the backend and use it in the frontend app (so I don't have to create and maintain some dumb interfaces which are essentially the same object type, and input types I have in the backend).

# TODOs

I added a text to speech service, now what I need from you is to add a section in each chapter for users to click on it and then it should read that chapter for the user. Note that then we need a new optional field in the chapter model which should be the URL to the mp3 file of that chapter. If it is empty frontend should send a mutation

- **Future improvements**: Actually now that I think about it, we might also need to enable client to download the mp3 file partially when playing it (so we are not loading the entire file in-memory when users open a chapter in our app). This means that e.g. if the click on foirward or backward in the player we should check and if we have not downloaded that part we should send a request to the bacend to download the next part. Also this means that we should take into account when user clicks or the forward or backward multiple times in order to download the correct part.
- Cleanup memory in ReactJS when we jump from chapter to chapter (except for the words we have explained).
- Add soft delete support!
- Add Piper TTS: https://hub.docker.com/r/9109679196/piper-tts-rest-api/
  - Auto gen the TTS each time we change the content of a chapter.
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
