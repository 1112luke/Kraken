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
COPY requirements.txt /Backend

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

#copy all
COPY . .

CMD ["python3", "handoff.py"]