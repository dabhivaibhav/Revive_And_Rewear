from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

class Smtp:
    def __init__(self) -> None:
        pass
    def trigger_email(email,subject,body):
        sender_email = "randrteamsmtp@gmail.com"  
        sender_password = "nbvs isya khzx tnjq"  
        

        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = subject

        message.attach(MIMEText(body, "plain"))

        try:
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
            server.quit()
            print(f"Registration email sent to {email}")
        except Exception as e:
            print(f"Failed to send email: {e}")
