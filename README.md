# Pakistan Shopify Starter

Starter code for a Pakistan-first ecommerce SaaS.

## Included in this starter
- Next.js App Router
- Tailwind CSS
- Firebase Auth
- Firestore + Storage setup
- Signup / Login
- Protected seller app
- Create Store flow
- Seller dashboard
- Products placeholder page
- Settings page

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Firebase setup
1. Create a Firebase project
2. Enable Authentication -> Email/Password
3. Create Firestore database
4. Add your Firebase keys in `.env.local`

## Important collections
- users
- stores

## Current build scope
Phase 1 starter only:
- authentication
- user profile document
- create store flow
- dashboard shell

Next step after this:
- products CRUD
- storefront
- cart + COD checkout
- order management
