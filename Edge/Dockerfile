FROM arm64v8/python:3.12

# Install system dependencies for building Python packages
RUN apt-get clean && apt-get update --allow-releaseinfo-change && apt-get install -y \
    gcc \
    g++ \
    libpython3-dev \
    libffi-dev \
    libssl-dev \
    make \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . . 

CMD ["python", "./Drone.py"]


