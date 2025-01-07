import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  subDays,
} from "date-fns";
import "./App.css";
import api from "./axios"; // Axios instance

import { jsPDF } from "jspdf";

// Areas related to tasks
const areas = [
  {
    name: "Physical",
    subcategories: [
      { name: "Exercise", items: ["yoga", "cardio", ">=8000 steps"] },
      {
        name: "Sleep",
        items: [
          "8 hours last night",
          "go to sleep before 1am",
          "no smoking 1h before bed",
        ],
      },
      {
        name: "Beauty",
        items: [
          "extra morning skincare",
          "extra evening skincare",
          "IPL - legs",
          "IPL - bikini",
          "haircare",
        ],
      },
      {
        name: "Food",
        items: [
          "cook a healthy meal",
          "fast 12h",
          "fast 16h",
          "eat enough veggies",
        ],
      },
    ],
  },
  {
    name: "Intellectual",
    subcategories: [
      {
        name: "Music",
        items: [
          "discover new music",
          "learn about genres",
          "read/watch reviews",
          "learn about classics",
          "learn a new term",
          "learn music theory",
          "learn about production",
        ],
      },
      {
        name: "Reading",
        items: [
          "read any book",
          "read a classic book",
          "watch/read book reviews",
          "discover new/old authors",
          "learn advanced English",
        ],
      },
      { name: "Logic", items: ["sudoku", "puzzles", "computer science"] },
    ],
  },
  {
    name: "Mental",
    subcategories: [
      {
        name: "Journal",
        items: [
          "explore topics from list",
          "write what bothers you",
          "summarize the day",
        ],
      },
      {
        name: "ChatGpt",
        items: ["explore topics from list", "write what bothers you"],
      },
      {
        name: "Experience IRL",
        items: [
          "apply previously gathered knowledge",
          "control the outburst before it happens",
        ],
      },
    ],
  },
  {
    name: "Social",
    subcategories: [
      {
        name: "ReachOut",
        items: ["reach out to friends", "reach out to family"],
      },
      {
        name: "ChatGpt",
        items: ["explore topics from list", "write what bothers you"],
      },
    ],
  },
  {
    name: "Professional",
    subcategories: [
      {
        name: "Udemy",
        items: ["testerCourse", "C# Course", "any other course"],
      },
      {
        name: "Practice",
        items: ["interview questions", "udemy tasks", "problems"],
      },
      {
        name: "Project",
        items: ["PortfolioWeb", "TasksDaily", "ImageEditor", "any other"],
      },
    ],
  },
  {
    name: "Creative",
    subcategories: [
      {
        name: "Music",
        items: [
          "dexterity (scales/exercises)",
          "ear training",
          "play known songs",
          "new thing (technique/riffs)",
          "fretboard/how guitar works",
        ],
      },
      {
        name: "Writing",
        items: [
          "journal creatively",
          "short story",
          "read a book",
          "learn about CW",
        ],
      },
      {
        name: "Singing",
        items: [
          "singing exercises",
          "teacher",
          "part of a song (make notes)",
          "learn about singing",
          "sing in front of others",
        ],
      },
    ],
  },
];

// Areas related to calendar
const calAreas = [
  "Physical",
  "Intellectual",
  "Mental",
  "Social",
  "Professional",
  "Creative",
];

function App() {
  const today = new Date();
  const [date, setDate] = useState(today);
  const [completedTasksByDate, setCompletedTasksByDate] = useState({});
  const [selectedDays, setSelectedDays] = useState({});
  const [notes, setNotes] = useState({});

  const [activeTextArea, setActiveTextArea] = useState(null);

  const handleNoteFocus = (task) => {
    setActiveTextArea(task); // Mark textarea as active
  };

  useEffect(() => {
    const fetchNotes = async () => {
      const formattedDate = format(date, "yyyy-MM-dd");
      const tasksForDate = completedTasksByDate[formattedDate];

      if (!tasksForDate) return;

      for (const area of Object.keys(tasksForDate)) {
        for (const subcategory of Object.keys(tasksForDate[area])) {
          for (const task of tasksForDate[area][subcategory]) {
            try {
              const response = await api.get(
                `/tasks/note/${formattedDate}/${task}`
              );
              if (response.data) {
                setNotes((prevNotes) => ({
                  ...prevNotes,
                  [formattedDate]: {
                    ...(prevNotes[formattedDate] || {}),
                    [task]: response.data.note,
                  },
                }));
              }
            } catch (err) {
              if (err.response?.status === 404) {
                // Handle missing note (e.g., leave it as an empty string)
                setNotes((prevNotes) => ({
                  ...prevNotes,
                  [formattedDate]: {
                    ...(prevNotes[formattedDate] || {}),
                    [task]: "",
                  },
                }));
              } else {
                console.error(`Error fetching note for task "${task}":`, err);
              }
            }
          }
        }
      }
    };

    fetchNotes();
  }, [completedTasksByDate, date]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await api.get(`/tasks/${formattedDate}`);
        const tasks = response.data;
        const newCompletedTasksByDate = {};

        for (const task of tasks) {
          if (!newCompletedTasksByDate[task.date]) {
            newCompletedTasksByDate[task.date] = {};
          }
          if (!newCompletedTasksByDate[task.date][task.area]) {
            newCompletedTasksByDate[task.date][task.area] = {};
          }
          if (
            !newCompletedTasksByDate[task.date][task.area][task.subcategory]
          ) {
            newCompletedTasksByDate[task.date][task.area][task.subcategory] =
              [];
          }
          newCompletedTasksByDate[task.date][task.area][task.subcategory].push(
            task.item
          );
        }

        setCompletedTasksByDate(newCompletedTasksByDate);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks(); // Call to fetch tasks based on `date`
  }, [date]); // Depend on `date` to fetch the tasks for the specific date

  // New useEffect for fetching clicked dates (independent of date)
  useEffect(() => {
    const fetchClickedDates = async () => {
      try {
        const clickedDays = {}; // Initialize the object to hold the clicked dates for all areas

        // Loop over each calendar area and fetch the clicked dates
        for (const area of calAreas) {
          const response = await api.get(`/api/calendar/${area}`); // Corrected route
          const clickedDates = response.data;

          // Store clicked dates for the current area in a Set (for fast lookup)
          clickedDays[area] = new Set(
            clickedDates.map((clickedDate) => clickedDate.date) // Ensure you only store the date
          );
        }

        setSelectedDays(clickedDays); // Update state with clicked days for all areas
      } catch (err) {
        console.error("Error fetching clicked dates:", err);
      }
    };

    fetchClickedDates(); // Fetch clicked dates on initial load
  }, []); // Run once when the component mounts (no dependency on `area`)

  const handleTaskCompletion = async (
    area,
    subcategory,
    item,
    deleteTask = false
  ) => {
    const newCompletedTasksByDate = { ...completedTasksByDate };
    const formattedDate = format(date, "yyyy-MM-dd");

    if (deleteTask) {
      // Handle task deletion
      try {
        await api.delete(`/tasks`, {
          data: { date: formattedDate, area, subcategory, item },
        });

        // Remove task from state
        newCompletedTasksByDate[formattedDate][area][subcategory] =
          newCompletedTasksByDate[formattedDate][area][subcategory].filter(
            (task) => task !== item
          );

        if (
          newCompletedTasksByDate[formattedDate][area][subcategory].length === 0
        ) {
          delete newCompletedTasksByDate[formattedDate][area][subcategory];
        }

        setCompletedTasksByDate(newCompletedTasksByDate);
      } catch (err) {
        console.error("Error deleting task:", err);
      }
      return;
    }

    if (!newCompletedTasksByDate[formattedDate]) {
      newCompletedTasksByDate[formattedDate] = {};
    }

    if (!newCompletedTasksByDate[formattedDate][area]) {
      newCompletedTasksByDate[formattedDate][area] = {};
    }

    if (!newCompletedTasksByDate[formattedDate][area][subcategory]) {
      newCompletedTasksByDate[formattedDate][area][subcategory] = [];
    }

    const isTaskCompleted =
      newCompletedTasksByDate[formattedDate][area][subcategory].includes(item);
    if (isTaskCompleted) {
      newCompletedTasksByDate[formattedDate][area][subcategory] =
        newCompletedTasksByDate[formattedDate][area][subcategory].filter(
          (task) => task !== item
        );
    } else {
      newCompletedTasksByDate[formattedDate][area][subcategory].push(item);
      try {
        // Save the task to MongoDB
        await api.post("/tasks", {
          date: formattedDate,
          area,
          subcategory,
          item,
        });
      } catch (err) {
        console.error("Error saving task:", err);
      }
    }

    setCompletedTasksByDate(newCompletedTasksByDate);
  };

  const handleNoteChange = (task, note) => {
    const formattedDate = format(date, "yyyy-MM-dd");

    setNotes((prevNotes) => ({
      ...prevNotes,
      [formattedDate]: {
        ...(prevNotes[formattedDate] || {}),
        [task]: note,
      },
    }));
  };

  const handleSaveNote = async (task, area) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const taskNote = notes[formattedDate]?.[task] || "";

    if (!taskNote.trim()) {
      console.warn("Note is empty. Nothing to save.");
      return;
    }

    try {
      const response = await api.post("/tasks/note", {
        date: formattedDate,
        area, // ✅ Ensure area is passed correctly
        task,
        note: taskNote,
      });

      console.log(response.data.message); // Success message from backend
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".note")) {
        setActiveTextArea(); // Clear the active textarea when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChangeDate = (direction) => {
    let newDate = new Date(date);
    if (direction === 1) {
      // Move forward
      newDate = addDays(newDate, 1);
    } else {
      // Move backward
      newDate = subDays(newDate, 1);
    }
    setDate(newDate);
  };

  const formatDate = (date) => format(date, "MMMM dd, yyyy");

  const getMonthDays = (currentDate) => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    return eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  };

  const monthDays = getMonthDays(date);

  const handleCalendarClick = async (calArea, day) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    const newSelectedDays = { ...selectedDays };

    if (!newSelectedDays[calArea]) newSelectedDays[calArea] = new Set();

    if (newSelectedDays[calArea].has(formattedDay)) {
      newSelectedDays[calArea].delete(formattedDay);
    } else {
      newSelectedDays[calArea].add(formattedDay);
    }

    setSelectedDays(newSelectedDays);

    try {
      await api.post("/api/calendar", { date: formattedDay, calArea });
    } catch (err) {
      console.error("Error saving clicked date:", err);
    }
  };
  const filterCompletedTasks = (area) => {
    const completedForArea =
      completedTasksByDate[format(date, "yyyy-MM-dd")]?.[area.name] || {};
    const completedItems = [];

    area.subcategories.forEach((subcategory) => {
      const completedForSubcategory = completedForArea[subcategory.name] || [];
      completedForSubcategory.forEach((task) => {
        completedItems.push({ task, subcategory: subcategory.name });
      });
    });

    return completedItems;
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    const formattedDate = format(date, "yyyy-MM-dd");
    const fileName = `tasks_done_${formattedDate}.pdf`;

    // Set the title for the PDF
    doc.setFontSize(16);
    doc.text(`Tasks Completed on ${formattedDate}`, 10, 10);

    // Start position on the page
    let yPosition = 20;

    // Iterate through each area
    areas.forEach((area) => {
      const completedTasks = filterCompletedTasks(area);
      if (completedTasks.length > 0) {
        // Add area name
        doc.setFontSize(14);
        doc.text(area.name, 10, yPosition);
        yPosition += 10;

        // Add tasks and notes under this area
        completedTasks.forEach(({ task, subcategory }) => {
          // Task details
          doc.setFontSize(12);
          doc.text(`- ${subcategory}: ${task}`, 15, yPosition);
          yPosition += 8;

          // Task notes
          const taskNote = notes[formattedDate]?.[task];
          if (taskNote) {
            doc.setFontSize(10);
            doc.text(`  Note: ${taskNote}`, 20, yPosition);
            yPosition += 8;
          }
        });
      }
    });

    // Save the PDF with the date in the filename
    doc.save(fileName);
  };

  return (
    <div className="App">
      <div className="header">
        {/* <h1 className="title">TasksDaily</h1> */}
        <p className="date"> Today is {formatDate(date)}</p>
        <div className="navbar">
          <span>
            <a href="#areas">areas</a>
          </span>
          <span>
            <a href="#done-today">done</a>{" "}
          </span>
          <span>
            <a href="#calendars">calendars</a>{" "}
          </span>
        </div>
      </div>

      <div className="arrows">
        <button onClick={() => handleChangeDate(-1)}>←</button>
        <button onClick={() => handleChangeDate(1)}>→</button>
      </div>

      <div id="areas" className="areas">
        {areas.map((area) => (
          <div className={area.name} key={area.name}>
            <h2 className="area-name">{area.name}</h2>{" "}
            <div className="area-list">
              {area.subcategories.map((subcategory) => (
                <div key={subcategory.name} className="subcategory">
                  <h3 className="subCategory-name">{subcategory.name}</h3>
                  <div className="checklist">
                    {subcategory.items.map((item) => (
                      <div key={item} className="task">
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              completedTasksByDate[
                                format(date, "yyyy-MM-dd")
                              ]?.[area.name]?.[subcategory.name]?.includes(
                                item
                              ) || false
                            }
                            onChange={() =>
                              handleTaskCompletion(
                                area.name,
                                subcategory.name,
                                item
                              )
                            }
                          />
                          <span> {item}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div id="done-today" className="done-today">
        <h2>Done today</h2>
        <div className="done-areas">
          {areas.map((area) => (
            <div key={area.name} className={area.name}>
              <h3 className="area-name">{area.name}</h3>
              <ul className="done-tasks">
                {filterCompletedTasks(area).map(({ task, subcategory }) => (
                  <li key={task}>
                    <span className="done-task">
                      <strong>{subcategory}</strong>: {task}
                    </span>
                    <button
                      className="delete"
                      onClick={() =>
                        handleTaskCompletion(area.name, subcategory, task, true)
                      }
                    >
                      ❌
                    </button>
                    <textarea
                      className="note"
                      type="text"
                      value={notes[format(date, "yyyy-MM-dd")]?.[task] || ""}
                      onFocus={() => handleNoteFocus(task)} // Trigger on focus
                      onChange={(e) => handleNoteChange(task, e.target.value)}
                      onBlur={() => {
                        handleSaveNote(task, area.name); // Save the note when focus is lost
                        setActiveTextArea(null); // Clear active textarea
                      }}
                    ></textarea>

                    {activeTextArea === task && (
                      <button
                        className="save"
                        onClick={() => handleSaveNote(task, area.name)}
                      >
                        Save
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div id="calendars" className="calendars">
        {calAreas.map((calArea) => (
          <div key={calArea} className="calendar">
            <h3>{calArea}</h3>
            <div className="calendar-grid">
              {monthDays.map((day) => {
                const dayFormatted = format(day, "yyyy-MM-dd");
                const isCompleted = selectedDays[calArea]?.has(dayFormatted);

                return (
                  <div
                    key={dayFormatted}
                    className={`calendar-day ${isCompleted ? "completed" : ""}`}
                    onClick={() => handleCalendarClick(calArea, day)}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleExportToPDF} className="export-pdf">
        Export to PDF
      </button>
    </div>
  );
}

export default App;
