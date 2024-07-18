from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


limiter = Limiter(key_func=get_remote_address)


def _custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom rate limit exceeded handler. Simple wrapper around slowapi's handler to ensure that
    we properly raise an HTTPException with status code 429.

    :param request: request object
    :param exc: RateLimitExceeded exception

    """
    _ = _rate_limit_exceeded_handler(request, exc)
    raise HTTPException(
        status_code=429,
        detail="You are requesting too many new keys. Please try again later.",
    )
