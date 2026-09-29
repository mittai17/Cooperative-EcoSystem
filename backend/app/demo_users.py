"""Fixed allowlist of demo accounts for the mobile demo login.

These are the ONLY identities POST /api/v1/auth/demo-login can ever issue a
Clerk sign-in ticket for. Admin / institution / employer / NCCT roles are
deliberately absent and must never be added here.
"""
from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class DemoAccount:
    role: str
    email: str
    first_name: str
    last_name: str
    external_id: str  # stable key used to find the Clerk user idempotently
    clerk_org_id: str = "org_3JuDps9pToYytp56TVQeh2Z3UJw"
    institution_key: str = "vamnicom"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


DEMO_ACCOUNTS: Dict[str, DemoAccount] = {
    "trainee": DemoAccount(
        role="trainee",
        email="demo.trainee@coopsetu.example.com",
        first_name="Ravindra Suresh",
        last_name="Patil",
        external_id="coopsetu-demo-trainee",
        clerk_org_id="org_3JuDps9pToYytp56TVQeh2Z3UJw",  # Institutions
    ),
    "trainer": DemoAccount(
        role="trainer",
        email="demo.trainer@coopsetu.example.com",
        first_name="Dr. Meera",
        last_name="Deshmukh",
        external_id="coopsetu-demo-trainer",
        clerk_org_id="org_3JuDps9pToYytp56TVQeh2Z3UJw",  # Institutions
    ),
    "institution": DemoAccount(
        role="institution",
        email="demo.institution@coopsetu.example.com",
        first_name="Prof. K. S.",
        last_name="Rao",
        external_id="coopsetu-demo-institution",
        clerk_org_id="org_3JuDps9pToYytp56TVQeh2Z3UJw",  # Institutions
    ),
    "employer": DemoAccount(
        role="employer",
        email="demo.employer@coopsetu.example.com",
        first_name="Ramesh",
        last_name="Verma",
        external_id="coopsetu-demo-employer",
        clerk_org_id="org_3JuDq6UqDKMazOZEkpaS9yy2HLn",  # Employers
    ),
    "admin": DemoAccount(
        role="admin",
        email="demo.admin@coopsetu.example.com",
        first_name="Dr. Anita",
        last_name="Sharma",
        external_id="coopsetu-demo-admin",
        clerk_org_id="org_3JuDpiq9fMIaoraENb94kHLdXu7",  # NCCT
    ),
}

VAMNICOM_ORG_NAME = "Vaikunth Mehta National Institute of Cooperative Management"
