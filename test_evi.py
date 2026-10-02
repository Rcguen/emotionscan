import asyncio
import websockets
import json

async def test_evi():
    uri = "wss://api.hume.ai/v0/evi/chat?api_key=SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq"
    try:
        async with websockets.connect(uri) as ws:
            print("Connected to EVI!")
            msg = await ws.recv()
            print("Received:", msg)
    except Exception as e:
        print("EVI Error:", e)

asyncio.run(test_evi())
