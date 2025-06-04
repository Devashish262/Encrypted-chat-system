# Encrypted Real-Time Chat

A secure, real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) that features message encryption, priority queues for urgent messages, and user authentication.

## Features

- **Real-time communication**: Messages are sent and received in real-time using Socket.io
- **Message encryption**: End-to-end encryption ensures secure communication
- **Priority queue**: Urgent messages are processed first
- **User authentication**: Secure login and registration with JWT
- **User status**: See when users are online, offline, or away
- **Responsive UI**: Modern and user-friendly interface

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- Bcrypt for password hashing
- Crypto for encryption

### Frontend
- React.js
- React Router for navigation
- Context API for state management
- Socket.io client for real-time communication
- CryptoJS for client-side encryption
- CSS for styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository:
```
git clone <repository-url>
cd encrypted-real-time-chat
```

2. Install server dependencies:
```
cd server
npm install
```

3. Install client dependencies:
```
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/encrypted-chat
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:3000
```

## Running the Application

1. Start the server:
```
cd server
npm run dev
```

2. Start the client:
```
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Docker Deployment

1. Copy `server/.env.example` to `server/.env` and adjust values if needed.
2. Run `docker-compose up --build`.
3. Visit `http://localhost:3000` in your browser.

## Vercel Deployment

1. Install the [Vercel CLI](https://vercel.com/docs/cli) globally:
   ```
   npm install -g vercel
   ```
2. Build the client application:
   ```
   cd client
   npm install
   npm run build
   cd ..
   ```
3. Deploy both the server API and the static client by running:
   ```
   vercel --prod
   ```
4. Configure the environment variables in the Vercel dashboard using the keys from `server/.env.example`.


## Usage

1. Register a new account or login with existing credentials
2. Start chatting with other users
3. Set message priority for urgent communications
4. Update your status to let others know your availability

## Security Features

- End-to-end encryption using AES-256-CBC
- Password hashing with bcrypt
- JWT for secure authentication
- HTTPS recommended for production

## License

This project is licensed under the MIT License.

## Acknowledgements

- Socket.io for real-time capabilities
- CryptoJS and Node.js Crypto for encryption
- MongoDB for database storage
- React for the frontend framework 