import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import studentRoutes from './routes/studentRoutes'
import instructorRoutes from './routes/instructorRoutes'
import adminRoutes from './routes/adminRoutes'

import { startMembershipExpiryJob } from './cron/membershipExpiryJob'

dotenv.config()

const app = express()
const corsOptions = {
    credentials:true,
    origin:String(process.env.FRONTEND_URL),
    methods:"GET,POST,PUT,PATCH,DELETE,HEAD"
}

app.use(cookieParser())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api/student",studentRoutes)
app.use("/api/instructor",instructorRoutes)
app.use("/api/admin",adminRoutes)

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("💥 Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

const port:number = Number(process.env.PORT)

const start = async()=>{
    await connectDB()

    startMembershipExpiryJob();
    
    app.listen(port,()=>{
        console.log("server is running")
    })
}

start()