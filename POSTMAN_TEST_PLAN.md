## PHASE 1: Registration & Email Activation

### Step 1: User Registration
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/register`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "name": "Postman Tester",
      "email": "{{email}}",
      "password": "{{password}}"
    }
    ```
*   **Expected Response**: `201 Created`
*   **Expected Body**:
    ```json
    {
      "success": true,
      "message": "User registered successfully, please verify your email",
      "data": {
        "id": "6a7322...",
        "name": "Postman Tester",
        "email": "tester@example.com"
      }
    }
    ```

---

### Step 2: Retrieve OTP from Redis
Because email services are mocked or sent in background pipelines, retrieve the generated 6-digit OTP code:
*   Connect to your Redis instance (`redis-cli`).
*   Query the user's OTP using their MongoDB User ID (available in the registration response `data.id`):
    ```bash
    get verify:<USER_ID_FROM_STEP_1>
    ```
*   Copy the OTP code from the console or brute-force check the SHA-256 hash. Save this code into your Postman environment under the variable `otp`.

---

### Step 3: Verify Email
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/verify`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "{{email}}",
      "otp": "{{otp}}"
    }
    ```
*   **Expected Response**: `200 OK`
*   **Expected Body**:
    ```json
    {
      "success": true,
      "message": "Email verified successfully"
    }
    ```

---

## PHASE 2: Authentication & Token Management

### Step 4: Login (Standard Credentials)
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/login`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "{{email}}",
      "password": "{{password}}"
    }
    ```
*   **Expected Response**: `200 OK`
*   **Expected Body**:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "accessToken": "eyJhbGciOiJI..."
      }
    }
    ```
*   **Test Script (Postman Tests Tab)**:
    Add this script to automatically save the access token:
    ```javascript
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.accessToken) {
        pm.environment.set("accessToken", jsonData.data.accessToken);
        pm.test("Access Token saved to Environment", function () {
            pm.expect(pm.environment.get("accessToken")).to.not.be.undefined;
        });
    }
    ```

---

### Step 5: Check Active Sessions List
*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/auth/sessions`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Verification**: Verify that the list contains exactly **1 active session** representing this login.

---

### Step 6: Token Refresh (Rotation Check)
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/refresh`
*   **Headers**: None.
*   **Cookies**: Postman automatically includes the `refreshToken` cookie stored from Step 4.
*   **Expected Response**: `200 OK` (returns a new Access Token in the body and sets a new rotated Refresh Token in the cookie).
*   **Test Script (Postman Tests Tab)**:
    Save the new rotated access token:
    ```javascript
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.accessToken) {
        pm.environment.set("accessToken", jsonData.data.accessToken);
        pm.test("Rotated Access Token saved to Environment", function () {
            pm.expect(pm.environment.get("accessToken")).to.not.be.undefined;
        });
    }
    ```

---

### Step 7: Verify Rotation
*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/auth/sessions`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Verification**: Confirm access is granted using the rotated access token.

---

## PHASE 3: Password Recovery & Security Enforcement

### Step 8: Request Password Reset OTP
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/forgot-password`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "{{email}}"
    }
    ```
*   **Expected Response**: `200 OK`
*   **Verification**: Retrieve the new reset OTP hash from Redis:
    ```bash
    get verify:<USER_ID>
    ```
    Save the new OTP code into your Postman environment under the variable `otp`.

---

### Step 9: Reset Password (Updates Credentials & Revokes Sessions)
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/reset-password`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "{{email}}",
      "otp": "{{otp}}",
      "password": "{{newPassword}}"
    }
    ```
*   **Expected Response**: `200 OK`

---

### Step 10: Security Check (Fails Check on Revoked Tokens)
Try to call the active sessions endpoint using your old `accessToken` variable:
*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/auth/sessions`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}` (Contains the old access token)
*   **Expected Response**: `401 Unauthorized`
*   **Verification**: Confirms that resetting the password successfully logged out all devices.

---

### Step 11: Login with New Password
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/login`
*   **Headers**: 
    *   `Content-Type: application/json`
*   **Request Body (JSON)**:
    ```json
    {
      "email": "{{email}}",
      "password": "{{newPassword}}"
    }
    ```
*   **Expected Response**: `200 OK`
*   **Verification**: Access token is saved under `accessToken` dynamically.

---

## PHASE 4: Device & Session Control

### Step 12: Generate a Second Device Session
Simulate logging in from a second device (like a mobile client or different browser):
*   Run the Login request from **Step 11** once more.
*   This establishes a second active session.

---

### Step 13: View Active Sessions List
*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/auth/sessions`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Verification**: Verify that the list contains **2 active sessions**. Copy the `id` of the *first* session and save it under the environment variable `sessionId`.

---

### Step 14: Revoke Second Device Session
*   **Method**: `DELETE`
*   **URL**: `{{baseUrl}}/auth/sessions/{{sessionId}}`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Expected Body**:
    ```json
    {
      "success": true,
      "message": "Session revoked successfully"
    }
    ```

---

### Step 15: Verify Session List Reduced
*   **Method**: `GET`
*   **URL**: `{{baseUrl}}/auth/sessions`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Verification**: Verify that the session count has decreased from 2 back to **1**.

---

### Step 16: Logout All Devices (Clean Exit)
*   **Method**: `POST`
*   **URL**: `{{baseUrl}}/auth/logout-all`
*   **Headers**: 
    *   `Authorization: Bearer {{accessToken}}`
*   **Expected Response**: `200 OK`
*   **Verification**: Try fetching sessions once more using `/sessions` -> must return `401 Unauthorized`.

---

## PHASE 5: Testing Google OAuth (Hybrid Local Flow)

To test the OAuth flow, follow these steps to exchange codes inside Postman:

1.  Open your browser (Chrome/Safari) and navigate to:
    ```
    http://localhost:3008/api/v1/auth/google
    ```
2.  Log in using Google Credentials.
3.  Upon success, Google redirects back to:
    ```
    http://localhost:3008/api/v1/auth/google/callback?code=4/0AdQt8q...
    ```
4.  Copy the `code` query parameter value from the browser's address bar.
5.  In Postman, prepare the callback request:
    *   **Method**: `GET`
    *   **URL**: `{{baseUrl}}/auth/google/callback?code=<PASTE_CODE_HERE>`
6.  **Expected Response**: `200 OK` (returns access token and sets the refresh token cookie).
