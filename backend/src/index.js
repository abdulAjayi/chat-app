require("dotenv").config();
const server = require("./app");

// 3000 is commonly occupied by a separate local API; use 3001 for this app's default.
const port = process.env.PORT || 3001;
server.listen(port, () => console.log(`Backend listening on port ${port}`));
