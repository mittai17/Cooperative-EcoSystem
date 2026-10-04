"""DIKSHA / Sunbird integration exceptions."""


class DikshaError(Exception):
    """Base exception for all DIKSHA integration errors."""
    pass


class DikshaUnavailable(DikshaError):
    """Raised when DIKSHA upstream API cannot be reached or returns a 5xx/gateway error."""
    pass


class DikshaNotFound(DikshaError):
    """Raised when the requested content ID is not found on DIKSHA."""
    pass


class DikshaInvalidResponse(DikshaError):
    """Raised when DIKSHA upstream returns malformed JSON or unexpected schema."""
    pass


class DikshaLicensingRestricted(DikshaError):
    """Raised when a DIKSHA resource has licensing terms prohibiting playback or embedding."""
    pass
