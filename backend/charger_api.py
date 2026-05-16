import json
import logging
import os
from collections import OrderedDict

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, make_response
from flask_caching import Cache
from flask_cors import CORS

load_dotenv()
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)
app.config['JSON_AS_ASCII'] = False
cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=int(os.environ.get('DB_PORT', '3306')),
            user=os.environ.get('DB_USER', ''),
            password=os.environ.get('DB_PASSWORD', ''),
            database=os.environ.get('DB_NAME', '')
        )
        logging.debug('Connected to the database')
        return connection
    except Exception:
        logging.error('Error connecting to the database:', exc_info=True)
        raise

def fetch_data():
    try:
        connection = get_db_connection()
        logging.debug('Connected to the database')
    except Exception:
        logging.error('Error connecting to the database:', exc_info=True)
        raise

    cursor = connection.cursor(dictionary=True)

    query = "SELECT * FROM VO_CHARGER;"
    cursor.execute(query)
    result = cursor.fetchall()

    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for row in result:
        feature = OrderedDict([
            ("type", "Feature"),
            ("geometry", OrderedDict([
                ("type", "Point"),
                ("coordinates", [
                    float(row['LONGITUDE']),
                    float(row['LATITUDE'])
                ])
            ])),
            ("properties", OrderedDict([
                ("address", row['ADDRESS']),
                ("charger_name", row['CHARGER_NAME']),
                ("mode_name", row['MODE_NAME']),
                ("mnfacr_name", row['MNFACR_NAME']),
                ("charger_id", row['CHARGER_ID']),
                ("volt_type", row['VOLT_TYPE'])
            ]))
        ])
        geojson["features"].append(feature)

    cursor.close()
    connection.close()

    return geojson

@app.route("/charger")
@cache.cached(timeout=60)
def get_geojson():
    geojson_data = fetch_data()
    response = make_response(json.dumps(geojson_data, ensure_ascii=False, indent=2))
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

if __name__ == "__main__":
    debug_mode = os.environ.get('FLASK_ENV', 'production').lower() == 'development'
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_PORT', '5000'))
    app.run(debug=debug_mode, host=host, port=port)
