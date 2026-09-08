import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(timestamp);
}

function MessageItem({ message, currentUser }) {
  const isSystem = message.username === "Admin";
  const isMine = !isSystem && message.username === currentUser;
  const type = message.location ? "location" : "text";

  return (
    <article className={`message message--${type} ${isSystem ? "message--system" : ""} ${isMine ? "message--mine" : ""}`}>
      <div className="message__meta">
        <span className="message__name">{message.username}</span>
        <time className="message__time" dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
      </div>
      {message.location ? (
        <a className="message__location" href={message.location} target="_blank" rel="noreferrer">Open shared location</a>
      ) : (
        <p className="message__text">{message.text}</p>
      )}
    </article>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedUsername = params.get("username") || "";
  const requestedRoom = params.get("room") || "";
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState({ room: requestedRoom, users: [] });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesRef.current?.lastElementChild?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  function trackScroll() {
    const element = messagesRef.current;
    if (!element) return;
    // A small threshold preserves reading position while still following an active conversation.
    shouldScrollRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 56;
  }

  // Store the connected socket on the component instance without triggering UI work.
  const socketRef = useRef(null);
  useEffect(() => {
    if (!requestedUsername.trim() || !requestedRoom.trim()) {
      navigate("/", { replace: true });
      return undefined;
    }
    const socket = io(socketUrl);
    socketRef.current = socket;
    socket.on("message", (message) => setMessages((items) => [...items, message]));
    socket.on("location-message-template", (message) => setMessages((items) => [...items, message]));
    socket.on("showSidebar", (info) => setRoomInfo(info));
    socket.on("connect_error", () => setError("Could not connect to the chat server. Please try again."));
    socket.emit("join", { username: requestedUsername, room: requestedRoom }, (joinError) => {
      if (joinError) navigate(`/?error=${encodeURIComponent(joinError)}`, { replace: true });
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [navigate, requestedRoom, requestedUsername]);

  function handleSend(event) {
    event.preventDefault();
    if (!draft.trim() || !socketRef.current) return;
    setIsSending(true);
    setError("");
    socketRef.current.emit("sendMessage", draft, (sendError) => {
      setIsSending(false);
      if (sendError) return setError(sendError);
      setDraft("");
      inputRef.current?.focus();
    });
  }

  function handleLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    if (!socketRef.current?.connected) {
      setError("You are not connected to the chat server.");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        socketRef.current.emit("location", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }, (locationError) => {
          setIsLocating(false);
          if (locationError) setError(locationError);
        });
      },
      (positionError) => {
        setIsLocating(false);
        setError(positionError.message || "Could not retrieve your location.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 },
    );
  }

  return (
    <main className="main-container">
      <aside className="side-bar" aria-label="Room participants">
        <div className="sidebar-mark" aria-hidden="true">R</div>
        <div className="sidebar-content">
          <p className="sidebar-label">Room</p>
          <h1 className="sidebar-room">{roomInfo.room}</h1>
          <p className="sidebar-label sidebar-label--users">Users</p>
          <ul className="sidebar-users">{roomInfo.users.map((user) => <li className="sidebar-user" key={user.id}>{user.user}</li>)}</ul>
        </div>
      </aside>
      <section className="chat-container" aria-label={`Chat room ${roomInfo.room}`}>
        <header className="chat-header"><span className="chat-title">Room chat</span></header>
        <div className="messages" ref={messagesRef} onScroll={trackScroll} aria-live="polite">
          {messages.map((message, index) => <MessageItem key={`${message.createdAt}-${index}`} message={message} currentUser={requestedUsername.trim().toLowerCase()} />)}
        </div>
        <footer className="chat-footer">
          {error && <p className="chat-error" role="alert">{error}</p>}
          <form className="form" onSubmit={handleSend}>
            <input ref={inputRef} className="input" name="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message" autoComplete="off" disabled={isSending} />
            <button className="btn btn--send" disabled={isSending || !draft.trim()}>{isSending ? "Sending…" : "Send"}</button>
            <button className="btn btn--location" type="button" onClick={handleLocation} disabled={isLocating}>{isLocating ? "Locating…" : "Send location"}</button>
          </form>
        </footer>
      </section>
    </main>
  );
}
