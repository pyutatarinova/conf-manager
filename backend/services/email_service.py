import os
import smtplib
from email.message import EmailMessage


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return str(raw).strip().lower() in {"1", "true", "yes", "y", "on"}


class EmailService:
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "localhost")
        self.port = int(os.getenv("SMTP_PORT", "1025"))
        self.username = os.getenv("SMTP_USER") or None
        self.password = os.getenv("SMTP_PASS") or None

        self.from_email = os.getenv("SMTP_FROM", "no-reply@conf.local")
        self.use_ssl = _env_bool("SMTP_USE_SSL", False)
        self.use_starttls = _env_bool("SMTP_USE_STARTTLS", False)

        self.timeout_s = int(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))

    def send_text(self, *, to_email: str, subject: str, text: str):
        msg = EmailMessage()
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(text or "")

        if self.use_ssl:
            with smtplib.SMTP_SSL(self.host, self.port, timeout=self.timeout_s) as server:
                self._login_if_needed(server)
                server.send_message(msg)
            return

        with smtplib.SMTP(self.host, self.port, timeout=self.timeout_s) as server:
            if self.use_starttls:
                server.starttls()
            self._login_if_needed(server)
            server.send_message(msg)

    def _login_if_needed(self, server):
        if self.username and self.password:
            server.login(self.username, self.password)

