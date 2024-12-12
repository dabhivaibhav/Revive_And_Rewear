from src.config.database import users
from fastapi import HTTPException
from smtp import Smtp
import random
from datetime import datetime, timedelta

class MFAService:
    def __init__(self):
        self.verification_codes = {}
        self.max_attempts = 3
        self.code_expiry_minutes = 10
        self.attempt_counts = {}

    def generate_verification_code(self, email: str) -> str:
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expiry_time = datetime.now() + timedelta(minutes=self.code_expiry_minutes)
        self.verification_codes[email] = {
            'code': code,
            'expiry': expiry_time,
            'attempts': 0
        }
        return code

    async def send_verification_code(self, email: str) -> bool:
        try:
            code = self.generate_verification_code(email)
            user = await users.find_one({"email": email})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            Smtp.trigger_email(
                email,
                "Your Login Verification Code",
                f"""
                Hi {user['first_name']},

                Your verification code is: {code}

                This code will expire in {self.code_expiry_minutes} minutes.

                Best regards,
                Revive & Rewear Team
                """
            )
            return True
        except Exception as e:
            print(f"Error sending verification code: {e}")
            return False

    async def verify_code(self, email: str, code: str) -> bool:
        if email not in self.verification_codes:
            raise HTTPException(status_code=400, detail="No verification code found")

        stored_data = self.verification_codes[email]
        
        if datetime.now() > stored_data['expiry']:
            del self.verification_codes[email]
            raise HTTPException(status_code=400, detail="Code expired")

        if stored_data['attempts'] >= self.max_attempts:
            del self.verification_codes[email]
            raise HTTPException(status_code=400, detail="Too many attempts")

        stored_data['attempts'] += 1
        
        if stored_data['code'] != code:
            remaining_attempts = self.max_attempts - stored_data['attempts']
            if remaining_attempts == 0:
                del self.verification_codes[email]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid code. {remaining_attempts} attempts remaining"
            )

        del self.verification_codes[email]
        return True

    async def is_mfa_enabled(self, email: str) -> bool:
        try:
            user = await users.find_one({"email": email})
            return user.get('mfa_enabled', False) if user else False
        except Exception as e:
            return False

mfa_service = MFAService()