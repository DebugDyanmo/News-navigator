from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    GROQ_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # pgvector via Supabase (optional for local demo).
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    # Groq embedding model.
    GROQ_EMBEDDING_MODEL: str = "nomic-embed-text-v1_5"
    GROQ_CHAT_MODEL: str = "llama-3.1-70b-versatile"

    # OpenAI chat model (reasoning-heavy).
    OPENAI_CHAT_MODEL: str = "gpt-4o"

    # pgvector.
    PGVECTOR_EMBEDDING_DIM: int = 1536


settings = Settings()

