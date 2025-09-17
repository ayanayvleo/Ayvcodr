# Custom AI API Platform

This project is a modular FastAPI platform that allows users to build and customize their own AI APIs, running locally for privacy and sustainability. The initial feature is a text analysis endpoint. You can easily add more endpoints and AI features as needed.

## Features
- Local, private, and customizable AI API
- No dependency on large data centers
- Extensible for any workflow (HR, education, health, etc.)

## Getting Started

1. Install dependencies:
   ```sh
   pip install fastapi uvicorn[standard] pydantic
   ```
2. Run the API server:
   ```sh
   uvicorn main:app --reload
   ```
3. Access the docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Example Endpoint
- `/analyze` (POST): Returns text length and word count.

## Extending the Platform
- Add new endpoints in `main.py` following the FastAPI pattern.
- Integrate open-source AI models for advanced features.

---

*This platform empowers you to create your own AI solutions, tailored to your needs, with no ties to big tech or data centers.*
