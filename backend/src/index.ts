import express from "express";
import "dotenv/config";
import { authRouter } from "./routes/auth.routes.js";

const PORT = Number(process.env.PORT ?? 3000);
const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
  });
});

app.use(authRouter);

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
