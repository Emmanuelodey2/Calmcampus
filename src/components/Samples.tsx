"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SectionKey = "therapy" | "diagnosis" | "mood";

const Samples = () => {
  const [selectedSection, setSelectedSection] = useState<SectionKey>("therapy");

  // Content data for each section
  const contentData: Record<SectionKey, { id: number; height: string; bg: string; text: string }[]> = {
    therapy: [
      {
        id: 1,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Difficulty concentrating can be frustrating. Have you tried setting up a distraction-free workspace?",
      },
      {
        id: 2,
        height: "h-fit",
        bg: "bg-gray-300",
        text: "Exam anxiety is common! Deep breathing exercises and a study plan can help reduce stress.",
      },
      {
        id: 3,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Struggling with motivation? Setting small, achievable goals might make things feel more manageable.",
      },
      {
        id: 4,
        height: "h-fit",
        bg: "bg-gray-300",
        text: "Feeling overwhelmed? Journaling and talking to a friend can be great ways to process emotions.",
      },
    ],
    diagnosis: [
      {
        id: 1,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Sleep disturbances can be linked to stress or health issues. Try maintaining a consistent sleep schedule.",
      },
      {
        id: 2,
        height: "h-fit",
        bg: "bg-gray-300",
        text: "Feeling emotionally numb? It might help to explore these feelings with a mental health professional.",
      },
      {
        id: 3,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Sudden mood swings can have various causes. Tracking your emotions may help identify patterns.",
      },
    ],
    mood: [
      {
        id: 1,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Feeling happy without a reason? Sometimes, small things like rest and good interactions boost mood!",
      },
      {
        id: 2,
        height: "h-fit",
        bg: "bg-gray-300",
        text: "Unexplained anger and irritability can be challenging. Consider identifying stressors and using calming techniques.",
      },
      {
        id: 3,
        height: "h-fit",
        bg: "bg-gray-200",
        text: "Experiencing low energy? A short walk, stretching, or even music might help lift your mood.",
      },
    ],
  };

  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center min-h-screen px-4"
    >
      {/* Navigation with animated indicator */}
      <nav className="relative flex items-center justify-center space-x-8 py-6 text-lg font-medium text-black">
        {(["therapy", "diagnosis", "mood"] as SectionKey[]).map((section) => (
          <button
            key={section}
            className="relative px-4 py-2 transition-all"
            onClick={() => setSelectedSection(section)}
          >
            {selectedSection === section && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 bg-gray-800 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
            <span className={`relative z-10 ${selectedSection === section ? "text-white" : ""}`}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </span>
          </button>
        ))}
      </nav>

      {/* Content Blocks with Fade-In Animation */}
      <div className="w-full max-w-3xl space-y-4 mt-6">
        <AnimatePresence mode="wait">
          {contentData[selectedSection].map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`${block.height} ${block.bg} rounded-lg p-4 text-lg text-gray-800`}
            >
              {block.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Samples;
