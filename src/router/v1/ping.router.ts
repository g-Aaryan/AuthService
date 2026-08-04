import { pingHandler } from "../../controller/ping.controller";
import express from "express";
import { validateRequestBody } from "../../validators";
import { pingSchema } from "../../validators/ping.validator";


const pingRouter = express.Router()
pingRouter.get('/',validateRequestBody(pingSchema),pingHandler);
pingRouter.get('/health',validateRequestBody(pingSchema),(req,res)=>{
    res.status(200).send('OK')
}) 
export default pingRouter;

