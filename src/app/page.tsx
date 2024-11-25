"use client";

import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDarkMode);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} font-sans`}>

      <main>
        <section className={`text-center py-20 ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-100 to-white'}`}>
          <h1 className="text-5xl font-bold mb-4">YouScribe</h1>
          <p className="text-xl mb-8">Absorb YouTube knowledge faster than ever.</p>
          <a
            href="#get-started"
            className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Get Started
          </a>
        </section>

        <section className="max-w-6xl mx-auto py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Learn Smarter, Not Harder</h2>
              <p className="text-lg mb-6">
                YouScribe transforms YouTube videos into interactive learning experiences.
                Dive deeper into content, retain information better, and accelerate your learning journey.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  AI-powered video summaries
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Interactive transcripts
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Detailed Action Steps
                </li>
              </ul>
            </div>
            <div className="relative h-96">
              <Image
                src="/youscribe-demo.png"
                alt="YouScribe Demo"
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
        </section>

        <section className={`${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white py-16`}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">How YouScribe Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Find a Video</h3>
                <p>Paste any YouTube URL into YouScribe</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
                <p>Our AI analyzes and summarizes the content</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Learn Faster</h3>
                <p>Interact with the content and boost retention</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Supercharge Your Learning?</h2>
            <RegisterLink
              className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Sign Up for Free
            </RegisterLink>
          </div>
        </section>
      </main>

      <footer className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} py-8`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <p>&copy; 2024 YouScribe. All rights reserved.</p>
            <div className="space-x-4">
              <a href="#privacy" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Privacy Policy</a>
              <a href="#terms" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}