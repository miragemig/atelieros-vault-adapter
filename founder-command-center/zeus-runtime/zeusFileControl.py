import argparse

from zeusFileControllerCore import file_controller


def main() -> int:
    parser = argparse.ArgumentParser(description="ZEUS runtime file controller")
    parser.add_argument("action", help="Ação: list, read, write, copy, move, info, etc.")
    parser.add_argument("--path", default="desktop")
    parser.add_argument("--name", default="")
    parser.add_argument("--content", default="")
    parser.add_argument("--destination", default="")
    parser.add_argument("--new-name", default="")
    parser.add_argument("--extension", default="")
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--max-results", type=int, default=20)
    parser.add_argument("--append", action="store_true")
    args = parser.parse_args()

    result = file_controller(
        parameters={
            "action": args.action,
            "path": args.path,
            "name": args.name,
            "content": args.content,
            "destination": args.destination,
            "new_name": args.new_name,
            "extension": args.extension,
            "count": args.count,
            "max_results": args.max_results,
            "append": args.append,
        }
    )
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
