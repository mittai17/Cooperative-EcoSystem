import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp 
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#E30B1C",
            borderRadius: "0.75rem",
            fontFamily: "var(--font-dm-sans), sans-serif",
          },
          elements: {
            card: "border border-border shadow-lg",
            formButtonPrimary: "bg-primary hover:bg-primary-hover text-primary-foreground",
          },
        }}
      />
    </div>
  );
}
