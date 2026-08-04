import express from 'express';
import { serverconfig } from './config';
import v1router from './router/v1/index.router';
import v2router from './router/v2/index.router';
import { genericErrorHandler } from './middlewares/error.middleware';
import logger from './config/logger.config';
import { attachCorrelationIdMiddleware } from './middlewares/correlation.middleware';
const app = express();

app.use(express.json());

app.use(attachCorrelationIdMiddleware);
app.use('/api/v1',v1router)
app.use('/api/v2',v2router)

app.use(genericErrorHandler);


app.listen(serverconfig.PORT,()=>{
    logger.info(`server is listening on the port ${serverconfig.PORT}`);
})