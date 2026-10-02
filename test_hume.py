import asyncio
from hume import HumeStreamClient

async def main():
    try:
        client = HumeStreamClient("SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq")
        async with client.connect() as connection:
            print("Successfully connected to Hume via SDK!")
    except Exception as e:
        print("SDK Error:", e)

asyncio.run(main())
