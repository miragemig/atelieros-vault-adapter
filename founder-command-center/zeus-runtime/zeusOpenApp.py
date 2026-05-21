import argparse
import sys

from zeusOpenAppCore import open_app


def main() -> int:
    parser = argparse.ArgumentParser(description="ZEUS runtime app launcher")
    parser.add_argument("app_name", nargs="+", help="Nome da aplicação a abrir")
    args = parser.parse_args()

    result = open_app(parameters={"app_name": " ".join(args.app_name)})
    print(result)
    return 0 if not result.lower().startswith("failed") else 1


if __name__ == "__main__":
    raise SystemExit(main())
