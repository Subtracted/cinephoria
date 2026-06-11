FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src/ ./src/
COPY sql/ ./sql/

EXPOSE 5000

CMD ["node", "src/app.js"]
