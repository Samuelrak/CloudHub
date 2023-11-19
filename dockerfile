FROM node:20 as build

WORKDIR /app/Front-end

COPY Front-end/package*.json ./
RUN npm install

COPY Front-end/ .
RUN npm run build

FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install -r Back-end/requirements.txt
RUN pip install mysql-connector

COPY --from=build /app/Front-end/build /app/Back-end/Front-end/build

WORKDIR /app/Back-end

EXPOSE 8000

CMD ["python", "server.py"]
