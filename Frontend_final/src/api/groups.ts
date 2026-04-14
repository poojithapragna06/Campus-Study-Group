// All endpoints match groupRoutes.js exactly
// Body field names match groupChatController.js exactly

// GET http://localhost:5000/api/groups/my → { status: 'ok', result: GroupChat[] }
export async function apiFetchMyGroups() {
  const res = await fetch('http://localhost:5000/api/groups/my',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${localStorage.getItem("token")}`,},
  });
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

// GET http://localhost:5000/api/groups/admin → { status: 'ok', result: GroupChat[] }
export async function apiFetchAdminGroups() {
  const res = await fetch('http://localhost:5000/api/groups/admin',{
    method: 'GET',
    headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${localStorage.getItem("token")}`,},
  });
  if (!res.ok) throw new Error('Failed to fetch admin groups');
  return res.json();
}

// POST http://localhost:5000/api/groups/chat { group_id } → { status: 'ok', result: Message[] }
export async function apiFetchGroupChat(groupId: string) {
  const res = await fetch('http://localhost:5000/api/groups/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' ,authorization: `Bearer ${localStorage.getItem("token")}`,},
    body: JSON.stringify({ group_id: groupId }),
  });
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json();
}

// POST http://localhost:5000/api/groups/join { groupChatId } → { status: 'success'|'errored', result, error }
// 409 = already in group or request already exists
export async function apiJoinGroup(groupChatId: string) {
  const res = await fetch('http://localhost:5000/api/groups/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify({ groupChatId }), // controller reads req.body.groupChatId
  });
  return res.json(); // don't throw — caller checks status field
}

// POST http://localhost:5000/api/groups/requests { groupId } → { status: 'ok', result: JoinRequest[] }
export async function apiFetchJoinRequests(groupId: string) {
  const res = await fetch('http://localhost:5000/api/groups/requests', {
    method: 'POST',
       headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify({ groupId }),
  });
  if (!res.ok) throw new Error('Failed to fetch requests');
  return res.json();
}

// POST http://localhost:5000/api/groups/accept-request { groupId, requesterId } → { status: 'ok' }
export async function apiAcceptJoinRequest(groupId: string, requesterId: string) {
  const res = await fetch('http://localhost:5000/api/groups/accept-request', {
    method: 'POST',
      headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify({ groupId, requesterId }),
  });
  if (!res.ok) throw new Error('Failed to accept request');
  return res.json();
}

// POST http://localhost:5000/api/groups/search { query } → { status: 'ok', result: GroupChat | GroupChat[] }
export async function apiSearchGroups(query: string) {
  const res = await fetch('http://localhost:5000/api/groups/search', {
    method: 'POST',
     headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

// POST http://localhost:5000/api/groups/create-group → { status: 'success', result: GroupChat }
// Controller creates group with userId as first admin + member
// group_name, requires_permission must be set separately or via a patch endpoint
export async function apiCreateGroup(payload: {
  group_name: string;
  requires_permission: boolean;
}) {
  const res = await fetch('http://localhost:5000/api/groups/create-group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json(); // { status: 'success', result: newGroup }
}

// POST http://localhost:5000/api/groups/delete-group { groupChatId } → { status: 'successful', result }
// Only admins can delete — backend enforces this
export async function apiDeleteGroup(groupChatId: string) {
  const res = await fetch('http://localhost:5000/api/groups/delete-group', {
    method: 'POST',
      headers: { 'Content-Type': 'application/json',authorization: `Bearer ${localStorage.getItem("token")}`, },
    body: JSON.stringify({ groupChatId }),
  });
  if (!res.ok) throw new Error('Failed to delete group');
  return res.json();
}