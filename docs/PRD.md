# Product Requirements (Draft)
Product Requirements Document (PRD)
Project Title: Scorely
Description:
Scorely is a social music rating platform designed for people tracking and reflecting on
the music they listen to. Unlike streaming platforms that focus on playing music, Scorely focuses on allowing users to rate songs, write reviews, and keep track of their listening history.
After conducting the client interview, several features were simplified to keep the project
manageable. The first version of the app will focus mainly on songs rather than albums and
artists since categorizing all three would add unnecessary complexity.
Users will be able to search for songs, rate them from one to 5 stars, and optionally write short reviews. The system will store a user’s rating history so they can view their listening activity over time. Users can also create profiles and add friends to see what music others are rating. This allows people to discover new music through their friends instead of through algorithm-driven recommendations.
The main goal of Scorely is to provide a simple platform where music listeners can reflect on
their music taste and discover new songs through social connections

Scope:
Based on the Analyst’s Level 1 Specification, Scorely will include features in five epics:
•	discover music, manage accounts, connect with friends, archive listening, and rate music 


Technical Architecture
Frontend (Client):
•	React + Vite + TypeScript (PWA, mobile-first design)
•	TailwindCSS + shadcn/ui components (Radix primitives, accessible + customizable)
•	React Router for navigation
•	Deployed via AWS Amplify
Backend (API Layer):
•	Express.js REST API (Node.js)
o	Serves as the single gateway for all data operations
o	Handles authentication, validation, and routing
o	Organizes CRUD endpoints by feature area (e.g., /vendors, /berries, /reviews)
o	Middleware for logging, error handling, and request validation
•	All CRUD operations go through the API — the frontend must not call Supabase DB directly
Database & Authentication:
•	Supabase (Postgres-based) for:
o	Data persistence
o	Authentication (OTP email code; role-based access)
o	Realtime subscriptions (optional for v1)
•	API connects to Supabase using Supabase client or pg driver under the hood
•	Authentication approach:
  •	Frontend may call Supabase Auth (OTP email code) directly to obtain a session/JWT
  •	API also exposes OTP wrappers (/auth/otp/start, /auth/otp/verify) for future clients and policy controls
  •	All protected API routes require Authorization: Bearer <JWT>
Deployment Strategy:
•	Frontend: AWS Amplify (continuous deployment from GitHub)
•	API Layer: Deployed as serverless functions:
o	AWS Lambda (preferred) — Express wrapped with serverless-http
•	Database: Managed directly in Supabase cloud instance
Development Tools:
•	GitHub for version control and collaboration
•	Windsurf IDE for coding environment
•	Trello for task management
•	Slack for team communication
Key Considerations:
•	Separation of Concerns: Clear distinction between frontend (UI), API (business logic), and DB (persistence).
•	Role-Based Access: API enforces role permissions (e.g., shopper vs vendor).
•	Environment Variables: API keys stored in .env (never committed).
•	Scalability: Architecture is overkill for a class project, but reflects industry practices.