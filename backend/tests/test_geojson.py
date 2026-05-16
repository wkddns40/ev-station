"""Row → Feature mapper tests via charger_api.fetch_data()."""
from __future__ import annotations

import json


def test_fetch_data_returns_feature_collection_shape(app):
    """Happy path — single row produces one FeatureCollection with one Feature."""
    import charger_api

    result = charger_api.fetch_data()
    assert result["type"] == "FeatureCollection"
    assert isinstance(result["features"], list)
    assert len(result["features"]) == 1


def test_fetch_data_maps_row_columns_to_geojson_keys(app):
    import charger_api

    result = charger_api.fetch_data()
    feat = result["features"][0]
    assert feat["type"] == "Feature"
    assert feat["geometry"]["type"] == "Point"
    assert feat["geometry"]["coordinates"] == [127.0053, 37.4199]
    props = feat["properties"]
    assert props["address"] == "서울특별시 강남구"
    assert props["charger_name"] == "강남 충전소 1"
    assert props["mnfacr_name"] == "BlueOne"
    assert props["charger_id"] == "C001"
    assert props["volt_type"] == "급속"


def test_fetch_data_preserves_property_key_order(app):
    """OrderedDict key order must match the route's documented contract."""
    import charger_api

    result = charger_api.fetch_data()
    props_keys = list(result["features"][0]["properties"].keys())
    assert props_keys == [
        "address",
        "charger_name",
        "mode_name",
        "mnfacr_name",
        "charger_id",
        "volt_type",
    ]


def test_fetch_data_coordinates_are_numeric(app):
    """LONGITUDE / LATITUDE are stored as strings in DB; mapper must cast to float."""
    import charger_api

    result = charger_api.fetch_data()
    lng, lat = result["features"][0]["geometry"]["coordinates"]
    assert isinstance(lng, float)
    assert isinstance(lat, float)


def test_fetch_data_serializes_to_valid_geojson_json(app):
    """Output round-trips through json.dumps / json.loads (no OrderedDict edge cases)."""
    import charger_api

    result = charger_api.fetch_data()
    roundtripped = json.loads(json.dumps(result, ensure_ascii=False))
    assert roundtripped["type"] == "FeatureCollection"
    assert roundtripped["features"][0]["properties"]["address"] == "서울특별시 강남구"


def test_fetch_data_with_multiple_rows():
    """Smoke: N rows → N features, in input order."""
    import sys
    from unittest.mock import MagicMock

    import mysql.connector

    rows = [
        {
            "LONGITUDE": "126.9784", "LATITUDE": "37.5665",
            "ADDRESS": "서울특별시 종로구", "CHARGER_NAME": "종로 충전소",
            "MODE_NAME": "fast", "MNFACR_NAME": "ChargePoint",
            "CHARGER_ID": "C002", "VOLT_TYPE": "급속",
        },
        {
            "LONGITUDE": "126.5312", "LATITUDE": "33.4996",
            "ADDRESS": "제주특별자치도 제주시", "CHARGER_NAME": "제주 충전소",
            "MODE_NAME": "slow", "MNFACR_NAME": "EVlink",
            "CHARGER_ID": "C003", "VOLT_TYPE": "완속",
        },
    ]
    cursor = MagicMock()
    cursor.fetchall.return_value = rows
    connection = MagicMock()
    connection.cursor.return_value = cursor
    mysql.connector.connect = MagicMock(return_value=connection)

    for mod_name in list(sys.modules.keys()):
        if mod_name == "charger_api":
            del sys.modules[mod_name]
    import charger_api

    result = charger_api.fetch_data()
    assert len(result["features"]) == 2
    assert [f["properties"]["charger_id"] for f in result["features"]] == ["C002", "C003"]
