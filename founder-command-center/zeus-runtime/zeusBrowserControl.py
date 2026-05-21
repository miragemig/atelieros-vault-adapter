import argparse

from zeusBrowserControlCore import browser_control


def main() -> int:
    parser = argparse.ArgumentParser(description="ZEUS runtime browser control")
    parser.add_argument("action")
    parser.add_argument("--browser", default="")
    parser.add_argument("--url", default="")
    parser.add_argument("--query", default="")
    parser.add_argument("--engine", default="google")
    parser.add_argument("--selector", default="")
    parser.add_argument("--text", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--direction", default="down")
    parser.add_argument("--amount", type=int, default=500)
    parser.add_argument("--key", default="Enter")
    parser.add_argument("--path", default="")
    parser.add_argument("--target", default="")
    parser.add_argument("--incognito", action="store_true")
    parser.add_argument("--clear-first", action="store_true")
    args = parser.parse_args()

    result = browser_control(
        parameters={
            "action": args.action,
            "browser": args.browser,
            "url": args.url,
            "query": args.query,
            "engine": args.engine,
            "selector": args.selector,
            "text": args.text,
            "description": args.description,
            "direction": args.direction,
            "amount": args.amount,
            "key": args.key,
            "path": args.path,
            "target": args.target,
            "incognito": args.incognito,
            "clear_first": args.clear_first,
        }
    )
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
