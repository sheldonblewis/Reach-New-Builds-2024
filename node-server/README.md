
## Getting started

1. cd node-server
1. npm install
1. npm run db:init
1. npm run start:ngrok
1. Get the url from https://dashboard.ngrok.com/endpoints
1. Set the url as BASE_URL in [expo config](../expo/config/node.ts)

## Useful endpoints:

### Spotify auth

- Client calls `{BASE_URL}/spotify/auth`
- Server responds with Spotify login page
- Client redirected to `{BASE_URL}/spotify/callback`
- Server redirects to client with user_id query parameter

### Get genre categories

- Client calls GET`{BASE_URL}/genres/categories`
- Server responds with list of genre categories
- Client populates dropdown

### Get next track

- Client calls POST `{BASE_URL}/spotify/next-track`
- Client sends `X-User-ID` header and `category` body
- Server responds with next track

### Play track

- Client calls POST `{BASE_URL}/spotify/play`
- Client sends `X-User-ID` header and `uri` body
- Server calls Spotify API to play track
- Server responds with success

