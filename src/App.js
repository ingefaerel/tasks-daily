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
      { name: "Exercise", items: ["Yoga", "Cardio", "Running", "Strength"] },
      { name: "Sleep", items: ["8 hours", "Nap", "Rest"] },
      { name: "Beauty", items: ["Skincare", "Haircare"] },
      { name: "Food", items: ["Healthy meal", "Water intake", "Snacks"] },
    ],
  },
  {
    name: "intellectual",
    subcategories: [
      { name: "Reading", items: ["Book 1", "Book 2", "Article"] },
      { name: "Studying", items: ["Course 1", "Course 2"] },
      { name: "Learning", items: ["Skill 1", "Skill 2"] },
    ],
  },
  {
    name: "mental",
    subcategories: [
      { name: "Meditation", items: ["Morning", "Evening"] },
      { name: "Relaxation", items: ["Deep breathing", "Visualization"] },
      { name: "Journaling", items: ["Morning entry", "Evening entry"] },
    ],
  },
  {
    name: "social",
    subcategories: [
      { name: "Meetings", items: ["Friend", "Family"] },
      { name: "Calls", items: ["Call mom", "Call friend"] },
    ],
  },
  {
    name: "professional",
    subcategories: [
      { name: "Work tasks", items: ["Task 1", "Task 2"] },
      { name: "Meetings", items: ["Team meeting", "Client meeting"] },
    ],
  },
  {
    name: "creative",
    subcategories: [
      { name: "Drawing", items: ["Sketching", "Coloring"] },
      { name: "Writing", items: ["Story", "Blog"] },
      { name: "Music", items: ["Practice", "Listen"] },
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

      if (!tasksForDate) return; // Exit if no tasks for the date

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
              console.error(`Error fetching note for task "${task}":`, err);
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
