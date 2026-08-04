import dotenv from 'dotenv';
type Serveconfig ={
    PORT:number
}

function loadenv(){
    dotenv.config();
    console.log("Env variables loaded")
}

loadenv();

export const serverconfig:Serveconfig={
    PORT:Number(process.env.PORT)||3001
}