"""Dev-only mock backend for Phase 1 smoke testing.

Serves a static GeoJSON fixture at /charger so the frontend can be exercised
without MySQL. Production backend remains charger_api.py.
"""
import json
import os

from flask import Flask, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['JSON_AS_ASCII'] = False

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), 'fixtures', 'chargers.geojson')
with open(FIXTURE_PATH, encoding='utf-8') as f:
    GEOJSON = json.load(f)


@app.route('/charger')
def chargers():
    response = make_response(json.dumps(GEOJSON, ensure_ascii=False, indent=2))
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


@app.route('/health')
def health():
    return {'status': 'ok', 'features': len(GEOJSON.get('features', []))}


if __name__ == '__main__':
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_PORT', '5000'))
    app.run(debug=False, host=host, port=port)
