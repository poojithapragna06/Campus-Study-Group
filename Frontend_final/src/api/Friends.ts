export async function apiFetchFriends() {
  const token = localStorage.getItem("token");
  const res = await fetch('http://localhost:5000/api/friends/friendlist',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${token}`,},

  });
  
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
}

export async function apiFetchFriendRequests() {
  const token = localStorage.getItem("token");
  const res = await fetch('http://localhost:5000/api/friends/friendrequests',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${token}`,},
  });

  
  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

export async function apiSendFriendRequest(recieverId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch('http://localhost:5000/api/friends/sendrequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}`, },
    body: JSON.stringify({ recieverId }),
  });
  if (!res.ok) throw new Error('Failed to send request');
  return res.json();
}

export async function apiAcceptFriendRequest(senderId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch('http://localhost:5000/api/friends/acceptrequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}`, },
    body: JSON.stringify({ senderId }),
  });
  if (!res.ok) throw new Error('Failed to accept');
  return res.json();
}

export async function apiRejectFriendRequest(senderId: string, recieverId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch('http://localhost:5000/api/friends/rejectrequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}`, },
    body: JSON.stringify({ senderId, recieverId }),
  });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}

export async function apiSearchUsers(username: string) {
   const token = localStorage.getItem("token");
 const res = await fetch(`http://localhost:5000/api/friends/search?username=${encodeURIComponent(username)}`,{
    method: 'GET',
    headers: {  Authorization: `Bearer ${token}`,},

  });
          
  
  if (!res.ok) throw new Error('Failed to search');
  return res.json(); // { users: [{ userID, username }] }
}