"""Deterministic GeoJSON mock generator for demo mode (Phase 3 T3.1).

Run from repo root: `python backend/scripts/generate_mock.py`
Writes: frontend/public/sample-chargers.json (FeatureCollection, ~400 features).

Output shape matches `frontend/src/types/charger.ts` ChargerFeature.
"""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

SEED = 42
TARGET_COUNT = 400

REGIONS = [
    ("seoul",    0.50, (126.76, 127.18), (37.43, 37.69), "서울특별시"),
    ("gyeonggi", 0.30, (126.40, 127.50), (36.90, 37.95), "경기도"),
    ("jeju",     0.20, (126.15, 126.95), (33.20, 33.55), "제주특별자치도"),
]

DISTRICTS = {
    "서울특별시":         ["강남구", "서초구", "송파구", "마포구", "성동구", "용산구", "종로구"],
    "경기도":             ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시"],
    "제주특별자치도":     ["제주시", "서귀포시"],
}

MANUFACTURERS = ["BlueOne", "ChargePoint", "EVlink", "한국전력", "ChaeVi", "SK시그넷"]
MODELS = {
    "BlueOne":    ["BO-50", "BO-100", "BO-200"],
    "ChargePoint":["CP-100", "CP-250", "CP-500"],
    "EVlink":     ["EVL-T22", "EVL-T44", "EVL-DC50"],
    "한국전력":   ["KEPCO-50", "KEPCO-100"],
    "ChaeVi":     ["CV-S7", "CV-S22"],
    "SK시그넷":   ["SIG-100", "SIG-200", "SIG-350"],
}
VOLT_WEIGHTS = [("급속", 0.60), ("완속", 0.40)]


def weighted_choice(rng: random.Random, pairs: list[tuple[str, float]]) -> str:
    r = rng.random()
    acc = 0.0
    for value, weight in pairs:
        acc += weight
        if r < acc:
            return value
    return pairs[-1][0]


def region_for_index(rng: random.Random) -> tuple[str, tuple[float, float], tuple[float, float], str]:
    r = rng.random()
    acc = 0.0
    for name, share, lon, lat, label in REGIONS:
        acc += share
        if r < acc:
            return name, lon, lat, label
    return REGIONS[-1][0], REGIONS[-1][2], REGIONS[-1][3], REGIONS[-1][4]


def generate_feature(rng: random.Random, index: int, base_time: datetime) -> dict:
    region_name, (lon_lo, lon_hi), (lat_lo, lat_hi), province = region_for_index(rng)
    district = rng.choice(DISTRICTS[province])

    mfr = rng.choice(MANUFACTURERS)
    model = rng.choice(MODELS[mfr])
    volt = weighted_choice(rng, VOLT_WEIGHTS)
    efficiency = round(rng.gauss(mu=90.0, sigma=2.5), 1)
    efficiency = max(80.0, min(98.0, efficiency))
    speed = round(rng.gauss(mu=10.0, sigma=20.0))
    speed = max(-50, min(80, speed))

    timestamp = base_time + timedelta(minutes=rng.randint(0, 60 * 24 * 7))

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [
                round(rng.uniform(lon_lo, lon_hi), 6),
                round(rng.uniform(lat_lo, lat_hi), 6),
            ],
        },
        "properties": {
            "charger_id": f"C{index:04d}",
            "charger_name": f"{district} 충전소 {index:03d}",
            "mnfacr_name": mfr,
            "model_name": model,
            "volt_type": volt,
            "address": f"{province} {district}",
            "charging_efficiency": efficiency,
            "systemtime": timestamp.strftime("%Y-%m-%dT%H:%M:%S"),
            "speed": speed,
        },
    }


def main() -> None:
    rng = random.Random(SEED)
    base_time = datetime(2026, 5, 1, 0, 0, 0)

    features = [generate_feature(rng, i + 1, base_time) for i in range(TARGET_COUNT)]
    collection = {"type": "FeatureCollection", "features": features}

    out_path = Path(__file__).resolve().parents[2] / "frontend" / "public" / "sample-chargers.json"
    out_path.write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(features)} features → {out_path.relative_to(Path.cwd()) if Path.cwd() in out_path.parents else out_path}")


if __name__ == "__main__":
    main()
