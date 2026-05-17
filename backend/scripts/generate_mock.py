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

REGION_PROVINCES = [
    ("seoul",    0.50, "서울특별시"),
    ("gyeonggi", 0.30, "경기도"),
    ("jeju",     0.20, "제주특별자치도"),
]

DISTRICT_SUB_BBOXES = {
    "서울특별시": {
        "강남구":   [((127.034, 127.062), (37.499, 37.524))],
        "서초구":   [((127.002, 127.026), (37.478, 37.500))],
        "송파구":   [((127.095, 127.120), (37.500, 37.520))],
        "마포구":   [((126.900, 126.925), (37.548, 37.568))],
        "성동구":   [((127.030, 127.055), (37.545, 37.565))],
        "용산구":   [((126.968, 126.995), (37.522, 37.542))],
        "종로구":   [((126.970, 126.995), (37.568, 37.588))],
    },
    "경기도": {
        "수원시":   [((127.015, 127.045), (37.255, 37.285))],
        "성남시":   [((127.125, 127.158), (37.405, 37.435))],
        "고양시":   [((126.775, 126.815), (37.638, 37.668))],
        "용인시":   [((127.115, 127.150), (37.230, 37.260))],
        "부천시":   [((126.755, 126.782), (37.488, 37.512))],
        "안산시":   [((126.820, 126.852), (37.305, 37.335))],
        "안양시":   [((126.948, 126.970), (37.385, 37.405))],
    },
    "제주특별자치도": {
        "제주시":   [((126.498, 126.548), (33.485, 33.510))],
        "서귀포시": [((126.555, 126.582), (33.245, 33.265))],
    },
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


def region_for_index(rng: random.Random) -> tuple[str, str]:
    r = rng.random()
    acc = 0.0
    for name, share, province in REGION_PROVINCES:
        acc += share
        if r < acc:
            return name, province
    return REGION_PROVINCES[-1][0], REGION_PROVINCES[-1][2]


def generate_feature(rng: random.Random, index: int, base_time: datetime) -> dict:
    region_name, province = region_for_index(rng)
    district = rng.choice(list(DISTRICT_SUB_BBOXES[province].keys()))
    sub_bbox = rng.choice(DISTRICT_SUB_BBOXES[province][district])
    (lon_lo, lon_hi), (lat_lo, lat_hi) = sub_bbox

    lon = round(rng.uniform(lon_lo, lon_hi), 6)
    lat = round(rng.uniform(lat_lo, lat_hi), 6)

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
            "coordinates": [lon, lat],
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
