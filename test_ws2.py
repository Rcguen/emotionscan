import urllib.request
try:
    urllib.request.urlopen('https://api.hume.ai/v0/stream/models?apikey=SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq')
    print('apikey works')
except Exception as e:
    print('apikey:', e)
try:
    urllib.request.urlopen('https://api.hume.ai/v0/stream/models?api_key=SGeRxFmtQc3sI5ebaIzEANQjml1qLFYOpfwYPQkBIsnM93sq')
    print('api_key works')
except Exception as e:
    print('api_key:', e)
