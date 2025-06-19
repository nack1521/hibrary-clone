# Library Management System API Documentation

## Overview

This is a NestJS application for a library management system with authentication, book borrowing, and category management functionality.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST `/auth/refresh`

Refresh access token using refresh token.

**Headers:**

```
Authorization: Bearer <refresh-token>
```

**Response:**

```json
{
  "accessToken": "string"
}
```

#### GET `/auth/profile`

Get authenticated user's profile.

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "string",
    "email": "string",
    "roles": ["string"]
  }
}
```

---

### User Endpoints

#### POST `/user/register`

Register a new user.

**Request Body:**

```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "surname": "string"
}
```

**Response:**

```json
{
  "_id": "ObjectId",
  "email": "string",
  "name": "string",
  "surname": "string",
  "roles": ["user"]
}
```

#### GET `/user/profile`

Get current user's profile (requires authentication).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "_id": "ObjectId",
  "email": "string",
  "name": "string",
  "surname": "string",
  "roles": ["string"]
}
```

#### GET `/user/admin`

Admin-only endpoint (requires admin role).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Admin content"
}
```

---

### Categories Endpoints

#### POST `/categories`

Create a new category (admin only).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Request Body:**

```json
{
  "cate_name": "string",
  "cate_cover_url": "string"
}
```

**Response:**

```json
{
  "_id": "ObjectId",
  "cate_name": "string",
  "cate_cover_url": "string"
}
```

#### GET `/categories`

Get all categories (authenticated users).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
[
  {
    "_id": "ObjectId",
    "cate_name": "string",
    "cate_cover_url": "string"
  }
]
```

#### GET `/categories/:id`

Get category by ID (authenticated users).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "_id": "ObjectId",
  "cate_name": "string",
  "cate_cover_url": "string"
}
```

#### PATCH `/categories/:id`

Update category (admin only).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Request Body:**

```json
{
  "cate_name": "string",
  "cate_cover_url": "string"
}
```

#### DELETE `/categories/:id`

Delete category (admin only).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Category deleted successfully"
}
```

---

### Books Endpoints

#### POST `/books`

Create a new book (admin only).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Request Body:**

```json
{
  "book_name": "string",
  "book_author": "string",
  "book_description": "string",
  "book_cover_image_url": "string",
  "book_reader_url": "string",
  "book_borrow_count": 0,
  "categories": ["ObjectId"]
}
```

#### GET `/books`

Get all books (authenticated users).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
[
  {
    "_id": "ObjectId",
    "book_name": "string",
    "book_author": "string",
    "book_description": "string",
    "book_cover_image_url": "string",
    "book_reader_url": "string",
    "book_borrow_count": 0,
    "categories": [
      {
        "_id": "ObjectId",
        "cate_name": "string"
      }
    ]
  }
]
```

#### GET `/books/suggestions`

Get top borrowed books (authenticated users).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Query Parameters:**

- `limit` (optional): Number of books to return (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "book_name": "string",
      "book_author": "string",
      "book_borrow_count": 5,
      "categories": []
    }
  ],
  "total": 5,
  "message": "Top 10 most borrowed books retrieved successfully"
}
```

#### GET `/books/:id`

Get book by ID (authenticated users).

#### PATCH `/books/:id`

Update book (admin only).

#### DELETE `/books/:id`

Delete book (admin only).

#### POST `/books/:bookId/borrow`

Borrow a book (authenticated users).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Book borrowed successfully",
  "token": "uuid-string",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/books/:bookId/read`

Read a book (requires book token).

**Headers:**

```
Authorization: Bearer <access-token>
book-token: <book-access-token>
```

**Response:**

```json
{
  "message": "Access granted to book",
  "bookId": "ObjectId",
  "expiresAt": "2024-01-01T00:00:00.000Z",
  "token": "uuid-string"
}
```

---

### Transactions Endpoints

#### GET `/transactions/my-transactions`

Get current user's transactions.

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
[
  {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "bookId": {
      "name": "string",
      "author": "string",
      "coverImage": "string"
    },
    "startTime": "2024-01-01T00:00:00.000Z",
    "token": "uuid-string",
    "expiresAt": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
]
```

#### GET `/transactions`

Get all transactions (admin only).

#### GET `/transactions/user/:userId`

Get transactions by user ID (admin only).

#### GET `/transactions/active`

Get active transactions for current user.

---

## Data Schemas

### User Schema

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  name: string,
  surname: string,
  roles: string[] // default: ['user']
}
```

### Category Schema

```typescript
{
  _id: ObjectId,
  cate_name: string,
  cate_cover_url: string
}
```

### Book Schema

```typescript
{
  _id: ObjectId,
  book_name: string,
  book_author: string,
  book_description: string,
  book_cover_image_url: string,
  book_reader_url: string,
  book_borrow_count: number, // default: 0
  categories: [
    {
      _id: ObjectId,
      cate_name: string
    }
  ]
}
```

### Transaction Schema

```typescript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  bookId: ObjectId, // Reference to Book
  startTime: Date, // default: Date.now
  token: string, // unique UUID
  expiresAt: Date, // default: 7 days from creation
  isActive: boolean // default: true
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Not Found"
}
```

---

## Role-Based Access Control

- **admin**: Can create, update, delete books and categories; can view all transactions
- **user**: Can view books and categories; can borrow books; can view own transactions

