#!/usr/bin/env python3
"""Master release readiness gate for Carbon-Ceramic 001.

A contract can validate while all four specialists remain BLOCKED.
This deliberately distinguishes a legal handoff from an integrated film.
This check is deterministic, offline and has no side effects.
"""
import argparse
import json
import re
from pathlib import Path

PROJECT = "production/videos/carbon-ceramic-001"
BASE_SHA = "25a83c4e58e60c909624494745158385b7f962d9"
SPECIALISTS = {
    "a": ("hardware", "a-hardware", "src/brakes001/hardware/"),
    "b": ("engineering", "b-motion-thermal", "src/brakes001/motion/"),
    "c": ("director", "c-cinema-xray", "src/brakes001/cinema/"),
    "d": ("qa", "d-graphics-qa", "src/brakes001/graphics/"),
}


def evaluate(repo: Path) -> dict:
    """Report what exists on this checked-out MASTER branch, not on remote agents."""
    folder = repo / PROJECT
    reasons = []
    specialists = {}
    for letter, (owner, branch_suffix, expected_prefix) in SPECIALISTS.items():
        handoff_path = folder / "handoffs" / f"agent-{letter}.json"
        agent_reasons = []
        try:
            data = json.loads(handoff_path.read_text(encoding="utf8"))
        except (OSError, ValueError) as exc:
            data = {}
            agent_reasons.append(f"Missing/invalid JSON handoff: {exc}")
        expected_branch = "automotive-brakes-001/" + branch_suffix
        if data.get("owner") != owner or data.get("branch") != expected_branch:
            agent_reasons.append("Handoff does not match assigned role and branch")
        if data.get("status") != "ready":
            agent_reasons.append(f"Handoff status is {data.get('status', 'missing')}, not ready")
        sha = data.get("sourceSha", "")
        if not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha) or sha == BASE_SHA:
            agent_reasons.append("No valid specialist implementation source SHA")
        files = data.get("files")
        if not isinstance(files, list) or not any(
            isinstance(name, str) and name.startswith(expected_prefix) for name in files
        ):
            agent_reasons.append(f"No owned source file listed under {expected_prefix}")
        else:
            for name in files:
                if not isinstance(name, str) or name.startswith("/") or ".." in Path(name).parts:
                    agent_reasons.append("Unsafe/non-string file path in handoff")
                elif not (repo / name).is_file():
                    agent_reasons.append(f"Not yet integrated onto Master: {name}")
        evidence = data.get("evidence")
        if not isinstance(evidence, list) or not any(
            isinstance(item, str) and item.strip() for item in evidence
        ):
            agent_reasons.append("No nonempty proof evidence")
        specialists[letter] = {
            "branch": expected_branch,
            "sourceSha": sha,
            "status": data.get("status", "missing"),
            "integrated": not agent_reasons,
            "reasons": agent_reasons,
        }
        reasons.extend(f"Agent {letter.upper()}: {reason}" for reason in agent_reasons)

    try:
        brief = json.loads((folder / "brief.json").read_text(encoding="utf8"))
    except (OSError, ValueError) as exc:
        brief = {}
        reasons.append(f"Missing/invalid brief: {exc}")
    if brief.get("status") != "implemented":
        reasons.append("Film is not marked implemented; a planning contract is not footage")
    if brief.get("sourceCompositionId") != "CarbonCeramic001":
        reasons.append("Real CarbonCeramic001 composition is not registered in brief")
    try:
        root = (repo / "src/Root.tsx").read_text(encoding="utf8")
    except OSError:
        root = ""
    if 'id="CarbonCeramic001"' not in root:
        reasons.append("CarbonCeramic001 is absent from src/Root.tsx")
    if not (repo / "src/brakes001/CarbonCeramic001.tsx").is_file():
        reasons.append("Master integration source is missing")
    if brief.get("fps") != 30 or brief.get("durationInFrames") != 750 or brief.get("resolution") != [1080, 1920]:
        reasons.append("Film timing/resolution deviates from the contract")
    return {
        "project": "carbon-ceramic-001",
        "releaseReadyForRendering": not reasons,
        "specialists": specialists,
        "blockers": reasons,
        "note": "A green gate permits rendering only; real full decode and independent D visual signoff are still required.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--report", type=Path)
    parser.add_argument("--require-ready", action="store_true")
    args = parser.parse_args()
    report = evaluate(args.repo)
    serialized = json.dumps(report, indent=2) + "\n"
    print(serialized, end="")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(serialized, encoding="utf8")
    return 2 if args.require_ready and not report["releaseReadyForRendering"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
