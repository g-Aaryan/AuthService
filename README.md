# DevTrails Authentication Service

A robust, enterprise-grade authentication microservice built with **Node.js**, **Express**, **MongoDB**, **Redis**, and **TypeScript**. 

This service implements a hybrid authentication model (stateless JWT access tokens + stateful HttpOnly refresh token sessions) alongside standard security hardening features like Refresh Token Rotation (RTR), Replay Attack detection, account lockouts, dynamic CORS/Helmet middlewares, and Redis-backed rate limiters.

---

## 🚀 Key Features

*   **Secure Hybrid Token Model**: Short-lived Access Tokens (passed via memory/headers for CSRF protection) + Long-lived Refresh Tokens (secured in HttpOnly, Secure, SameSite=Strict cookies to neutralize XSS).
*   **Refresh Token Rotation (RTR)**: Generates a new access token and rotates the refresh token on every refresh call, keeping sessions secure.
*   **Session Replay Attack Detection**: Detects reuse of old refresh tokens, immediately revoking **every active session** associated with the compromised user account to mitigate breaches.
*   **Account Lockout Shield**: Locks accounts for 15 minutes after 5 consecutive failed login attempts to stop brute-force/dictionary attacks.
*   **Distributed Rate Limiting**: Redis-backed rate limiting configured for core paths (login rate limited to 5 requests/15 mins, OTP requests to 3 requests/15 mins). Includes fail-open checks to guarantee uptime.
*   **Redis OTP Infrastructure**: Email verification and password resets utilize Redis for fast lookup, automatic TTL expirations, and a 5-attempt submission cap.
*   **Google OAuth 2.0**: Native Google login redirect and profile callback flows. Handles profile creation and email verification linking.
*   **Active Session Management**: Enables users to query their active connections (IPs, user-agents, login times) and terminate specific device sessions or logout from all devices simultaneously.

---

## 🛠️ Technology Stack

*   **Runtime & Framework**: Node.js (v18+) & Express (v5.x for native async error handling)
*   **Language**: TypeScript (v5.x)
*   **Database**: MongoDB (via Mongoose ODM)
*   **In-Memory Store**: Redis (via ioredis client)
*   **Validation**: Zod (schema parser & request body validators)
*   **Security & Performance**: Helmet, CORS, Gzip Compression, Bcrypt
*   **Logging & Tracing**: Winston logs with daily file rotation and Correlation trace IDs

---

## 📁 Directory Structure

```text
├── src/
│   ├── config/              # Server setups, database connections, Redis client, Winston logs
│   ├── controller/          # HTTP request handlers & cookie controllers
│   ├── middlewares/         # JWT verifier, RBAC, Redis rate limiters, error handling
│   ├── models/              # Mongoose user and session schemas
│   ├── repositories/        # Direct database interaction queries
│   ├── router/              # API route definitions
│   ├── services/            # Core business logic, token generation, lockout mechanics
│   ├── types/               # TypeScript namespace extensions (e.g. req.user typings)
│   ├── utils/               # Bcrypt helpers, JWT signing, OTP generators, NodeMailer utils
│   └── server.ts            # Service entry point and middleware pipeline configurations
├── API_DOCUMENTATION.md     # Narrative technical manual for routes and mechanics
└── POSTMAN_TEST_PLAN.md     # Phase-by-phase Postman testing guide & test body payloads
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following services running locally or accessible in your network:
1.  **Node.js** (Version 18 or higher)
2.  **MongoDB** (Local instance or Atlas connection string)
3.  **Redis** (Port 6379)

### Installation

1.  Clone the repository and navigate to the project directory:
    ```bash
    cd AuthService
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```

### Configuration (`.env`)

Create a `.env` file in the root of the project and specify your configuration parameters:

```env
PORT=3008
DB_URL=mongodb://localhost:27017/auth_db
REDIS_HOST=localhost
REDIS_PORT=6379

ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here

EMAIL_USER=your_gmail_username@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3008/api/v1/auth/google/callback
```

---

## 💻 Script Commands

Run the following commands using npm:

*   **Development Server (Hot-Reloading)**:
    ```bash
    npm run dev
    ```
*   **Type Checking**:
    ```bash
    npx tsc --noEmit
    ```
*   **Build Project**:
    Compiles TypeScript files into JavaScript under the `/dist` output directory.
    ```bash
    npm run build
    ```
*   **Production Server**:
    Runs the compiled JavaScript project.
    ```bash
    npm start
    ```

---

## 🧪 Testing

The service includes detailed testing guides:
*   For testing all routes (Auth, Recovery, Sessions, OAuth) and request payloads manually in **Postman**, read the [Postman Test Plan](POSTMAN_TEST_PLAN.md).

