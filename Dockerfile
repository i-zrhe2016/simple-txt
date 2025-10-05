FROM node:18-alpine
WORKDIR /usr/src/app

# Install deps first for better layer caching
COPY package.json ./
RUN npm install --only=production

# Copy app files
COPY public ./public
COPY server.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
