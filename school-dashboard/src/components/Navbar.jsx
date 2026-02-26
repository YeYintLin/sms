import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  PanelRight,
  Bell,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme.jsx";
import { usePermissions } from "../hooks/usePermissions";
import { useLocale } from "../hooks/useLocale.jsx";
import api from "../utils/api";
import MessageModal from "./MessageModal";
import "../styles/components.css";

const Navbar = ({ onLogout, onToggleSidebar, onToggleRightSidebar, isRightSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [messageNotifs, setMessageNotifs] = useState([]);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageContacts, setMessageContacts] = useState([]);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userName, userRole } = usePermissions();
  const { locale, setLocale, t } = useLocale();

  const groupedMessageNotifs = useMemo(() => {
    const map = new Map();
    for (const item of messageNotifs) {
      const senderId = item.sender?._id || "unknown";
      const existing = map.get(senderId);
      const createdAt = new Date(item.createdAt);
      if (!existing || createdAt > new Date(existing.createdAt)) {
        map.set(senderId, {
          ...item,
          count: existing ? existing.count + 1 : 1,
          unreadCount: (existing?.unreadCount || 0) + (item.isUnread ? 1 : 0),
        });
      } else {
        existing.count += 1;
        if (item.isUnread) existing.unreadCount += 1;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [messageNotifs]);

  const loadMessageNotifs = async () => {
    try {
      const res = await api.get("/messages/unread");
      setMessageUnreadCount(res.data?.count || 0);
      setMessageNotifs(res.data?.items || []);
    } catch (err) {
      // silent
    }
  };

  const loadMessageContacts = async () => {
    setIsContactsLoading(true);
    try {
      const res = await api.get("/messages/contacts");
      setMessageContacts(res.data?.contacts || []);
    } catch (err) {
      // silent
    } finally {
      setIsContactsLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    if (messageContacts.length > 0) return;
    loadMessageContacts();
  }, [isDropdownOpen, messageContacts.length]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const startOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const endOfWeek = (date) => {
      const d = startOfWeek(date);
      d.setDate(d.getDate() + 6);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const parseDateKey = (key) => {
      const parts = String(key).split("-").map((n) => Number(n));
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
      const [y, m, d] = parts;
      return new Date(y, m - 1, d);
    };

    const formatDate = (date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const loadNotifications = () => {
      const savedEvents = localStorage.getItem("calendar_events");
      const calendarNotes = savedEvents ? JSON.parse(savedEvents) : {};
      const today = new Date();
      const thisWeekStart = startOfWeek(today);
      const nextWeekEnd = endOfWeek(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
      );

      const weekNotes = Object.entries(calendarNotes)
        .map(([key, entry]) => {
          const date = parseDateKey(key);
          const note = entry?.note ?? entry;
          const type = entry?.type ?? "note";
          const startTime = entry?.startTime || "";
          const endTime = entry?.endTime || "";
          return date ? { key, date, note, type, startTime, endTime } : null;
        })
        .filter(Boolean)
        .filter(({ date }) => date >= thisWeekStart && date <= nextWeekEnd)
        .sort((a, b) => a.date - b.date);

      const importantNotes = weekNotes
        .filter(({ type }) => type === "important")
        .map((item) => ({
          ...item,
          label: item.note,
          dateLabel: formatDate(item.date),
        }));

      setNotifItems(importantNotes);
    };

    loadNotifications();
    loadMessageNotifs();
    const handleStorage = (e) => {
      if (e.key === "calendar_events") loadNotifications();
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(() => {
      loadMessageNotifs();
    }, 30000);
    const onFocus = () => loadMessageNotifs();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);

  const fetchSearchData = async () => {
    if (students.length || teachers.length || parents.length || classes.length) return;
    setIsSearching(true);
    try {
      const [studentsRes, teachersRes, parentsRes, classesRes] = await Promise.allSettled([
        api.get("/students"),
        api.get("/teachers"),
        api.get("/parents"),
        api.get("/classes"),
      ]);
      if (studentsRes.status === "fulfilled") {
        setStudents(
          studentsRes.value.data.map((s) => ({
            ...s,
            name: s.userId?.name,
            email: s.userId?.email,
          }))
        );
      }
      if (teachersRes.status === "fulfilled") {
        setTeachers(
          teachersRes.value.data.map((t) => ({
            ...t,
            name: t.userId?.name,
            email: t.userId?.email,
          }))
        );
      }
      if (parentsRes.status === "fulfilled") {
        setParents(
          parentsRes.value.data.map((p) => ({
            ...p,
            name: p.userId?.name,
            email: p.userId?.email,
          }))
        );
      }
      if (classesRes.status === "fulfilled") {
        setClasses(classesRes.value.data || []);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    students
      .filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.grade?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((s) =>
        results.push({
          label: s.name || s.studentId,
          meta: `${t("navbar.student")} • ${s.studentId || "—"} • ${s.grade || ""}`.trim(),
          onClick: () => navigate(`/students/${s.studentId}`),
        })
      );

    teachers
      .filter(
        (teacher) =>
          teacher.name?.toLowerCase().includes(q) ||
          teacher.email?.toLowerCase().includes(q) ||
          teacher.subject?.toLowerCase().includes(q) ||
          teacher.grade?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((teacher) =>
        results.push({
          label: teacher.name || teacher.email,
          meta: `${t("navbar.teacher")} • ${teacher.subject || "—"} • ${teacher.grade || ""}`.trim(),
          onClick: () => navigate(`/teachers/${teacher._id}`),
        })
      );

    parents
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.parentId?.toLowerCase().includes(q) ||
          p.studentId?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((p) =>
        results.push({
          label: p.name || p.parentId,
          meta: `${t("navbar.parent")} • ${p.parentId || "—"} • ${p.studentId || ""}`.trim(),
          onClick: () => navigate(`/parents`),
        })
      );

    classes
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.schedule?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((c) =>
        results.push({
          label: c.name || t("navbar.class"),
          meta: `${t("navbar.class")} • ${c.schedule || "—"}`, 
          onClick: () => navigate(`/classes`),
        })
      );

    return results.slice(0, 10);
  }, [searchQuery, students, teachers, parents, classes, navigate, t]);

  return (
    <header className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <button
          className="icon-btn mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* CENTER */}
      <div className="navbar-center">
        <div className="search-container" ref={searchRef}>
          <Search size={18} />
          <input
            type="text"
            placeholder={t("navbar.search_placeholder")}
            value={searchQuery}
            onFocus={() => {
              setIsSearchOpen(true);
              fetchSearchData();
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
          />
          {isSearchOpen && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)",
                maxHeight: "300px",
                overflowY: "auto",
                zIndex: 200,
              }}
            >
              {isSearching && (
                <div style={{ padding: "0.75rem", color: "var(--text-muted)" }}>
                  {t("common.loading")}
                </div>
              )}
              {!isSearching && searchQuery.trim() === "" && (
                <div style={{ padding: "0.75rem", color: "var(--text-muted)" }}>
                  {t("navbar.start_typing")}
                </div>
              )}
              {!isSearching && searchQuery.trim() !== "" && searchResults.length === 0 && (
                <div style={{ padding: "0.75rem", color: "var(--text-muted)" }}>
                  {t("navbar.no_results")}
                </div>
              )}
              {!isSearching &&
                searchResults.map((item, idx) => (
                  <button
                    key={`${item.label}-${idx}`}
                    onClick={() => {
                      item.onClick();
                      setIsSearchOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.meta}</div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">
        <button
          onClick={onToggleRightSidebar}
          className="icon-btn desktop-only-action"
          aria-label="Toggle right sidebar"
          title={isRightSidebarOpen ? t("navbar.hide_panel") : t("navbar.show_panel")}
        >
          <PanelRight size={20} />
        </button>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          aria-label="Language"
          style={{
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
            borderRadius: 8,
            padding: "0.3rem 0.45rem"
          }}
        >
          <option value="en">{t("language.en")}</option>
          <option value="mm">{t("language.mm")}</option>
        </select>
        <div className="navbar-notif" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label={t("navbar.notifications")}
            title={t("navbar.notifications")}
            onClick={() => setIsNotifOpen((prev) => !prev)}
          >
            <Bell size={20} />
            {messageUnreadCount > 0 && (
              <span className="icon-badge">
                {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
              </span>
            )}
          </button>
          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">{t("navbar.notifications")}</div>
              {groupedMessageNotifs.length > 0 && (
                <div className="notif-section">
                  <div className="notif-section-title">{t("navbar.messages")}</div>
                  <div className="notif-list">
                    {groupedMessageNotifs.map((item) => (
                      <button
                        key={item.id}
                        className={`notif-item ${item.isUnread ? "unread" : "read"}`}
                        type="button"
                        onClick={() => {
                          if (item.sender?._id) {
                            setMessageTarget({
                              id: item.sender._id,
                              name: item.sender.name || t("common.user"),
                            });
                            setIsMessageOpen(true);
                            setIsNotifOpen(false);
                          }
                        }}
                      >
                        <div className="notif-item-date">
                          {item.sender?.name || t("common.user")}
                          <span className="notif-count">
                            {item.unreadCount > 0 ? t("navbar.new_count", { count: item.unreadCount }) : t("navbar.msg_count", { count: item.count })}
                          </span>
                        </div>
                        <div className="notif-item-title">{item.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {notifItems.length === 0 ? (
                <div className="notif-empty">{t("navbar.no_important_items")}</div>
              ) : (
                <div className="notif-list">
                  {notifItems.map(({ key, dateLabel, label, startTime, endTime }) => (
                    <button key={key} className="notif-item" type="button">
                      <div className="notif-item-date">
                        {dateLabel}
                        {(startTime || endTime) ? ` - ${startTime || "--:--"}${endTime ? ` - ${endTime}` : ""}` : ""}
                      </div>
                      <div className="notif-item-title">{label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className={`icon-btn theme-toggle navbar-theme-toggle ${theme}`}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div
          className="navbar-user"
          ref={dropdownRef}
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
          }}
        >
          <div className="navbar-avatar">
            <span>{userName?.[0] || "U"}</span>
          </div>

          <div className="navbar-user-meta">
            <span className="navbar-user-name">{userName || t("common.user")}</span>
            <span className="navbar-user-role">{userRole || "member"}</span>
          </div>

          <ChevronDown
            size={16}
            className={`navbar-user-chevron ${
              isDropdownOpen ? "open" : ""
            }`}
          />

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-title">{t("navbar.messages")}</div>
                {isContactsLoading && (
                  <div className="dropdown-empty">{t("navbar.loading_contacts")}</div>
                )}
                {!isContactsLoading && messageContacts.length === 0 && (
                  <div className="dropdown-empty">{t("navbar.no_contacts")}</div>
                )}
                {!isContactsLoading && messageContacts.length > 0 && (
                  <div className="dropdown-list">
                    {messageContacts.map((c) => (
                      <button
                        key={c.id}
                        className="dropdown-contact"
                        onClick={() => {
                          setMessageTarget({ id: c.id, name: c.name });
                          setIsMessageOpen(true);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="dropdown-contact-name">{c.name}</span>
                        <span className="dropdown-contact-meta">
                          {c.role}{c.grade ? ` • ${c.grade}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="dropdown-item"
                onClick={() => navigate("/profile")}
              >
                <User size={16} />
                {t("common.profile")}
              </button>

              <button
                className="dropdown-item logout"
                onClick={onLogout}
              >
                <LogOut size={16} />
                {t("common.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
      {messageTarget && (
        <MessageModal
          isOpen={isMessageOpen}
          onClose={() => {
            setIsMessageOpen(false);
            loadMessageNotifs();
          }}
          otherUser={messageTarget}
        />
      )}
    </header>
  );
};

export default Navbar;


