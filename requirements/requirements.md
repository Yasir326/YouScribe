# YouTube Video Summarizer - Project Requirements

1. Project Overview
Build a web application that allows users to enter a YouTube URL, extract the video's transcript, and use OpenAI to generate a summary and actionable steps based on the video content.
2. Technology Stack

Next.js
Shadcn UI
Lucide icons
Supabase
Clerk
OpenAI API

3. Feature Requirements
3.1 User Interface

Create a form with:

An input field for the YouTube URL
A button to submit and initiate the summarization process



3.2 Video Processing

Implement functionality to extract the transcript from the provided YouTube URL
Use OpenAI to generate:

A summary of the video content
Actionable steps (if applicable to the video content)

3.3 Results Display

Display the summary and action steps in a visually appealing manner
Implement hover effects to reveal:

A download icon button
A like icon button

3.4 User Interaction

Allow users to download the summary and action steps
Implement a "like" functionality for user feedback

3.5 Animation and Loading States

Design and implement animations for:

Initial state when no summary is available
Loading state while generating the summary

4. Non-functional Requirements

Ensure responsive design for various screen sizes
Implement proper error handling throughout the application


YOUSCRIBE
└── youscribe
    └── app
        ├── fonts
        │   ├── GeistMonoVF.woff
        │   ├── GeistVF.woff
        │   └── favicon.ico
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx
        ├── lib
        └── node_modules
    ├── .eslintrc.json
    ├── .gitignore
    ├── components.json
    ├── next-env.d.ts
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    ├── tailwind.config.ts
    └── tsconfig.json