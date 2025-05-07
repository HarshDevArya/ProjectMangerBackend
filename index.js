require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const morgan = require("morgan");

// db + routes (all now use require)
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const commentRoutes = require("./routes/comment");
const searchRoutes = require("./routes/search");

const app = express();

/* ---------------------- middleware ---------------------- */
// app.use(morgan("tiny"));
app.use(express.json());
app.use(
  cors({
    origin: "https://project-manger-front-end.vercel.app",
    credentials: true,
  })
);
// app.use(express.json());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
app.use(cookieParser());

/* ----------------------- routes ------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
// comments nested router still works in CommonJS
app.use("/api/projects/:projectId/comments", commentRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (_, res) => res.send("API is running"));

/* ----------------------- start ------------------------- */
(async () => {
  await connectDB();
  app.listen(process.env.PORT || 5000, () =>
    console.log(`Server listening on http://localhost:${process.env.PORT}`)
  );
})();
