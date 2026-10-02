import asyncio
from hume import AsyncHumeClient

async def main():
    try:
        client = AsyncHumeClient(api_key="SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq")
        async with client.empathic_voice.chat.connect() as connection:
            print("Successfully connected to Hume via SDK!")
    except Exception as e:
        print("SDK Error:", e)

asyncio.run(main())
