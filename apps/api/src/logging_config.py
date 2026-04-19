"""Gecentraliseerde logging configuratie met structlog."""
import logging
import structlog


def configure_logging(environment: str) -> None:
    """Configureer structlog voor de gehele applicatie.

    Args:
        environment: De omgevingsnaam ('development', 'test', 'production').
                     ConsoleRenderer in development/test, JSONRenderer in production.
                     Standaard velden per log-entry: timestamp, level, logger, request_id.
    """
    is_production = environment == "production"
    log_level = logging.INFO if is_production else logging.DEBUG

    logging.basicConfig(format="%(message)s", level=log_level)

    shared_processors: list = [
        structlog.stdlib.add_logger_name,       # voegt "logger" veld toe
        structlog.stdlib.add_log_level,          # voegt "level" veld toe
        structlog.contextvars.merge_contextvars,  # voegt "request_id" e.d. toe
        structlog.processors.TimeStamper(fmt="iso"),  # voegt "timestamp" veld toe
        structlog.processors.StackInfoRenderer(),
    ]

    if is_production:
        processors = [
            *shared_processors,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = [
            *shared_processors,
            structlog.dev.ConsoleRenderer(),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
