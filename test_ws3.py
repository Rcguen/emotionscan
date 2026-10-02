import urllib.request

req = urllib.request.Request('https://api.hume.ai/v0/stream/models?api_key=SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq', headers={
    'Connection': 'Upgrade',
    'Upgrade': 'websocket',
    'Host': 'api.hume.ai',
    'Origin': 'http://localhost:5173',
    'Sec-WebSocket-Version': '13',
    'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read())
except Exception as e:
    print('Error:', e)
    if hasattr(e, 'read'):
        print(e.read())
