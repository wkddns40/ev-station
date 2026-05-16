"""Pytest fixtures for backend tests.

mysql.connector is mocked at module-load time so importing charger_api never
touches a real DB. Per-test fixtures swap in row sets via `fake_db_rows`.
"""
from __future__ import annotations

import sys
import types
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock

import pytest


@pytest.fixture(autouse=True, scope="session")
def _mock_mysql_connector():
    """Replace mysql.connector with a MagicMock so charger_api imports clean."""
    fake_module = types.ModuleType("mysql")
    fake_connector = types.ModuleType("mysql.connector")
    fake_connector.connect = MagicMock()  # patched per-test below
    fake_module.connector = fake_connector
    sys.modules.setdefault("mysql", fake_module)
    sys.modules["mysql.connector"] = fake_connector
    yield


@pytest.fixture
def fake_db_rows() -> list[dict[str, Any]]:
    """Default row set, one row covering all required columns."""
    return [
        {
            "LONGITUDE": "127.0053",
            "LATITUDE": "37.4199",
            "ADDRESS": "서울특별시 강남구",
            "CHARGER_NAME": "강남 충전소 1",
            "MODE_NAME": "fast-mode",
            "MNFACR_NAME": "BlueOne",
            "CHARGER_ID": "C001",
            "VOLT_TYPE": "급속",
        }
    ]


@pytest.fixture
def app(fake_db_rows, monkeypatch):
    """Flask app with `mysql.connector.connect` patched to return our rows."""
    import mysql.connector

    cursor = MagicMock()
    cursor.fetchall.return_value = fake_db_rows
    connection = MagicMock()
    connection.cursor.return_value = cursor
    mysql.connector.connect = MagicMock(return_value=connection)

    # Re-import charger_api fresh for each test to reset the SimpleCache.
    for mod_name in list(sys.modules.keys()):
        if mod_name == "charger_api":
            del sys.modules[mod_name]

    import charger_api

    charger_api.app.config["TESTING"] = True
    yield charger_api.app


@pytest.fixture
def client(app) -> Iterator[Any]:
    with app.test_client() as c:
        yield c
