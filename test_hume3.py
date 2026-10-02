import asyncio
from hume import AsyncHumeClient

async def main():
    try:
        client = AsyncHumeClient(api_key="SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq")
        async with client.expression_measurement.stream.connect() as connection:
            print("Successfully connected to Hume stream/models via SDK!")
    except Exception as e:
        print("SDK Error:", e)

asyncio.run(main())
