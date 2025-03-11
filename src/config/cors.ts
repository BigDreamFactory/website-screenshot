import { Express } from 'express'
import cors from 'cors'

const allowCors = process.env.ALLOW_CORS || '[]'

const corsOptions = {
  origin: JSON.parse(allowCors),
  optionsSuccessStatus: 200
}

const loadCORS = (app: Express) => {
  app.use(cors(corsOptions))
}

export default loadCORS
