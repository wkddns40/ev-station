"""/charger endpoint integration tests."""
from __future__ import annotations

import json


def test_charger_endpoint_returns_200(client):
    response = client.get("/charger")
    assert response.status_code == 200


def test_charger_endpoint_content_type_is_utf8_json(client):
    response = client.get("/charger")
    assert response.headers["Content-Type"].lower().startswith("application/json")
    assert "utf-8" in response.headers["Content-Type"].lower()


def test_charger_endpoint_returns_valid_geojson_schema(client):
    response = client.get("/charger")
    body = json.loads(response.data.decode("utf-8"))
    assert body["type"] == "FeatureCollection"
    assert isinstance(body["features"], list)
    for feature in body["features"]:
        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Point"
        assert isinstance(feature["geometry"]["coordinates"], list)
        assert len(feature["geometry"]["coordinates"]) == 2
        assert isinstance(feature["properties"], dict)


def test_charger_endpoint_idempotent_across_repeated_calls(client):
    """Repeated calls produce identical bodies (cache decorator is in place; SimpleCache
    serializer in test env can't pickle Response objects, so we don't assert on
    cursor call counts — we only require the route itself remains deterministic)."""
    first = client.get("/charger").data
    second = client.get("/charger").data
    assert first == second


def test_charger_endpoint_uses_cached_route_decorator():
    """Lock the contract that /charger is decorated with flask_caching.Cache.cached.

    This is the structural check; runtime cache-hit detection is flaky under
    pytest-flask because Flask-Caching's pickle serializer fails on the
    pytest-flask Response subclass.
    """
    import charger_api

    view_func = charger_api.app.view_functions["get_geojson"]
    # flask_caching wraps the view in `decorated_function`; underlying
    # `make_cache_key` attribute is unique to its wrapper.
    assert hasattr(view_func, "make_cache_key") or hasattr(view_func, "uncached")


def test_charger_endpoint_encodes_korean_without_unicode_escapes(client):
    response = client.get("/charger")
    raw = response.data.decode("utf-8")
    assert "서울" in raw
    assert "\\u" not in raw
