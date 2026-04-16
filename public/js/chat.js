const socket = io();
const form = document.querySelector(".form");
const formBtn = form.querySelector(".btn");
const formInput = form.querySelector(".input");
const locations = document.querySelector("#location");
const messages = document.querySelector("#messages");
const templateMessage = document.querySelector("#template-message").innerHTML;
const locationTemplate = document.querySelector(
  "#location-message-template",
).innerHTML;
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML;
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

function autoScroll() {
  const containerHeight = messages.scrollHeight;
  const newMessage = messages.lastElementChild;
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMarginBottom = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMarginBottom;
  const visibleHeight = messages.offsetHeight;
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset + 10) {
    messages.scrollTop = containerHeight;
  }
}

const sideBar = document.querySelector(".side-bar");
socket.on("message", (mesg) => {
  const html = Mustache.render(templateMessage, {
    username: mesg.username,
    message: mesg.text,
    time: moment(mesg.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("showSidebar", (RoomInfo) => {
  const html = Mustache.render(sideBarTemplate, {
    room: RoomInfo.room,
    users: RoomInfo.users,
  });
  sideBar.innerHTML = html;
});

socket.on("location-message-template", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.location,
    time: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  formBtn.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    formBtn.removeAttribute("disabled");
    if (error) {
      return console.log(error);
    }
    formInput.value = "";
    formInput.focus();
  });
});

locations.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("geolocation not available, please try another browser");
  }
  locations.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "location",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        locations.removeAttribute("disabled");
      },
    );
  });
});

socket.on("recieve", (msg) => {
  console.log(msg);
});

socket.emit(
  "join",
  {
    username,
    room,
  },
  (error) => {
    if (error) {
      alert(error);
      location.href = "/";
    }
  },
);
