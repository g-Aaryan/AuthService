import dotenv from 'dotenv';
type Serveconfig ={
    PORT:number
    DB_URL:string
    ACCESS_TOKEN_SECRET:string
    REFRESH_TOKEN_SECRET:string
    EMAIL_USER:string
    EMAIL_PASSWORD:string
    GOOGLE_CLIENT_ID:string
    GOOGLE_CLIENT_SECRET:string
    GOOGLE_REDIRECT_URI:string
}

function loadenv(){
    dotenv.config();
    console.log("Env variables loaded")
}

loadenv();

export const serverconfig:Serveconfig={
    PORT:Number(process.env.PORT)||3008,
    DB_URL:process.env.DB_URL||"mongodb://localhost:27017/auth_db",
    ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET||"default_access_token_secret",
    REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET||"default_refresh_token_secret",
    EMAIL_USER:process.env.EMAIL_USER||"default_email_user",
    EMAIL_PASSWORD:process.env.EMAIL_PASSWORD||"default_email_password",
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID||"default_google_client_id",
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET||"default_google_client_secret",
    GOOGLE_REDIRECT_URI:process.env.GOOGLE_REDIRECT_URI||"http://localhost:3008/api/v1/auth/google/callback",
}