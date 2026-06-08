"use client"
import React, { useState } from "react";

const Journal = () => {
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState<string[]>([]);

  const handleSave = () => {
    if (entry.trim()) {
      setEntries([...entries, entry]);
      setEntry(""); // Clear the textarea
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>My Journal</h1>
      <textarea
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="Write your journal entry here..."
        rows={10}
        cols={50}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />
      <button onClick={handleSave} style={{ marginBottom: "20px" }}>
        Save Entry
      </button>
      <h2>Previous Entries</h2>
      <ul>
        {entries.map((e, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Journal;