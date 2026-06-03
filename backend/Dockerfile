FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir \
    --timeout 100 \
    --retries 10 \
    -i https://pypi.org/simple \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]