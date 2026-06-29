"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  Save,
  Plus,
  Calendar,
  Type,
  Trash2,
  Mic,
  MicOff,
  RefreshCw
} from "lucide-react";
import "react-quill-new/dist/quill.snow.css";
import { apiRequest } from "@/lib/api";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });


interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp?: number;
  created_at?: string;
  updated_at?: string;
}

const MODULES = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const FORMATS = [
  "header", "font", "size",
  "bold", "italic", "underline", "strike",
  "blockquote", "list", "indent",
  "link", "image", "color", "background", "align",
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchJournals() {
    try {
      const data = await apiRequest<JournalEntry[]>("/journals/");
      setJournals(data);
      setEntries(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch journals";
      console.error("Failed to fetch journals:", message);
      alert(message)
    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    fetchJournals();
  }, []);
  // Load journals from storage on mount
  // useEffect(() => {
  //   setEntries(storageService.getJournals());
  // }, []);

  // Speech recognition cleanup
  useEffect(() => {
    return () => {
      if ((window as any)._recognition) (window as any)._recognition.stop();
    };
  }, []);

  async function handleSave () {
    if (!currentEntry?.title?.trim() && !currentEntry?.content?.trim()) {
      setIsEditing(false);
      return;
    }

    const entryToSave: JournalEntry = {
      id: currentEntry?.id || crypto.randomUUID(),
      title: currentEntry?.title || "Untitled Entry",
      content: currentEntry?.content || "",
      timestamp: Date.now(),
    };


    // Update state
    // const updatedEntries = entries.filter(e => e.id !== entryToSave.id);
    // setEntries([entryToSave, ...updatedEntries]);
    // setCurrentEntry(null);
    // setIsEditing(false);

    try {
      const data = await apiRequest<JournalEntry>("/journals/", {
        method: "POST",
        body: { entryToSave },
      });
      setJournals([data, ...journals]);
      fetchJournals()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save journal";
      console.error("Failed to save journals:", message);
      alert(message)
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const handleRefresh = () => {
    if (confirm("Clear current draft?")) {
      setCurrentEntry(null);
      setIsEditing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && currentEntry) {
        setCurrentEntry({
          ...currentEntry,
          content: currentEntry.content + " " + finalTranscript,
        });
      }
    };

    recognition.start();
    (window as any)._recognition = recognition;
  };

  // EDITING VIEW
  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-white">
        <header className="p-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
          <button onClick={() => setIsEditing(false)} className="p-2 -ml-2 text-slate-400">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Journal Entry</h2>
          <div className="flex items-center space-x-2">
            {currentEntry && (
              <button
                onClick={() => currentEntry && handleDelete(currentEntry.id)}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleSave}
              className="bg-brand-600 text-slate-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-sm"
            >
              <Save size={16} className="mr-1.5" /> Save
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Voice Control */}
          <div className="px-6 py-2 flex justify-end">
            <button
              onClick={toggleListening}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isListening ? "Stop Listening" : "Dictate Entry"}</span>
            </button>
          </div>

          {/* Title Input */}
          <div className="w-full flex justify-between px-6 pt-6">
            <input
              type="text"
              placeholder="Untitled Entry"
              value={currentEntry?.title || ""}
              onChange={(e) =>
                setCurrentEntry({
                  ...currentEntry!,
                  title: e.target.value,
                })
              }
              className="text-3xl font-serif font-bold border-none focus:ring-0 placeholder:text-slate-200 w-full p-0 mb-4"
            />
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-2 journal-editor">
            <ReactQuill
              theme="snow"
              value={currentEntry?.content || ""}
              onChange={(content) =>
                setCurrentEntry({ ...currentEntry!, content })
              }
              modules={MODULES}
              formats={FORMATS}
              placeholder="How was your day? Write freely..."
              className="h-full border-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Journal</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear Draft"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => {
              setCurrentEntry({ id: "", title: "", content: "", timestamp: Date.now() });
              setIsEditing(true);
            }}
            className="bg-slate-100 text-slate-400 p-2 rounded-xl shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <section className="space-y-4">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            whileHover={{ x: 4 }}
            className="p-5 bg-slate-50 rounded-3xl space-y-2 cursor-pointer border border-transparent hover:border-brand-100 transition-all"
            onClick={() => handleEdit(entry)}
          >
            <div className="flex items-center text-slate-400 text-xs font-medium">
              <Calendar size={12} className="mr-1" /> {new Date(entry.created_at || entry.timestamp || Date.now()).toLocaleDateString()}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{entry.title}</h3>
            <div
              className="text-slate-500 text-sm line-clamp-2"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </motion.div>
        ))}
      </section>

      {/* Empty State Prompt */}
      <section className="bg-brand-50 p-6 rounded-3xl border border-brand-100 space-y-3">
        <h4 className="font-bold text-brand-900 flex items-center">
          <Type size={18} className="mr-2" /> Writing Prompt
        </h4>
        <p className="text-brand-700 text-sm italic">&quot;What are three things you&apos;re grateful for today, no matter how small?&quot;</p>
        <button
          onClick={() => {
            setCurrentEntry({ id: "", title: "", content: "", timestamp: Date.now() });
            setIsEditing(true);
          }}
          className="text-brand-600 text-sm font-bold hover:underline"
        >
          Start Writing
        </button>
      </section>
    </div>
  );
}
