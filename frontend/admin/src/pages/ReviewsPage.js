import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function ReviewsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/reviews')
      .then(r => setItems(r.data.data || []))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Reviews</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {items.map(r => <li key={r._id}>{r._id} — {r.rating}</li>)}
      </ul>
    </div>
  );
}
