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

// Areas related to tasks
const areas = [
  {
    name: "physical",
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
    name: "intellectual",
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
    name: "mental",
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
    name: "social",
    subcategories: [
      {
        name: "Reach out",
        items: ["reach out to friends", "reach out to family"],
      },
      {
        name: "ChatGpt",
        items: ["explore topics from list", "write what bothers you"],
      },
    ],
  },
  {
    name: "professional",
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
    name: "creative",
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
          "Journal creatively",
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
  "physical",
  "intellectual",
  "mental",
  "social",
  "professional",
  "creative",
];

function App() {
  const today = new Date();
  const [date, setDate] = useState(today);
  const [completedTasksByDate, setCompletedTasksByDate] = useState({});
  const [selectedDays, setSelectedDays] = useState({});
  const [notes, setNotes] = useState({});

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

  const handleTaskCompletion = async (area, subcategory, item) => {
    const newCompletedTasksByDate = { ...completedTasksByDate };
    const formattedDate = format(date, "yyyy-MM-dd");

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

  const handleSaveNote = async (task) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const taskNote = notes[formattedDate]?.[task] || "";

    try {
      // Save the note to the backend
      await api.post("/tasks/note", {
        date: formattedDate,
        task,
        note: taskNote,
      });
      console.log("Note updated successfully");
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

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

  return (
    <div className="App">
      <div className="header">
        <h1 className="title">Daily tracker</h1>
        <p className="date"> Today is {formatDate(date)}</p>
      </div>

      <div className="arrows">
        <button onClick={() => handleChangeDate(-1)}>←</button>
        <button onClick={() => handleChangeDate(1)}>→</button>
      </div>

      <div className="areas">
        {areas.map((area) => (
          <div className="area" key={area.name}>
            <h2>{area.name}</h2>
            {area.subcategories.map((subcategory) => (
              <div key={subcategory.name} className="subcategory">
                <h3>{subcategory.name}</h3>
                <div className="checklist">
                  {subcategory.items.map((item) => (
                    <div key={item} className="task">
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            completedTasksByDate[format(date, "yyyy-MM-dd")]?.[
                              area.name
                            ]?.[subcategory.name]?.includes(item) || false
                          }
                          onChange={() =>
                            handleTaskCompletion(
                              area.name,
                              subcategory.name,
                              item
                            )
                          }
                        />
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="done-today">
        <h2>Done today</h2>
        <div className="done-areas">
          {areas.map((area) => (
            <div key={area.name} className="done-area">
              <h3>{area.name}</h3>
              <ul>
                {filterCompletedTasks(area).map(({ task, subcategory }) => (
                  <li key={task}>
                    {`${subcategory}: ${task}`}
                    <input
                      type="text"
                      value={notes[format(date, "yyyy-MM-dd")]?.[task] || ""}
                      onChange={(e) => handleNoteChange(task, e.target.value)}
                      placeholder="Enter your note"
                    />
                    <button onClick={() => handleSaveNote(task)}>Save</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="calendars">
        {calAreas.map((calArea) => (
          <div key={calArea} className="calendar">
            <h3>{calArea} Calendar</h3>
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
    </div>
  );
}

export default App;
