import logging
import smtplib
from email.message import EmailMessage

from app.config import settings
from app.models import Notification


def deliver(notification: Notification) -> bool:
    """Send one notification over SMTP. Returns False when SMTP is not configured."""
    if not settings.smtp_host or not settings.smtp_from:
        logging.info("smtp not configured, notification %s stored only", notification.id)
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = notification.recipient
    message["Subject"] = notification.subject
    message.set_content(notification.body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
    return True
