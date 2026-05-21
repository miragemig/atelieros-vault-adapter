import argparse
import json
from pathlib import Path

from zeusComputerControlCore import computer_control


ROOT = Path(__file__).resolve().parents[1]


def log_send_active(result: str, approved_by: str) -> None:
    log_dir = ROOT / "hermes" / "send-now"
    log_dir.mkdir(parents=True, exist_ok=True)
    entry = {
        "id": f"send-active-{__import__('time').time_ns()}",
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "approvedBy": approved_by,
        "result": result,
        "source": "zeusComputerControl.py",
    }
    (log_dir / f"{entry['id']}.json").write_text(
        json.dumps(entry, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="ZEUS runtime computer control")
    parser.add_argument("action")
    parser.add_argument("--text", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--key", default="")
    parser.add_argument("--keys", default="")
    parser.add_argument("--path", default="")
    parser.add_argument("--direction", default="down")
    parser.add_argument("--type", default="")
    parser.add_argument("--field", default="")
    parser.add_argument("--approved-by", default="")
    parser.add_argument("--seconds", type=float, default=1.0)
    parser.add_argument("--amount", type=int, default=3)
    parser.add_argument("--x", type=int)
    parser.add_argument("--y", type=int)
    parser.add_argument("--x1", type=int)
    parser.add_argument("--y1", type=int)
    parser.add_argument("--x2", type=int)
    parser.add_argument("--y2", type=int)
    args = parser.parse_args()

    if args.action == "send-active":
        if args.approved_by != "Miguel":
            print("Blocked. Explicit approval required: --approved-by Miguel")
            return 2

        result = computer_control(
            parameters={
                "action": "hotkey",
                "keys": "ctrl+enter",
            }
        )
        log_send_active(result, args.approved_by)
        print(result)
        return 0

    result = computer_control(
        parameters={
            "action": args.action,
            "text": args.text,
            "description": args.description,
            "title": args.title,
            "key": args.key,
            "keys": args.keys,
            "path": args.path,
            "direction": args.direction,
            "type": args.type,
            "field": args.field,
            "seconds": args.seconds,
            "amount": args.amount,
            "x": args.x,
            "y": args.y,
            "x1": args.x1,
            "y1": args.y1,
            "x2": args.x2,
            "y2": args.y2,
        }
    )
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
