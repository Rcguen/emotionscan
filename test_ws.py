import asyncio
import websockets
import sys

async def test_ws(url):
    try:
        async with websockets.connect(url) as ws:
            print(f"Success with {url}")
            return True
    except Exception as e:
        print(f"Failed with {url}: {e}")
        return False

async def main():
    key = "SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq"
    await test_ws(f"wss://api.hume.ai/v0/stream/models?apikey={key}")
    await test_ws(f"wss://api.hume.ai/v0/stream/models?api_key={key}")

asyncio.run(main())
