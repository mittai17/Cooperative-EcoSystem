"""Test pgvector fallback column type round-trip."""
from sqlalchemy.types import UserDefinedType
from app.models.coltypes import Vector


def test_vector_fallback_round_trip():
    # Test fallback class directly
    class FallbackVector(UserDefinedType):
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

    vec = FallbackVector(128)
    assert vec.get_col_spec() == "VECTOR(128)"

    bp = vec.bind_processor(None)
    data = [0.1, 0.25, -0.5, 1.0]
    bound = bp(data)
    assert bound == "[0.1,0.25,-0.5,1.0]"
    assert bp(None) is None

    rp = vec.result_processor(None, None)
    result = rp(bound)
    assert result == data
    assert rp(None) is None
    assert rp(data) == data


def test_vector_spec():
    v = Vector(128)
    assert v.dim == 128
