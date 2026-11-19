import os

from dotenv import load_dotenv

load_dotenv()

WIKI_USER_AGENT = os.getenv(
    "WIKI_USER_AGENT",
    "Duta/0.1 (local development; set WIKI_USER_AGENT in backend/.env)",
)