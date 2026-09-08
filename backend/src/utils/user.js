const users = [];

function addUser({ id, username, room }) {
  // Normalize before validation so a name containing only spaces cannot join.
  const user = typeof username === "string" ? username.trim().toLowerCase() : "";
  const group = typeof room === "string" ? room.trim().toLowerCase() : "";

  if (!user || !group) {
    return { error: "A username and room must be provided" };
  }

  const existingUser = users.find(
    (eachUser) => eachUser.user === user && eachUser.group === group,
  );
  if (existingUser) {
    return { error: "That username is already in this room" };
  }

  const userData = { id, user, group };
  users.push(userData);
  return { userData };
}

function removeUser(id) {
  const index = users.findIndex((eachUser) => eachUser.id === id);
  return index === -1 ? undefined : users.splice(index, 1)[0];
}

function getUsers(id) {
  return users.find((eachUser) => eachUser.id === id);
}

function getInRoom(room) {
  return users.filter((eachUser) => eachUser.group === room);
}

module.exports = { addUser, removeUser, getUsers, getInRoom };
