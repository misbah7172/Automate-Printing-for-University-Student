# Raspberry Pi Print Agent

FROM python:3.11-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cups \
    cups-client \
    libcups2-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY config.env.example ./

# Create non-root user
RUN useradd -r -s /bin/false -g lp printuser

# Create necessary directories
RUN mkdir -p /tmp/print-jobs && \
    chown printuser:lp /tmp/print-jobs

# Switch to non-root user
USER printuser

# Expose HTTP port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "src/print_agent.py"]