import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    // Query parameters keep the room URL refreshable and shareable without client-only route state.
    navigate(`/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`);
  }

  return (
    <main className="join-bg">
      <section className="join-card" aria-labelledby="join-title">
        <h1 id="join-title" className="join-title">Join a room</h1>
        {searchParams.get("error") && <p className="join-error" role="alert">{searchParams.get("error")}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Display name</label>
            <input className="form-input" id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Display name" autoComplete="nickname" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="room">Room</label>
            <input className="form-input" id="room" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Room" autoComplete="off" required />
          </div>
          <button className="join-btn" type="submit">Join room</button>
        </form>
      </section>
    </main>
  );
}
