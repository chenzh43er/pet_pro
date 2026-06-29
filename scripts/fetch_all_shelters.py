"""Fetch all city office lists from findpawpal.com and build shelters.json index."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> None:
    skip = "--skip-existing" in sys.argv
    state = None
    for arg in sys.argv[1:]:
        if arg.startswith("--state="):
            state = arg.split("=", 1)[1]

    office_cmd = [sys.executable, str(SCRIPTS / "fetch_shelter_offices.py")]
    if skip:
        office_cmd.append("--skip-existing")
    if state:
        office_cmd.append(f"--state={state}")

    run(office_cmd)
    run([sys.executable, str(SCRIPTS / "build_shelters_index.py")])


if __name__ == "__main__":
    main()
