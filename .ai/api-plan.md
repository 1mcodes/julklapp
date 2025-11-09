# REST API Plan

## 1. Resources
- **Users** (`users` table)
- **Draws** (`draws` table)
- **Participants** (`draw_participants` table)
- **Matches** (`matches` table)
- **AI Suggestions** (`ai_suggestions` table)

## 2. Endpoints

### 2.1 Draws & Participants

#### Create Draw with Participants
- Method: POST
- Path: /api/draws
- Description: Create a draw with 3–32 participants
- Request:
  {
    "name": "string",
    "participants": [
      {
        "name": "string",
        "surname": "string",
        "email": "string",
        "gift_preferences": "string (max 10000 chars)"
      }, ...
    ]
  }
- Response 201:
  {
    "id": "UUID",
    "name": "string",
    "created_at": "timestamp"
  }
- Validation:
  - participants.length between 3 and 32
  - gift_preferences <= 10000 chars
- Errors:
  - 400: validation errors

#### Get Author's Draws
- Method: GET
- Path: /api/draws
- Description: List draws for current author
- Query:
  - page (int), size (int), sort (string)
- Response 200:
  [{ "id","name","created_at" }, ...]
- Errors:
  - 401: unauthorized

#### Get Draw Participants
- Method: GET
- Path: /api/draws/{drawId}/participants
- Description: List participants in a draw
- Response 200:
  [{ "id","name","surname","email","gift_preferences" }, ...]
- Errors:
  - 404: draw not found
  - 403: forbidden


### 2.2 Matching

#### Run Matching Algorithm
- Method: POST
- Path: /api/draws/{drawId}/match
- Description: Generate matches, provision accounts
- Response 200:
  { "message": "Matches created" }
- Errors:
  - 400: already matched
  - 404: draw not found
  - 403: forbidden

### 2.3 AI Gift Suggestions

#### List Participant Matches
- Method: GET
- Path: /api/me/matches
- Description: List all matches for the current participant
- Query:
  - page (int), size (int), sort (string)
- Response 200:
  [
    {
      "match_id": "UUID",
      "draw_id": "UUID",
      "recipient": {
        "name": "string",
        "surname": "string",
        "email": "string"
      }
    }, ...
  ]
- Errors:
  - 401: unauthorized

#### Get Match Details
- Method: GET
- Path: /api/me/matches/{matchId}
- Description: Get details of a specific match for the current participant
- Response 200:
  {
    "match_id": "UUID",
    "draw_id": "UUID",
    "recipient": {
      "id": "UUID",
      "name": "string",
      "surname": "string",
      "email": "string",
      "gift_preferences": "string"
    }
  }
- Errors:
  - 404: match not found or forbidden
  - 401: unauthorized

#### Get AI Suggestions for a Match
- Method: GET
- Path: /api/me/matches/{matchId}/suggestions
- Description: Return cached or fresh AI suggestions for a specific match
- Query:
  - refresh (bool, optional) force refresh
- Response 200:
  { "suggestions": [string] }
- Errors:
  - 404: match not found or forbidden
  - 502: AI service timeout after 30s
  - 500: internal error


## 3. Authentication and Authorization
- Token based Supabase Auth.
- Middleware verifies token and sets `auth.user_id` and `auth.role`.
- Authorization:
  - Authors can access /api/draws and sub-resources they own.
  - Participants can only access /api/me/* endpoints.
  - Participatns also can create own draws
- RLS policies enforce row-level access in the database.

## 4. Validation and Business Logic
- **Draw creation**: 3≤participants≤32, gift_preferences≤10000.
- **No draw modification/deletion**: no PUT/DELETE on /api/draws.
- **Matching**: Enforce uniqueness and no self-match; uses DB constraints (UNIQUE, CHECK).
- **Account provisioning**: After matching, create `users` for participants with `password_set_at=null`.
- **First-time password**: Only allowed if `password_set_at=null`, updates `password_set_at`.
- **AI suggestions**: Up to 3 retries within 30s; store JSON in `ai_suggestions.data`; indefinite cache.
- **Pagination/Filtering**: List endpoints support `page`, `size`, `sort`, and filters by `name`, `email` where applicable.

---
*Assumptions:*
- Using Express.js / Node.js with Supabase SDK.
- All errors return JSON `{ code, message, details? }`.
