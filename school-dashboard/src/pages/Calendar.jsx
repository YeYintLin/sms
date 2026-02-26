import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useToast } from "../hooks/useToast.jsx";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem("calendar_events");
    return savedEvents ? JSON.parse(savedEvents) : {};
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [entryType, setEntryType] = useState("note");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem("calendar_events", JSON.stringify(events));
  }, [events]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (day) => {
    const dateKey = `${year}-${currentDate.getMonth() + 1}-${day}`;
    setSelectedDate(dateKey);
    const entry = events[dateKey];
    setNote(entry?.note || "");
    setEntryType(entry?.type || "note");
    setStartTime(entry?.startTime || "");
    setEndTime(entry?.endTime || "");
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (note.trim()) {
      setEvents({
        ...events,
        [selectedDate]: { note, type: entryType, startTime, endTime },
      });
      showToast(
        entryType === "exam"
          ? "Exam saved successfully!"
          : entryType === "important"
            ? "Important item saved successfully!"
            : "Note saved successfully!",
        "success",
      );
    } else {
      const newEvents = { ...events };
      delete newEvents[selectedDate];
      setEvents(newEvents);
    }
    setIsModalOpen(false);
  };

  const handleDeleteNote = () => {
    const newEvents = { ...events };
    delete newEvents[selectedDate];
    setEvents(newEvents);
    showToast("Note deleted", "success");
    setIsModalOpen(false);
  };

  // Generate calendar grid
  const days = [];
  const prevMonthDays = getDaysInMonth(
    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
  );

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(
      <div key={`prev-${i}`} className="calendar-day empty">
        {prevMonthDays - i}
      </div>,
    );
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${currentDate.getMonth() + 1}-${i}`;
    const entry = events[dateKey];
    const hasEvent = !!entry;
    const isToday =
      i === new Date().getDate() &&
      currentDate.getMonth() === new Date().getMonth() &&
      currentDate.getFullYear() === new Date().getFullYear();

    days.push(
      <div
        key={i}
        className={`calendar-day ${isToday ? "today" : ""} ${hasEvent ? "has-event" : ""}`}
        onClick={() => handleDayClick(i)}
      >
        <span className="day-number">{i}</span>
        {hasEvent && <div className="event-dot"></div>}
        {hasEvent && !isToday && (
          <div className={`event-preview ${entry?.type === "exam" ? "exam" : ""} ${entry?.type === "important" ? "important" : ""}`}>
            {(entry?.startTime || entry?.endTime) && (
              <span className="event-time">
                {entry?.startTime || "--:--"}{entry?.endTime ? ` - ${entry.endTime}` : ""}
              </span>
            )}
            {entry?.note?.substring(0, 20)}
            {entry?.note?.length > 20 ? "..." : ""}
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header-actions">
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          Interactive Calendar
        </h1>
        <div className="calendar-nav">
          <button
            className="btn icon-btn"
            onClick={prevMonth}
            style={{
              color: "var(--text-main)",
              width: "auto",
              minWidth: "40px",
            }}
          >
            <IoIosArrowBack size={20} color="var(--text-main)" />            
          </button>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              minWidth: "150px",
              textAlign: "center",
            }}
          >
            {monthName} {year}
          </h2>
          <button
            className="btn icon-btn"
            onClick={nextMonth}
            style={{
              color: "var(--text-main)",
              width: "auto",
              minWidth: "40px",
            }}
          >
            <IoIosArrowForward size={20} color="var(--text-main)" />            
          </button>
        </div>
      </div>

      <div className="calendar-container card">
        <div className="calendar-grid-header">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">{days}</div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>Edit Entry for {selectedDate}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="close-btn"
              >
                <X size={24} />
              </button>
            </div>
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Type</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
              >
                <option value="note">Note</option>
                <option value="exam">Exam</option>
                <option value="important">Important</option>
              </select>
            </div>
            <div className="form-group">
              <label>Time (optional)</label>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ minWidth: "140px" }}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ minWidth: "140px" }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                rows="5"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write details here..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-color)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="modal-actions">
              {events[selectedDate] && (
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteNote}
                  style={{ marginRight: "auto" }}
                >
                  <Trash2 size={18} /> Delete
                </button>
              )}
              <button className="btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveNote}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .calendar-page {
                    height: calc(100vh - 100px);
                    display: flex;
                    flex-direction: column;
                }
                .calendar-header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .calendar-nav {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--bg-card);
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .calendar-nav .icon-btn {
                    color: var(--text-main);
                    width: auto;
                    min-width: 40px;
                    padding: 0.35rem 0.6rem;
                }
                .calendar-nav .icon-btn svg {
                    stroke: currentColor;
                    fill: currentColor;
                    display: block;
                }
                .calendar-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden;
                    border-radius: 16px;
                }
                .calendar-grid-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-body);
                }
                .day-name {
                    padding: 1rem;
                    text-align: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--text-light);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: minmax(100px, 1fr);
                    flex: 1;
                }
                .calendar-day {
                    border-right: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    position: relative;
                }
                .calendar-day:nth-child(7n) {
                    border-right: none;
                }
                .calendar-day:hover {
                    background: var(--bg-body);
                }
                .calendar-day.empty {
                    color: var(--text-light);
                    opacity: 0.3;
                    cursor: default;
                }
                .day-number {
                    font-weight: 600;
                    font-size: 1rem;
                }
                .calendar-day.today {
                    background: rgba(79, 70, 229, 0.05);
                }
                .calendar-day.today .day-number {
                    color: white;
                    background: var(--primary-color);
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                .event-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--primary-color);
                    border-radius: 50%;
                    position: absolute;
                    top: 10px;
                    right: 10px;
                }
                .event-preview {
                    background: rgba(79, 70, 229, 0.1);
                    color: var(--primary-color);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    border-left: 3px solid var(--primary-color);
                }
                .event-preview .event-time {
                    display: inline-block;
                    margin-right: 0.4rem;
                    font-weight: 700;
                    font-size: 0.7rem;
                }
                .event-preview.exam {
                    background: rgba(239, 68, 68, 0.12);
                    color: var(--danger-color);
                    border-left-color: var(--danger-color);
                }
                .event-preview.important {
                    background: rgba(245, 158, 11, 0.12);
                    color: var(--warning-color);
                    border-left-color: var(--warning-color);
                }

                @media (max-width: 640px) {
                    .calendar-page {
                        height: auto;
                    }
                    .calendar-header-actions {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.75rem;
                    }
                    .calendar-header-actions h1 {
                        font-size: 1.1rem;
                    }
                    .calendar-nav {
                        width: 100%;
                        justify-content: space-between;
                        padding: 0.4rem 0.6rem;
                    }
                    .calendar-nav h2 {
                        font-size: 0.95rem;
                        min-width: auto;
                    }
                    .calendar-grid {
                        grid-auto-rows: minmax(72px, 1fr);
                    }
                    .day-name {
                        padding: 0.5rem 0.25rem;
                        font-size: 0.65rem;
                        letter-spacing: 0.02em;
                    }
                    .calendar-day {
                        padding: 0.4rem;
                        gap: 0.25rem;
                    }
                    .day-number {
                        font-size: 0.85rem;
                    }
                    .event-preview {
                        font-size: 0.65rem;
                        padding: 0.2rem 0.35rem;
                    }
                }
            `,
        }}
      />
    </div>
  );
};

export default Calendar;
