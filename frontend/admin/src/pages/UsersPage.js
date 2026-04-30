import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data.data || []))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Users</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {users.map(u => <li key={u._id}>{u.name} — {u.email}</li>)}
      </ul>
    </div>
  );
}
