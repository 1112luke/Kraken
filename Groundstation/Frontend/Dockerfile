FROM python:slim-bookworm

# Install build tools and Python headers
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /Frontend

#copy all
COPY . .

RUN npm install

CMD ["npm", "run", "dev"]