# RESTful API Reference Specification
## AI Power Sales Intelligence System (Version 2.0)

Base URL: `http://localhost:5000/api/v1`
Health Check: `http://localhost:5000/api/health`

---

### Authentication Headers
For all protected endpoints, provide the JWT token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

---

### 1. System Health Check
#### `GET /api/health`
- **Access**: Public
- **Response** `200 OK`:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-27T15:20:37.306Z",
  "service": "AI Power Sales Intelligence System v2.0 API",
  "environment": "development",
  "version": "2.0.0"
}
```

---

### 2. Authentication Endpoints (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
- **Access**: Public (Rate-limited: 50 requests / 15m)
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@enterprise.com",
  "password": "Password123!",
  "role": "sales_rep",
  "department": "Inside Sales"
}
```
- **Response** `201 Created`: Returns JWT `token` and `user` object.
- **Errors**: `400 Bad Request` (validation failed), `409 Conflict` (duplicate email).

#### `POST /api/v1/auth/login`
- **Access**: Public (Rate-limited: 50 requests / 15m)
- **Request Body**:
```json
{
  "email": "admin@salesintel.ai",
  "password": "Password123!"
}
```
- **Response** `200 OK`: Returns JWT `token` and `user` object.
- **Errors**: `401 Unauthorized` (invalid credentials), `403 Forbidden` (account inactive).

#### `GET /api/v1/auth/me`
- **Access**: Private (Bearer Token)
- **Response** `200 OK`: Returns current authenticated user profile.

#### `GET /api/v1/auth/users`
- **Access**: Private
- **Response** `200 OK`: Returns active team members for assignment.

#### `PUT /api/v1/auth/profile`
- **Access**: Private
- **Request Body**: `{ "name": "...", "department": "..." }`
- **Response** `200 OK`: Returns updated user object.

---

### 3. Lead Management Endpoints (`/api/v1/leads`)

#### `GET /api/v1/leads`
- **Access**: Private
- **Query Parameters**:
  - `page` (integer, default 1)
  - `limit` (integer, default 10)
  - `search` (string, matches name, email, company, job title)
  - `status` (string, 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost')
  - `industry` (string)
  - `source` (string)
  - `priority` (string)
  - `aiCategory` ('Hot' | 'Warm' | 'Cold')
  - `sortBy` ('createdAt' | 'aiScore' | 'dealValue' | 'name')
  - `sortOrder` ('asc' | 'desc')
- **Response** `200 OK`:
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "total": 24,
    "page": 1,
    "pages": 3,
    "limit": 10
  },
  "leads": [...]
}
```

#### `GET /api/v1/leads/:id`
- **Access**: Private (Admin or assigned owner)
- **Response** `200 OK`: Returns lead object with populated references.
- **Errors**: `404 Not Found`, `403 Forbidden`.

#### `POST /api/v1/leads`
- **Access**: Private
- **Request Body**:
```json
{
  "name": "Elena Rostova",
  "email": "elena@cloudscale.io",
  "phone": "+1 555-234-5678",
  "company": "CloudScale Technologies",
  "jobTitle": "Chief Technology Officer",
  "industry": "Technology",
  "source": "Website",
  "dealValue": 78000,
  "status": "Negotiation",
  "priority": "Urgent",
  "notes": "Enterprise security requirements evaluation."
}
```
- **Response** `201 Created`: Lead created with automatically computed `aiScore`, `aiCategory`, `aiFactors`, and `nextBestAction`.

#### `PUT /api/v1/leads/:id`
- **Access**: Private
- **Request Body**: Partial or full update payload.
- **Response** `200 OK`: Returns updated lead with automatically re-evaluated AI score.

#### `DELETE /api/v1/leads/:id`
- **Access**: Private (Admin or lead owner)
- **Response** `200 OK`: Cascade deletes lead, activities, and tasks.

#### `POST /api/v1/leads/:id/activities`
- **Access**: Private
- **Request Body**:
```json
{
  "type": "call",
  "title": "Discovery call with VP of Engineering",
  "description": "Reviewed security SLA terms.",
  "metadata": { "nextFollowUpAt": "2026-11-01" }
}
```
- **Response** `201 Created`: Activity logged, `lastContactedAt` updated on lead, AI score recalculated.

#### `GET /api/v1/leads/:id/activities`
- **Access**: Private
- **Response** `200 OK`: Chronological activity history.

#### `GET /api/v1/leads/:id/insights`
- **Access**: Private
- **Response** `200 OK`: Returns factor breakdown, positive/negative drivers, and urgency rank.

#### `POST /api/v1/leads/import`
- **Access**: Private
- **Request Body**: Multipart form data with file attachment or `{ "csvText": "..." }`.
- **Response** `200 OK`: Returns `{ totalProcessed, importedCount, failedCount, errors: [...] }`.

#### `GET /api/v1/leads/export`
- **Access**: Private
- **Response** `200 OK`: Streamed CSV file with headers `Content-Type: text/csv`.

---

### 4. Sales Analytics Endpoints (`/api/v1/analytics`)

#### `GET /api/v1/analytics/overview`
- **Access**: Private
- **Query Parameter**: `timeframe` ('7d' | '30d' | '90d' | '1y' | 'all')
- **Response** `200 OK`: Returns summary metrics, status distribution, channel breakdown, top opportunities, and AI pipeline insights.

#### `GET /api/v1/analytics/conversions`
- **Access**: Private
- **Response** `200 OK`: Returns conversions by source, conversions by industry, lead score histogram brackets, and 6-month revenue trends.

---

### 5. Follow-Up Task Endpoints (`/api/v1/tasks`)

#### `GET /api/v1/tasks`
- **Access**: Private
- **Query Parameters**: `status`, `priority`, `leadId`, `overdue` ('true' | 'false')
- **Response** `200 OK`: Returns list of tasks matching query.

#### `POST /api/v1/tasks`
- **Access**: Private
- **Request Body**:
```json
{
  "title": "Send updated MSA to counsel",
  "description": "Redline compliance clause 4.",
  "lead": "<lead_id>",
  "dueDate": "2026-10-30",
  "priority": "High"
}
```
- **Response** `201 Created`.

#### `PATCH /api/v1/tasks/:id/toggle`
- **Access**: Private
- **Response** `200 OK`: Toggles status between `completed` and `pending`.
