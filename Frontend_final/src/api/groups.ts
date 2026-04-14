export async function apiFetchMyGroups() {
  const res = await fetch('http://localhost:5000/api/groups/my',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem('token')}`},
  })
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json(); // { result: GroupChat[] }
}

export async function apiFetchAdminGroups() {
  const res = await fetch('http://localhost:5000/api/groups/admin',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem('token')}`},
  })
  if (!res.ok) throw new Error('Failed to fetch admin groups');
  return res.json();
}

export async function apiFetchGroupChat(groupId: string) {
  const res = await fetch('http://localhost:5000/api/groups/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
    body: JSON.stringify({ group_id: groupId }),
  });
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json(); // { result: messages[] }
}

export async function apiJoinGroup(group_chat_id: string) {
  const res = await fetch('http://localhost:5000/api/groups/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
    body: JSON.stringify({ group_chat_id }),
  });
  if (!res.ok) throw new Error('Failed to join');
  return res.json();
}

export async function apiFetchJoinRequests(groupId: string) {
  const res = await fetch('http://localhost:5000/api/groups/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
    body: JSON.stringify({ groupId }),
  });
  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json(); // { result: [{ group_chat_id, requester_id, email, username }] }
}

export async function apiAcceptJoinRequest(groupId: string, requesterId: string) {
  const res = await fetch('http://localhost:5000/api/groups/accept-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
    body: JSON.stringify({ groupId, requesterId }),
  });
  if (!res.ok) throw new Error('Failed to accept');
  return res.json();
}

export async function apiSearchGroups(query: string) {
  const res = await fetch('http://localhost:5000/api/groups/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem('token')}`},
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to search');
  return res.json(); // { result: GroupChat | GroupChat[] }
}