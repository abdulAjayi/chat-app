function generateMessage(username, text) {
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
}

function generateLocationMessage(username, location) {
  return {
    username,
    location,
    createdAt: new Date().getTime(),
  };
}
module.exports = {
  generateMessage,
  generateLocationMessage,
};
