#!/usr/bin/env python
import argparse
import os
import sys

from dotenv import load_dotenv

from operational_careflow_ai___intelligence_layer.crew import OperationalCareflowAiIntelligenceLayerCrew

load_dotenv()


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value in (None, ""):
        return default
    return int(raw_value)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Operational CareFlow AI submission artifact generation.")
    parser.add_argument("command", nargs="?", default="run", choices=["run", "train", "replay", "test"])
    parser.add_argument("--location-key", default=os.getenv("LOCATION_KEY", "US"))
    parser.add_argument("--data-file", default=os.getenv("DATA_FILE_PATH", ""))
    parser.add_argument("--icu-capacity", type=int, default=_env_int("TOTAL_ICU_CAPACITY", 50))
    parser.add_argument("--ventilator-capacity", type=int, default=_env_int("TOTAL_VENTILATORS", 20))
    parser.add_argument("--bed-capacity", type=int, default=_env_int("TOTAL_BED_CAPACITY", 200))
    return parser.parse_args(argv)


def _get_inputs_from_env_and_cli(argv: list[str] | None = None):
    args = _parse_args(argv)

    return {
        "location_key": args.location_key,
        "data_file_path": args.data_file,
        "total_icu_capacity": args.icu_capacity,
        "total_ventilators": args.ventilator_capacity,
        "total_bed_capacity": args.bed_capacity,
    }


def _run_pipeline() -> dict:
    inputs = _get_inputs_from_env_and_cli()
    return OperationalCareflowAiIntelligenceLayerCrew().build_submission_artifacts(inputs)


def run():
    """Generate the CareFlow submission artifacts with real Google COVID data and GPU benchmarks."""
    result = _run_pipeline()
    print(result["summary"])
    for label, path in result["outputs"].items():
        print(f"{label}: {path}")


def train():
    """Run the same artifact generation flow for training-style execution."""
    run()


def replay():
    """Replay is not implemented for the artifact-focused workflow."""
    print("Replay is not required for this submission-ready workflow.")
    run()


def test():
    """Run the artifact generation flow and return the result payload."""
    run()


if __name__ == "__main__":
    command = _parse_args(sys.argv[1:]).command
    if command == "run":
        run()
    elif command == "train":
        train()
    elif command == "replay":
        replay()
    elif command == "test":
        test()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
