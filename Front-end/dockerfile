FROM node:20 as build

WORKDIR /app

COPY . .

COPY package*.json ./

RUN npm install

RUN npm install stripe

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
