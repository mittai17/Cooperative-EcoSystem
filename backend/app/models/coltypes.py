"""Shared SQLAlchemy column types.

`Vector(dim)` maps to pgvector's `vector(dim)`. It uses the `pgvector` package
when installed (it is pinned in requirements.txt) and otherwise falls back to a
minimal text-format implementation so the server and Alembic work without it.
Values are python lists of floats on both paths.
"""
try:  # pragma: no cover - depends on the environment
    from pgvector.sqlalchemy import Vector  # type: ignore
except ImportError:  # pragma: no cover
    from sqlalchemy.types import UserDefinedType

    class Vector(UserDefinedType):  # type: ignore[no-redef]
        cache_ok = True

        def __init__(self, dim: int | None = None):
            self.dim = dim

        def get_col_spec(self, **kw):
            return "VECTOR" if self.dim is None else f"VECTOR({self.dim})"

        def bind_processor(self, dialect):
            def process(value):
                if value is None:
                    return None
                return "[" + ",".join(repr(float(x)) for x in value) + "]"

            return process

        def result_processor(self, dialect, coltype):
            def process(value):
                if value is None:
                    return None
                if isinstance(value, str):
                    return [float(x) for x in value.strip("[]").split(",") if x != ""]
                return list(value)

            return process

__all__ = ["Vector"]
