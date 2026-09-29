"""Public, secret-free integration capabilities (not upstream health checks)."""
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter()


def integration_capabilities(settings):
    requirements = {
        "gemini": ("gemini_api_key",),
        "moodle": ("moodle_url", "moodle_token"),
        "youtube": ("youtube_api_key",),
        "adzuna": ("adzuna_app_id", "adzuna_app_key"),
        "jooble": ("jooble_api_key",),
        "bhashini": ("bhashini_user_id", "bhashini_api_key"),
        "face": ("face_model_pack", "face_match_threshold", "face_min_det_score"),
        "fcm": ("fcm_service_account_file",),
        "remotive": (), "the_muse": (), "swayam": (), "nptel": (),
    }
    # Configuration alone must never advertise an unimplemented adapter.
    implemented = {"gemini"}
    result = {}
    for name, fields in requirements.items():
        configured = all(getattr(settings, field, None) is not None and
                         bool(str(getattr(settings, field)).strip()) for field in fields)
        available = configured and name in implemented
        result[name] = {
            "configured": configured,
            "implemented": name in implemented,
            "available": available,
            "status": "ready" if available else "not_implemented" if configured else "not_configured",
        }
    return {"integrations": result, "health_checked": False,
            "features": {"notification_inbox": True, "remote_push": False}}


@router.get("/integrations")
async def integrations():
    return integration_capabilities(get_settings())
