FROM python:slim-bookworm

# Install build tools and Python headers
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    python3-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

#install Backend
WORKDIR /Backend

# Copy only requirements.txt first
COPY /Backend/requirements.txt /Backend

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /

#copy all
COPY . .

#install Frontend
WORKDIR /Frontend

RUN npm install

WORKDIR /

RUN chmod +x ./startup.sh

CMD ["./startup.sh"]

##run with sudo docker run -it -p 14553:14553/udp -p 5173:5173 1112luke/krakenground











