# API Contracts - Time Capsule App

## 1. Authentication

### POST /api/auth/register
Creates a new user account

### POST /api/auth/login
Authenticates a user and return a JWT

### POST /api/auth/logout
Logs the current user out and ends their authenticated session

## 2. Users

### GET /api/users/me
Returns the currently authenticated user's profile

### PUT /api/users/me
Updates the currently authenticated user's profile

## 3. Friends

### GET /api/friends
Returns the current user's friends

### POST /api/friends/{userId}
Sends a friend request to another user

### DELETE /api/friends/{userId}
Removes a friend or cancels the friendship

## 4. Groups

### POST /api/groups
Creates a new time capsule group

### GET /api/groups
Returns the groups the current user belongs to

### GET /api/groups/{groupId}
Returns information about a specific group

### POST /api/groups/{groupId}/members
Adds the current user to a group

### DELETE /api/groups/{groupId}/members/me
Removes the current user from a group

### GET /api/groups/{groupId}/members
Returns the member of a group

## 5. Capsules

### POST /api/capsules
Creates a new capsule

### GET /api/capsules/{capsuleId}
Returns information about a time capsule

### GET /api/capsules/{capsuleId}/memories
Returns the memories ina  capsule after it has opened

## 6. Memories

### POST /api/capsules/{capsuleId}/memories/photo
Uploads a photo to a time capsule

### POST /api/capsules/{capsuleId}/memories/note
Adds a note to a time capsule

### GET /api/memories/{memoryId}
Returns a specific memory

### DELETE /api/memories/{memoryId}
Deletes a memory

## 7. Memory Map

### GET /api/capsules/{capsuleId}/map
Returns the location associated with memories in an opened capsule

## 8. Calendar

### GET /api/capsules/{capsuleId}/calendar
Returns memories organized by the dated they were uploaded

## 9. Videos

### GET /api/video-templates
Returns the available video templates

### POST /api/capsules/{capsuleId}/videos
Creates a video from the memories in a capsule using a selected template

### GET /api/videos/{videoId}
Returns the status and information for a generated video

## 10. Notifications

### GET /api/notifications
Returns notifications for the current user

### PUT /api/notifications/{notificationId}/read
Marks a notification as read

## 11. WebSockets

### memory.created
Sent when a new memory is added

### notification.created
Sent when a new notification is generated

### message.created
Sent when a direct message is received

### capsule.opened
Sent when a time capsule becomes available 

### video.completed
Sent when a generated video is finished

## 12. JWT Authentication

### Login Flow
1. User submits their email and password
2. Server verifies the credentials
3. Server generates a JWT
4. JWT is returned to the client
5. Client uses the JWT when maming authenticated requests

### Token Validation
Protected endpoints verify that the JWT is valid before processing the request

### Token Expiration
Expired JWTs cannot be used to access protected resources

### Authorization
USers can only access resources they are authorized to access, such as their own profile and groups they belong to

