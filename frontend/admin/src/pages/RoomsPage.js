import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/rooms')
      .then(r => setRooms(r.data.data || []))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Rooms</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {rooms.map(r => <li key={r._id}>{r.roomNumber || r._id} — {r.type}</li>)}
      </ul>
    </div>
  );
}
