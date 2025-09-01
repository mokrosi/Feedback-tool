# Feedback Tool API Documentation

This document provides comprehensive information about all API endpoints available in the Feedback Tool application.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [User Management](#user-management)
- [Survey Management](#survey-management)
- [Response Management](#response-management)
- [Answer Management](#answer-management)
- [Error Handling](#error-handling)

## 🌐 Base URL

```
http://localhost:8080
```

## 🔐 Authentication

The API uses JWT-based role authentication. Some endpoints require specific roles:

- **Public**: No authentication required
- **ADMIN**: Requires admin role authentication

### Login

Authenticates a user and returns a JWT token for accessing protected endpoints.

**Endpoint:** `POST /auth/login`  
**Authentication:** Public (No authentication required)

#### Request Body

```json
{
  "email": "string",
  "password": "string"
}
```

#### Response

```json
{
  "token": "string",
  "email": "string",
  "name": "string",
  "role": "string",
  "id": "number"
}
```

#### Use Cases

- User authentication
- Obtaining JWT token for protected endpoints
- Role-based access verification

#### Example Usage

After successful login, include the JWT token in the Authorization header for protected endpoints:

```
Authorization: Bearer <your-jwt-token>
```

---

## 👥 User Management

### Create User

Creates a new user account in the system.

**Endpoint:** `POST /users/create`  
**Authentication:** Public (No authentication required)

#### Request Body

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

#### Response

```json
{
  "id": "number",
  "name": "string",
  "email": "string",
  "role": "string",
  "createdAt": "datetime"
}
```

#### Use Cases

- User registration
- Admin creating new accounts
- Initial system setup

---

## 📊 Survey Management

### Create Survey

Creates a new survey with questions for collecting feedback.

**Endpoint:** `POST /surveys/create`  
**Authentication:** ADMIN role required

#### Request Body

```json
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "questionText": "string",
      "questionType": "MULTIPLE_CHOICE | TEXT | RATING",
      "options": ["option1", "option2"] // for MULTIPLE_CHOICE only
    }
  ],
  "isActive": true
}
```

#### Response

```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "number",
      "questionText": "string",
      "questionType": "string",
      "options": ["string"]
    }
  ],
  "isActive": true,
  "createdAt": "datetime"
}
```

#### Use Cases

- Creating customer feedback surveys
- Employee satisfaction surveys
- Product evaluation forms
- Event feedback collection

---

## 📝 Response Management

### Get All Responses

Retrieves all survey responses from the system.

**Endpoint:** `GET /responses`  
**Authentication:** Public

#### Response

```json
[
  {
    "id": "number",
    "surveyId": "number",
    "userId": "number",
    "submittedAt": "datetime",
    "answers": [
      {
        "questionId": "number",
        "answerText": "string"
      }
    ]
  }
]
```

### Get Response by ID

Retrieves a specific survey response by its ID.

**Endpoint:** `GET /responses/{id}`  
**Authentication:** Public

#### Path Parameters

- `id` (number): The unique identifier of the response

#### Response

```json
{
  "id": "number",
  "surveyId": "number",
  "userId": "number",
  "submittedAt": "datetime",
  "answers": [
    {
      "questionId": "number",
      "answerText": "string"
    }
  ]
}
```

### Create Response

Submits a new survey response.

**Endpoint:** `POST /responses`  
**Authentication:** Public

#### Request Body

```json
{
  "surveyId": "number",
  "userId": "number",
  "answers": [
    {
      "questionId": "number",
      "answerText": "string"
    }
  ]
}
```

#### Response

```json
{
  "id": "number",
  "surveyId": "number",
  "userId": "number",
  "submittedAt": "datetime",
  "answers": [
    {
      "questionId": "number",
      "answerText": "string"
    }
  ]
}
```

### Delete Response

Removes a survey response from the system.

**Endpoint:** `DELETE /responses/{id}`  
**Authentication:** Public

#### Path Parameters

- `id` (number): The unique identifier of the response to delete

#### Response

```
204 No Content
```

#### Use Cases

- Survey response analysis
- Data export for reporting
- Response moderation
- User feedback management

---

## 💬 Answer Management

### Get All Answers

Retrieves all individual answers from the system.

**Endpoint:** `GET /api/answers`  
**Authentication:** Public  
**CORS:** Enabled for all origins

#### Response

```json
[
  {
    "id": "number",
    "questionId": "number",
    "responseId": "number",
    "answerText": "string",
    "createdAt": "datetime"
  }
]
```

### Create Answer

Adds a new individual answer to the system.

**Endpoint:** `POST /api/answers`  
**Authentication:** Public  
**CORS:** Enabled for all origins

#### Request Body

```json
{
  "questionId": "number",
  "responseId": "number",
  "answerText": "string"
}
```

#### Response

```json
{
  "id": "number",
  "questionId": "number",
  "responseId": "number",
  "answerText": "string",
  "createdAt": "datetime"
}
```

#### Use Cases

- Individual answer tracking
- Granular data analysis
- Frontend integration (CORS enabled)
- Real-time answer submission

---

## ⚠️ Error Handling

The API uses standard HTTP status codes and returns error responses in JSON format:

### Common Error Responses

#### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Validation failed for field 'email'",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions. ADMIN role required",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Response with id 123 not found",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

### Status Codes Reference

| Code | Meaning               | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 204  | No Content            | Resource deleted successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 500  | Internal Server Error | Server error                  |

---

_Last updated: August 17, 2025_
