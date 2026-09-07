# Course video audit — every lesson video must be in English

Rule (Amanda, Sep 7, 2026): nothing in the RDA courses is in Spanish. Students must have
English to pass the Texas exam and get hired here. A Spanish course will be built
separately later; the English course carries no Spanish.

## What was found and fixed

- Destiny R. (online student) texted Sep 4: "chapter 5 lesson 5 the video is in Spanish."
  That is Week 5 · Lesson 5, **Chapter 34: Dental Hand Instruments**, YouTube `wH3Riu-GZ8Q`.
  The in-person course used the same video (Week 4 · Lesson 5).
- Both lessons had the video removed on Sep 7 (`db/migrations/20260907_chapter34_spanish_video_removed.sql`).
  The lesson text, practice questions, instrument-ID widget and ChairSide link are all English and unchanged.
- A text scan of every lesson body, quiz and practice question found no Spanish text. The
  only accented words are English ("résumé", "décor", "Fédération Dentaire Internationale").

## Cowork task: watch the first 30 seconds of each video and confirm it is English

The sandbox cannot open YouTube, so this is a browser job. For each row, open the link,
confirm the narration is English, and reply with any that are not. Both courses use the
same list (the online course mirrors the in-person one).

| Week | Lesson | Video |
|---|---|---|
| 1 | Chapter 2: The Dental Healthcare Team | https://www.youtube.com/watch?v=x4CL5zlWjGg |
| 1 | Chapter 3: The Professional Dental Assistant | https://youtu.be/_17oaXMduE8 |
| 1 | Code of Ethics Video | https://youtu.be/_17oaXMduE8 |
| 1 | Dental Specialties Video (online only) | https://www.youtube.com/watch?v=P4G8snnzQsM |
| 1 | Duties of a Dental Assistant (online only) | https://youtu.be/Kd0vC3beboo |
| 2 | Chapter 11: Overview of the Dentitions | https://www.youtube.com/watch?v=MYO5z89wrRE |
| 2 | Chapter 12: Tooth Morphology | https://www.youtube.com/watch?v=qS9c7g_PVA8 |
| 2 | Chapter 16: Periodontal Disease | https://www.youtube.com/watch?v=pquZK5XMcTQ |
| 2 | Chapter 28: Oral Diagnosis and Treatment Planning | https://www.youtube.com/watch?v=zFmBM8prywE |
| 3 | Chapter 19: Disease Transmission and Infection Prevention | https://www.youtube.com/watch?v=_o9SxDFPUiA |
| 3 | Chapter 20: Principles and Techniques of Disinfection | https://www.youtube.com/watch?v=kagX0Wo4RX0 |
| 3 | Chapter 21: Instrument Processing and Sterilization | https://www.youtube.com/watch?v=mOrlSek7m0k |
| 3 | Chapter 23: Chemical and Waste Management | https://www.youtube.com/watch?v=1jQfTOa5YZQ |
| 3 | Chapter 27: Vital Signs | https://www.youtube.com/watch?v=rJMqdby1L_Y |
| 4 | Chapter 32: The Dental Office | https://www.youtube.com/watch?v=7zRsLpkJA1w |
| 4 | Chapter 33: Delivering Dental Care | https://www.youtube.com/watch?v=iVJhauUPQWI |
| 4 | Chapter 34: Dental Hand Instruments | REMOVED (was Spanish). Needs an English replacement. |
| 4 | Chapter 35: Dental Handpieces and Accessories | https://www.youtube.com/watch?v=L3XHtLxkhAA |
| 5 | Chapter 38: Radiography Foundations and Safety | https://www.youtube.com/watch?v=SZFqei91R9w |
| 5 | Chapter 39: Imaging and Processing (Film/Digital) | https://www.youtube.com/watch?v=0QQKYeZq3AE |
| 5 | Chapter 40: Legal, Quality Assurance, and Infection Prevention | https://www.youtube.com/watch?v=YIhC7Aa8IEI |
| 5 | Chapter 41: Intraoral Imaging | https://www.youtube.com/watch?v=25hPc1IITEs |
| 6 | Chapter 38 to 41 reviews | same four videos as Week 5 |
| 7 | Chapter 43: Restorative and Esthetic Dental Materials | https://www.youtube.com/watch?v=pX1hfcnC0so |
| 7 | Chapter 44: Dental Liners, Bases, and Bonding Systems | https://www.youtube.com/watch?v=XGXy7YJCFyU |
| 7 | Chapter 48: General Dentistry | https://www.youtube.com/watch?v=bjbkohwOPZU |
| 7 | Chapter 49: Matrix Systems for Restorative Dentistry | https://www.youtube.com/watch?v=ziX68R9p3E0 |
| 8 | Chapter 46: Impression Materials and Techniques | https://www.youtube.com/watch?v=Dllar7shMdY |
| 8 | Chapter 47: Laboratory Materials and Procedures | https://www.youtube.com/watch?v=7HMUkE0ZxRY |
| 8 | Chapter 51: Provisional Coverage | https://www.youtube.com/watch?v=oSw6LUyGeVM |
| 8 | Chapter 52: Removable Prosthodontics | https://www.youtube.com/watch?v=a6TdHYusJms |
| 9 | Chapter 50: Fixed Prosthodontics | https://www.youtube.com/watch?v=uqE-o_IbQ8k |
| 9 | Chapter 54: Endodontics | https://www.youtube.com/watch?v=4Ul6lChYpPs |
| 9 | Chapter 55: Periodontics | https://www.youtube.com/watch?v=oVSss3AgCt4 |
| 10 | Chapter 56: Oral and Maxillofacial Surgery | https://www.youtube.com/watch?v=UT21y1bQX2I |
| 10 | Chapter 57: Pediatric Dentistry | https://www.youtube.com/watch?v=5Qx6sW7KVB4 |
| 10 | Chapter 59: Dental Sealants | https://www.youtube.com/watch?v=Twxd7v9zlE4 |
| 10 | Chapter 60: Orthodontics | https://www.youtube.com/watch?v=OdNcXcpsIUc |

To swap any video, in `/admin/courses` open the lesson and paste the new YouTube link,
or run: `update public.course_lessons set video_url = '<url>' where title = '<exact title>';`
(both courses share titles, so that updates the online and in-person copies together).

Reply to Destiny (Amanda's voice, send from the hello@ Quo line, 8 AM to 6 PM):

> Hi Destiny, thank you for catching that. You were right, the Chapter 34 video was in Spanish. It is off the lesson now, and everything in the course is English. The reading, practice questions and instrument tool on that lesson are all there for you. Text me any time you see something off.
