const users = [];
function addUser({ id, username, room }) {
  if (!username || !room) {
    return {
      error: "A username and room must be provided",
    };
  }
  const user = username.toLowerCase();
  const group = room.trim().toLowerCase();

  const existingUser = users.findIndex((eachUser) => {
    return eachUser.user === user && eachUser.group === group;
  });
  if (existingUser !== -1) {
    return {
      error: "username and room already exist",
    };
  }
  const userData = { id, user, group };
  users.push(userData);
  return { userData };
}

function removeUser(id) {
  const user = users.findIndex((eachUser) => eachUser.id === id);
  if (user !== -1) {
    return users.splice(user, 1)[0];
  }
}

function getUsers(id) {
  const credentials = users.find((each) => each.id === id);
  return credentials;
}
function getInRoom(room) {
  const user = users.filter((eachUser) => eachUser.group === room);
  return user;
}
module.exports = {
  addUser,
  removeUser,
  getUsers,
  getInRoom,
};
