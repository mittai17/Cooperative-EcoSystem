"""Reviewed and draft translation overlays for authored content."""
from collections.abc import Iterable
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import ContentTranslation, SUPPORTED_LANGS


async def resolve_translations(
    db: AsyncSession, entity_type: str, rows: Iterable, lang: str
) -> tuple[dict, dict]:
    """Return {id: translated fields} and {id: translation status}.

    Missing fields retain their English value at the call site. Unknown languages
    and unpublished/missing translations return an empty overlay.
    """
    ids = [row.id for row in rows]
    if lang == "en" or lang not in SUPPORTED_LANGS or not ids:
        return {}, {}
    result = await db.execute(
        select(ContentTranslation).where(
            ContentTranslation.entity_type == entity_type,
            ContentTranslation.entity_id.in_(ids),
            ContentTranslation.lang == lang,
        )
    )
    translations = result.scalars().all()
    return (
        {item.entity_id: item.fields or {} for item in translations},
        {item.entity_id: item.status for item in translations},
    )
