import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function BookingsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/bookings')
      .then(r => setItems(r.data.data || []))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Bookings</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {items.map(b => <li key={b._id}>{b._id} — {b.status}</li>)}
      </ul>
    </div>
  );
}
