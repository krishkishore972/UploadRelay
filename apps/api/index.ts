import express from "express"
import cors from "cors"
import uploadRoutes from "./routers/multiPartUploadRoute";

const app = express()

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
}));
app.use("/uploads", uploadRoutes);

app.listen(8000,() => {
    console.log("server is running on port 8000");
})
