FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

WORKDIR /app/Front-end

RUN npm install
RUN npm run build

WORKDIR /app/Back-end

EXPOSE 8000

CMD ["python", "server.py"]