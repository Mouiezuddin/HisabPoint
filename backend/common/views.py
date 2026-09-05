# pyrefly: ignore [missing-import]
from django.http import HttpResponse


def api_root_view(request):
    """Clean landing page when navigating to http://127.0.0.1:8000/ directly in browser."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Ledger API</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .card { background: white; border-radius: 1.5rem; padding: 2.5rem; max-width: 520px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0; text-align: center; }
        .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #f0fdf4; color: #16a34a; font-weight: 600; font-size: 0.875rem; padding: 0.375rem 0.875rem; border-radius: 9999px; margin-bottom: 1.25rem; border: 1px solid #dcfce7; }
        .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; }
        h1 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
        p { color: #64748b; font-size: 0.95rem; margin-bottom: 1.75rem; line-height: 1.5; }
        .btn-group { display: flex; flex-direction: column; gap: 0.75rem; }
        a.btn { text-decoration: none; display: flex; items-center: center; justify-content: center; font-weight: 600; font-size: 0.95rem; padding: 0.875rem 1.25rem; border-radius: 0.75rem; transition: all 0.15s ease; }
        a.btn-primary { background: #4f46e5; color: white; }
        a.btn-primary:hover { background: #4338ca; }
        a.btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        a.btn-secondary:hover { background: #e2e8f0; }
        .endpoints { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; text-align: left; }
        .endpoints h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.75rem; font-weight: 700; }
        .endpoint-item { display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace; color: #475569; padding: 0.35rem 0; }
        .method { color: #6366f1; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge"><span class="dot"></span> Backend Online</div>
        <h1>Digital Ledger API</h1>
        <p>The Python / Django REST Framework backend is up and running. Use the React Web App to access the full shopkeeper interface.</p>

        <div class="btn-group">
            <a href="http://localhost:5173" class="btn btn-primary">Open Web Application (localhost:5173) &rarr;</a>
            <a href="/admin/" class="btn btn-secondary">Django Admin Console</a>
        </div>

        <div class="endpoints">
            <h3>Active API Endpoints</h3>
            <div class="endpoint-item"><span>/api/health/</span> <span class="method">GET (Health Check)</span></div>
            <div class="endpoint-item"><span>/api/auth/</span> <span class="method">POST / GET</span></div>
            <div class="endpoint-item"><span>/api/customers/</span> <span class="method">GET / POST</span></div>
            <div class="endpoint-item"><span>/api/transactions/</span> <span class="method">GET / POST</span></div>
            <div class="endpoint-item"><span>/api/dashboard/</span> <span class="method">GET</span></div>
            <div class="endpoint-item"><span>/api/business/</span> <span class="method">GET / PATCH</span></div>
        </div>
    </div>
</body>
</html>"""
    return HttpResponse(html)


def health_check_view(request):
    """API health check endpoint for monitoring and uptime probes."""
    from django.http import JsonResponse
    return JsonResponse({
        "status": "ok",
        "service": "HisabPoint Digital Ledger API",
        "version": "1.0.0"
    })

