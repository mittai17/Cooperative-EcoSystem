"""Domain seed registry.

Feature modules register an async callable receiving an AsyncSession. The
caller supplies a scratch database session and owns the transaction. Legacy
app.seed and app.seed_mobile remain explicit commands until their data has
been moved into domain modules; importing this package never seeds a database.
"""
from collections.abc import Awaitable, Callable
from sqlalchemy.ext.asyncio import AsyncSession

Seed = Callable[[AsyncSession], Awaitable[None]]
DOMAIN_ORDER = ("profiles", "programmes", "learning", "schedule", "assessments",
                "attendance", "employer", "career", "translations")
_registry: dict[str, Seed] = {}


def register(domain: str, seed: Seed) -> None:
    if domain not in DOMAIN_ORDER:
        raise ValueError(f"Unknown seed domain: {domain}")
    if domain in _registry:
        raise ValueError(f"Seed domain already registered: {domain}")
    _registry[domain] = seed


async def run(db: AsyncSession, domains: tuple[str, ...] | None = None) -> list[str]:
    selected = DOMAIN_ORDER if domains is None else domains
    unknown = set(selected) - set(DOMAIN_ORDER)
    if unknown:
        raise ValueError(f"Unknown seed domains: {', '.join(sorted(unknown))}")
    completed = []
    for domain in selected:
        if domain in _registry:
            await _registry[domain](db)
            completed.append(domain)
    return completed
